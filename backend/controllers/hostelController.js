import pool from '../db.js';

// GET /api/hostels/blocks - List all hostel blocks with occupancy metrics
export const getHostelBlocks = async (req, res) => {
  try {
    const [blocks] = await pool.query(`
      SELECT hb.*,
             (SELECT COUNT(*) FROM hostel_allocations ha WHERE ha.block_id = hb.id AND ha.status = 'Active') as live_occupied_beds
      FROM hostel_blocks hb
      ORDER BY hb.name ASC
    `);

    const formatted = blocks.map(b => ({
      ...b,
      occupied_beds: Math.max(b.occupied_beds, b.live_occupied_beds || 0)
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[HOSTEL CONTROLLER ERROR - getHostelBlocks]:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving hostel blocks' });
  }
};

// POST /api/hostels/blocks - Create a new hostel block (Admin/Staff)
export const createHostelBlock = async (req, res) => {
  try {
    const { name, type, warden_name, warden_phone, total_rooms, total_beds } = req.body;

    if (!name || !type || !warden_name) {
      return res.status(400).json({ success: false, message: 'Block name, type, and warden name are required' });
    }

    const [result] = await pool.query(`
      INSERT INTO hostel_blocks (name, type, warden_name, warden_phone, total_rooms, total_beds, occupied_beds)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [name, type, warden_name, warden_phone || null, total_rooms || 50, total_beds || 150]);

    const [created] = await pool.query('SELECT * FROM hostel_blocks WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Hostel block created successfully', data: created[0] });
  } catch (error) {
    console.error('[HOSTEL CONTROLLER ERROR - createHostelBlock]:', error);
    res.status(500).json({ success: false, message: 'Server error creating hostel block' });
  }
};

// POST /api/hostels/allocate - Allocate room/bed to student
export const allocateStudent = async (req, res) => {
  try {
    const { student_id, block_id, room_number, bed_number } = req.body;

    if (!student_id || !block_id) {
      return res.status(400).json({ success: false, message: 'Student ID and Block ID are required' });
    }

    await pool.query(`
      INSERT INTO hostel_allocations (student_id, block_id, bed_number, status, allocated_date)
      VALUES (?, ?, ?, 'Active', CURRENT_DATE)
    `, [student_id, block_id, bed_number || 1]);

    await pool.query(`
      UPDATE hostel_blocks
      SET occupied_beds = occupied_beds + 1
      WHERE id = ? AND occupied_beds < total_beds
    `, [block_id]);

    res.status(201).json({ success: true, message: 'Student allocated to hostel block successfully' });
  } catch (error) {
    console.error('[HOSTEL CONTROLLER ERROR - allocateStudent]:', error);
    res.status(500).json({ success: false, message: 'Server error allocating student to hostel' });
  }
};
