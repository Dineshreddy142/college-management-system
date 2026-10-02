import pool from '../db.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET /api/campus/blocks
 * Fetch all campus building blocks with floor & room metrics
 */
export const getAllCampusBlocks = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT b.*,
             d.name as department_name,
             (SELECT COUNT(*) FROM block_floors WHERE block_id = b.id) as floor_count,
             (SELECT COUNT(*) FROM floor_rooms r JOIN block_floors f ON r.floor_id = f.id WHERE f.block_id = b.id) as total_rooms
      FROM campus_blocks b
      LEFT JOIN departments d ON b.department_id = d.id
      ORDER BY b.code ASC
    `);

    return successResponse(res, 'Campus blocks retrieved successfully', { blocks: rows });
  } catch (err) {
    console.error('[GET CAMPUS BLOCKS ERROR]:', err);
    return errorResponse(res, 'Failed to fetch campus blocks', [], 500);
  }
};

/**
 * POST /api/campus/blocks
 * Admin creates a new campus building block
 */
export const createCampusBlock = async (req, res) => {
  try {
    const { code, name, buildingType, departmentId, totalFloors } = req.body;

    if (!code || !name) {
      return errorResponse(res, 'Block code and name are required', [], 400);
    }

    const [resDb] = await pool.execute(
      `INSERT INTO campus_blocks (code, name, building_type, department_id, total_floors)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), building_type = VALUES(building_type)`,
      [code, name, buildingType || 'Academic', departmentId || null, totalFloors || 4]
    );

    return successResponse(res, 'Campus block created successfully', { blockId: resDb.insertId });
  } catch (err) {
    console.error('[CREATE CAMPUS BLOCK ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to create campus block', [], 500);
  }
};

/**
 * GET /api/campus/blocks/:blockId/floors
 * Fetch floors for a building block
 */
export const getBlockFloors = async (req, res) => {
  try {
    const { blockId } = req.params;

    const [rows] = await pool.execute(`
      SELECT f.*,
             (SELECT COUNT(*) FROM floor_rooms WHERE floor_id = f.id) as room_count,
             (SELECT COUNT(*) FROM floor_corridors WHERE floor_id = f.id) as corridor_count
      FROM block_floors f
      WHERE f.block_id = ?
      ORDER BY f.floor_number ASC
    `, [blockId]);

    return successResponse(res, 'Block floors retrieved successfully', { floors: rows });
  } catch (err) {
    console.error('[GET BLOCK FLOORS ERROR]:', err);
    return errorResponse(res, 'Failed to fetch block floors', [], 500);
  }
};

/**
 * POST /api/campus/blocks/:blockId/floors
 * Admin creates a floor with custom dimensions (Width x Length meters & Canvas Pixels)
 */
export const createBlockFloor = async (req, res) => {
  try {
    const { blockId } = req.params;
    const { floorNumber, name, widthMeters, lengthMeters, pixelWidth, pixelHeight } = req.body;

    const [resDb] = await pool.execute(
      `INSERT INTO block_floors
        (block_id, floor_number, name, floor_width_meters, floor_length_meters, canvas_pixel_width, canvas_pixel_height)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), floor_width_meters = VALUES(floor_width_meters), floor_length_meters = VALUES(floor_length_meters)`,
      [
        blockId,
        floorNumber !== undefined ? floorNumber : 0,
        name || `Floor ${floorNumber}`,
        widthMeters || 60.0,
        lengthMeters || 40.0,
        pixelWidth || 1600.0,
        pixelHeight || 1000.0
      ]
    );

    return successResponse(res, 'Floor created successfully', { floorId: resDb.insertId });
  } catch (err) {
    console.error('[CREATE BLOCK FLOOR ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to create block floor', [], 500);
  }
};

/**
 * GET /api/campus/floors/:floorId/live-occupancy
 * LIVE 2D OCCUPANCY ENGINE: Merges 2D Canvas Rooms + Corridors + Live Master Timetable
 */
export const getLiveFloorOccupancy = async (req, res) => {
  try {
    const { floorId } = req.params;

    // 1. Fetch Floor Header Details
    const [fRows] = await pool.execute(
      `SELECT f.*, b.name as block_name, b.code as block_code
       FROM block_floors f
       JOIN campus_blocks b ON f.block_id = b.id
       WHERE f.id = ?`,
      [floorId]
    );

    if (fRows.length === 0) {
      return errorResponse(res, 'Floor layout not found', [], 404);
    }
    const floor = fRows[0];

    // 2. Fetch Floor Corridors & Passageways
    const [corridors] = await pool.execute(
      `SELECT * FROM floor_corridors WHERE floor_id = ? ORDER BY id ASC`,
      [floorId]
    );

    // 3. Fetch Floor Rooms
    const [rooms] = await pool.execute(
      `SELECT * FROM floor_rooms WHERE floor_id = ? ORDER BY room_code ASC`,
      [floorId]
    );

    // 4. Calculate Current Day & Time Period
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    const currentTimeStr = now.toTimeString().split(' ')[0]; // '10:45:00'

    // 5. Query Master Timetable for Active/Upcoming Classes per Room Code
    const [timetableEntries] = await pool.execute(`
      SELECT t.id, t.room_number, t.day_of_week, t.start_time, t.end_time, t.section_id,
             sv.subject_code, sv.subject_name, f.name as faculty_name, sec.name as section_name
      FROM timetable t
      LEFT JOIN subject_versions sv ON t.subject_version_id = sv.id
      LEFT JOIN faculty f ON t.faculty_id = f.id
      LEFT JOIN sections sec ON t.section_id = sec.id
      WHERE t.day_of_week = ? OR t.day_of_week IS NULL
    `, [currentDay]);

    // Create lookup map by room_code (e.g. 'CSE-101')
    const roomScheduleMap = new Map();
    for (const tt of timetableEntries) {
      if (tt.room_number) {
        const key = String(tt.room_number).toUpperCase().trim();
        if (!roomScheduleMap.has(key)) roomScheduleMap.set(key, []);
        roomScheduleMap.get(key).push(tt);
      }
    }

    // Merge Live Occupancy Status into Rooms
    const processedRooms = rooms.map(rm => {
      const roomKey = String(rm.room_code).toUpperCase().trim();
      const schedules = roomScheduleMap.get(roomKey) || [];

      let occupancyStatus = 'VACANT';
      let activeClass = null;
      let displayColor = rm.fill_color || '#3B82F6';

      // Check if room is occupied during currentTimeStr
      for (const sch of schedules) {
        const startTime = sch.start_time || '09:00:00';
        const endTime = sch.end_time || '17:00:00';

        if (currentTimeStr >= startTime && currentTimeStr <= endTime) {
          occupancyStatus = 'OCCUPIED';
          activeClass = {
            subjectCode: sch.subject_code || 'CS501',
            subjectName: sch.subject_name || 'Ongoing Class',
            facultyName: sch.faculty_name || 'Faculty Member',
            sectionName: sch.section_name || 'Sec A',
            timeSlot: `${startTime.substring(0, 5)} - ${endTime.substring(0, 5)}`
          };
          displayColor = '#10B981'; // GREEN for ongoing class
          break;
        }
      }

      // If room category is RESTROOM, CABIN, or UTILITY, set specific colors
      if (rm.room_category === 'RESTROOM') displayColor = '#06B6D4';
      if (rm.room_category === 'CABIN') displayColor = '#F59E0B';
      if (rm.room_category === 'STAIRCASE' || rm.room_category === 'ELEVATOR') displayColor = '#64748B';

      return {
        ...rm,
        occupancyStatus,
        activeClass,
        displayColor
      };
    });

    return successResponse(res, 'Live floor occupancy retrieved successfully', {
      floor,
      corridors,
      rooms: processedRooms,
      currentTime: {
        day: currentDay,
        time: currentTimeStr,
        timestamp: now.toISOString()
      }
    });
  } catch (err) {
    console.error('[GET LIVE FLOOR OCCUPANCY ERROR]:', err);
    return errorResponse(res, 'Failed to fetch live floor occupancy', [], 500);
  }
};

/**
 * POST /api/campus/floors/:floorId/rooms
 * Admin adds or edits room shape, coordinates & category on floor
 */
export const addOrUpdateFloorRoom = async (req, res) => {
  try {
    const { floorId } = req.params;
    const { roomCode, name, roomCategory, seatingCapacity, xPos, yPos, width, height, rotationDeg, fillColor, hasProjector, hasAc, hasLabPcs } = req.body;

    if (!roomCode || !name) {
      return errorResponse(res, 'Room code and name are required', [], 400);
    }

    const [resDb] = await pool.execute(
      `INSERT INTO floor_rooms
        (floor_id, room_code, name, room_category, seating_capacity, x_pos, y_pos, width, height, rotation_deg, fill_color, has_projector, has_ac, has_lab_pcs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        name = VALUES(name), room_category = VALUES(room_category), seating_capacity = VALUES(seating_capacity),
        x_pos = VALUES(x_pos), y_pos = VALUES(y_pos), width = VALUES(width), height = VALUES(height),
        fill_color = VALUES(fill_color), has_projector = VALUES(has_projector), has_ac = VALUES(has_ac), has_lab_pcs = VALUES(has_lab_pcs)`,
      [
        floorId,
        roomCode,
        name,
        roomCategory || 'CLASSROOM',
        seatingCapacity || 60,
        xPos !== undefined ? xPos : 60,
        yPos !== undefined ? yPos : 60,
        width || 200,
        height || 140,
        rotationDeg || 0,
        fillColor || '#3B82F6',
        hasProjector !== undefined ? hasProjector : true,
        hasAc !== undefined ? hasAc : false,
        hasLabPcs !== undefined ? hasLabPcs : false
      ]
    );

    return successResponse(res, 'Room added/updated on floor plan successfully', { roomId: resDb.insertId });
  } catch (err) {
    console.error('[ADD/UPDATE FLOOR ROOM ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to save room on floor', [], 500);
  }
};

/**
 * POST /api/campus/floors/:floorId/corridors
 * Admin adds or edits corridor passageway on floor
 */
export const addOrUpdateFloorCorridor = async (req, res) => {
  try {
    const { floorId } = req.params;
    const { code, name, xPos, yPos, width, height, fillColor } = req.body;

    if (!code || !name) {
      return errorResponse(res, 'Corridor code and name are required', [], 400);
    }

    const [resDb] = await pool.execute(
      `INSERT INTO floor_corridors (floor_id, code, name, x_pos, y_pos, width, height, fill_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [floorId, code, name, xPos || 60, yPos || 240, width || 1000, height || 80, fillColor || '#E2E8F0']
    );

    return successResponse(res, 'Corridor saved on floor plan successfully', { corridorId: resDb.insertId });
  } catch (err) {
    console.error('[SAVE CORRIDOR ERROR]:', err);
    return errorResponse(res, err.message || 'Failed to save corridor on floor', [], 500);
  }
};
