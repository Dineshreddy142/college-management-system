import express from 'express';
import pool from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware.js';

const router = express.Router();

// Role authorization middleware for Admin editing actions
const requireAdmin = [
  authenticateToken,
  authorizeRole(['admin', 'administrator', 'principal', 'office', 'systemadmin'])
];

// Initial Default Buildings to Seed if DB Table is empty
const INITIAL_BUILDINGS = [
  { name: 'Main Block', code: 'MB-01', description: 'Central Executive & Administration Complex', total_floors: 4, status: 'Active' },
  { name: 'Academic Block', code: 'AB-MAIN', description: 'Main Academic Classrooms & Lecture Halls', total_floors: 4, status: 'Active' },
  { name: 'Science Block', code: 'SB-02', description: 'Physics, Chemistry & Life Sciences Labs', total_floors: 5, status: 'Active' },
  { name: 'Engineering Block', code: 'ENG-WNG', description: 'Computer Science, Mechanical & Robotics Labs', total_floors: 3, status: 'Active' },
  { name: 'Administrative Block', code: 'ADM-01', description: 'Principal Office, Accounts & Registrar Offices', total_floors: 3, status: 'Active' },
  { name: 'Library Block', code: 'LIB-ADM', description: 'Central Library, E-Resource Center & Digital Archives', total_floors: 4, status: 'Maintenance' },
  { name: 'Hostel Block', code: 'HST-01', description: 'Student Residential Complex & Dining Facility', total_floors: 6, status: 'Active' },
];

// Helper to seed buildings and ensure schema columns exist
async function seedBuildingsIfEmpty() {
  try {
    // Ensure display_order column exists on campus_floors
    try {
      await pool.execute('ALTER TABLE campus_floors ADD COLUMN display_order INT DEFAULT 0');
    } catch (e) {}

    // Ensure publish columns exist on campus_floors
    try {
      await pool.execute("ALTER TABLE campus_floors ADD COLUMN publish_status VARCHAR(20) DEFAULT 'DRAFT'");
    } catch (e) {}
    try {
      await pool.execute("ALTER TABLE campus_floors ADD COLUMN last_saved_at TIMESTAMP NULL");
    } catch (e) {}
    try {
      await pool.execute("ALTER TABLE campus_floors ADD COLUMN last_published_at TIMESTAMP NULL");
    } catch (e) {}
    try {
      await pool.execute("ALTER TABLE campus_floors ADD COLUMN updated_by VARCHAR(100) DEFAULT 'Admin'");
    } catch (e) {}

    // Ensure columns exist on campus_rooms
    try {
      await pool.execute('ALTER TABLE campus_rooms ADD COLUMN room_type VARCHAR(50) DEFAULT "Classroom"');
    } catch (e) {}
    try {
      await pool.execute('ALTER TABLE campus_rooms ADD COLUMN shape VARCHAR(30) DEFAULT "rectangle"');
    } catch (e) {}
    try {
      await pool.execute("ALTER TABLE campus_rooms ADD COLUMN version_status VARCHAR(20) DEFAULT 'DRAFT'");
    } catch (e) {}

    // Ensure campus_room_types has at least one fallback entry
    try {
      const [typeRows] = await pool.execute('SELECT id FROM campus_room_types LIMIT 1');
      if (typeRows.length === 0) {
        await pool.execute(
          'INSERT INTO campus_room_types (id, name, color, icon) VALUES (1, "Classroom", "#3B82F6", "book-open")'
        );
      }
    } catch (e) {}

    // Ensure floor_plan_objects table exists
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS floor_plan_objects (
          id INT AUTO_INCREMENT PRIMARY KEY,
          floor_id INT NOT NULL,
          object_type VARCHAR(100) NOT NULL,
          name VARCHAR(150) NOT NULL,
          x FLOAT NOT NULL DEFAULT 100,
          y FLOAT NOT NULL DEFAULT 100,
          width FLOAT NOT NULL DEFAULT 120,
          height FLOAT NOT NULL DEFAULT 100,
          rotation FLOAT NOT NULL DEFAULT 0,
          shape VARCHAR(50) DEFAULT 'rectangle',
          metadata JSON NULL,
          version_status VARCHAR(20) DEFAULT 'DRAFT',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (floor_id) REFERENCES campus_floors(id) ON DELETE CASCADE
        )
      `);
      try {
        await pool.execute("ALTER TABLE floor_plan_objects ADD COLUMN version_status VARCHAR(20) DEFAULT 'DRAFT'");
      } catch (e) {}
    } catch (e) {
      console.error('Error initializing floor_plan_objects table:', e.message);
    }

    // Ensure floor_plan_versions table exists
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS floor_plan_versions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          floor_id INT NOT NULL,
          version VARCHAR(50) DEFAULT 'v1.0',
          status VARCHAR(20) DEFAULT 'DRAFT',
          created_by VARCHAR(100) DEFAULT 'Admin',
          published_by VARCHAR(100) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          published_at TIMESTAMP NULL,
          FOREIGN KEY (floor_id) REFERENCES campus_floors(id) ON DELETE CASCADE
        )
      `);
    } catch (e) {
      console.error('Error initializing floor_plan_versions table:', e.message);
    }

    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM campus_buildings');
    if (rows[0].count === 0) {
      console.log('Seeding initial campus buildings & floors...');
      for (const b of INITIAL_BUILDINGS) {
        const [res] = await pool.execute(
          'INSERT INTO campus_buildings (name, code, description, total_floors, status) VALUES (?, ?, ?, ?, ?)',
          [b.name, b.code, b.description, b.total_floors, b.status]
        );
        const bId = res.insertId;
        for (let i = 1; i <= b.total_floors; i++) {
          const floorName = i === 1 ? 'Ground Floor' : `${i - 1}${i === 2 ? 'st' : i === 3 ? 'nd' : i === 4 ? 'rd' : 'th'} Floor`;
          await pool.execute(
            'INSERT INTO campus_floors (building_id, name, floor_number, display_order, status) VALUES (?, ?, ?, ?, ?)',
            [bId, floorName, i - 1, i, 'Active']
          );
        }
      }
    }
  } catch (err) {
    console.error('Error seeding campus buildings & floors:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILDING ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/campus/buildings - List all buildings
router.get('/buildings', async (req, res) => {
  try {
    await seedBuildingsIfEmpty();
    const [rows] = await pool.execute(`
      SELECT b.*, 
        COUNT(f.id) as floorsCount
      FROM campus_buildings b
      LEFT JOIN campus_floors f ON f.building_id = b.id
      GROUP BY b.id
      ORDER BY b.id ASC
    `);
    res.json(rows.map(r => ({
      ...r,
      floorsCount: r.floorsCount || r.total_floors || 1
    })));
  } catch (err) {
    console.error('Error fetching buildings:', err);
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
});

// GET /api/campus/buildings/:id - Get single building details
router.get('/buildings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM campus_buildings WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Building not found' });
    
    const [floors] = await pool.execute('SELECT * FROM campus_floors WHERE building_id = ? ORDER BY floor_number ASC', [id]);
    res.json({ ...rows[0], floors });
  } catch (err) {
    console.error('Error fetching building detail:', err);
    res.status(500).json({ error: 'Failed to fetch building details' });
  }
});

// POST /api/campus/buildings - Add new building (Admin Only)
router.post('/buildings', ...requireAdmin, async (req, res) => {
  try {
    const { name, code, description, total_floors, status } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Building Name and Building Code are required' });
    }

    const numFloors = parseInt(total_floors) || 1;
    const bStatus = status || 'Active';

    const [result] = await pool.execute(
      'INSERT INTO campus_buildings (name, code, description, total_floors, status) VALUES (?, ?, ?, ?, ?)',
      [name, code.toUpperCase(), description || '', numFloors, bStatus]
    );

    const buildingId = result.insertId;

    for (let i = 1; i <= numFloors; i++) {
      const floorName = i === 1 ? 'Ground Floor' : `${i - 1}${i === 2 ? 'st' : i === 3 ? 'nd' : i === 4 ? 'rd' : 'th'} Floor`;
      await pool.execute(
        'INSERT INTO campus_floors (building_id, name, floor_number, display_order, status) VALUES (?, ?, ?, ?, ?)',
        [buildingId, floorName, i - 1, i, 'Active']
      );
    }

    const [newBuilding] = await pool.execute('SELECT * FROM campus_buildings WHERE id = ?', [buildingId]);
    res.status(201).json({
      message: 'Building created successfully',
      building: { ...newBuilding[0], floorsCount: numFloors }
    });
  } catch (err) {
    console.error('Error creating building:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: `Building Code "${req.body.code}" already exists` });
    }
    res.status(500).json({ error: 'Failed to create building: ' + err.message });
  }
});

// PUT /api/campus/buildings/:id - Edit building (Admin Only)
router.put('/buildings/:id', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, total_floors, status } = req.body;

    const [existing] = await pool.execute('SELECT * FROM campus_buildings WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Building not found' });

    const numFloors = parseInt(total_floors) || existing[0].total_floors || 1;

    await pool.execute(
      'UPDATE campus_buildings SET name = ?, code = ?, description = ?, total_floors = ?, status = ? WHERE id = ?',
      [name || existing[0].name, (code || existing[0].code).toUpperCase(), description ?? existing[0].description, numFloors, status || existing[0].status, id]
    );

    const [updated] = await pool.execute('SELECT * FROM campus_buildings WHERE id = ?', [id]);
    res.json({ message: 'Building updated successfully', building: updated[0] });
  } catch (err) {
    console.error('Error updating building:', err);
    res.status(500).json({ error: 'Failed to update building' });
  }
});

// DELETE /api/campus/buildings/:id - Delete building (Admin Only)
router.delete('/buildings/:id', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM campus_buildings WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Building not found' });

    await pool.execute('DELETE FROM campus_buildings WHERE id = ?', [id]);
    res.json({ message: 'Building deleted successfully', id: parseInt(id) });
  } catch (err) {
    console.error('Error deleting building:', err);
    res.status(500).json({ error: 'Failed to delete building: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FLOOR ROUTES & CRUD FUNCTIONALITY
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/campus/buildings/:buildingId/floors - Get floors for a building
router.get('/buildings/:buildingId/floors', async (req, res) => {
  try {
    await seedBuildingsIfEmpty();
    const { buildingId } = req.params;
    const [floors] = await pool.execute(
      `SELECT 
        id, 
        building_id as buildingId, 
        name, 
        floor_number as floorNumber, 
        description, 
        display_order as displayOrder, 
        publish_status as publishStatus,
        last_saved_at as lastSavedAt,
        last_published_at as lastPublishedAt,
        updated_by as updatedBy,
        created_at as createdAt, 
        updated_at as updatedAt 
      FROM campus_floors 
      WHERE building_id = ? 
      ORDER BY floor_number ASC, display_order ASC`,
      [buildingId]
    );
    res.json(floors.map(f => ({
      ...f,
      publishStatus: f.publishStatus || 'DRAFT',
      updatedBy: f.updatedBy || 'Admin'
    })));
  } catch (err) {
    console.error('Error fetching floors:', err);
    res.status(500).json({ error: 'Failed to fetch floors' });
  }
});

// POST /api/campus/floors - Add new floor to building (Admin Only)
router.post('/floors', ...requireAdmin, async (req, res) => {
  try {
    const { buildingId, name, floorNumber, description, displayOrder } = req.body;
    if (!buildingId || name === undefined || floorNumber === undefined) {
      return res.status(400).json({ error: 'buildingId, Floor Name, and Floor Number are required' });
    }

    const bId = parseInt(buildingId);
    const numFloor = parseInt(floorNumber);

    const [existing] = await pool.execute(
      'SELECT id FROM campus_floors WHERE building_id = ? AND floor_number = ?',
      [bId, numFloor]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: `Floor Number ${numFloor} already exists in this building` });
    }

    const order = parseInt(displayOrder) || numFloor;

    const [result] = await pool.execute(
      'INSERT INTO campus_floors (building_id, name, floor_number, description, display_order) VALUES (?, ?, ?, ?, ?)',
      [bId, name.trim(), numFloor, description || '', order]
    );

    const [newFloor] = await pool.execute(
      'SELECT id, building_id as buildingId, name, floor_number as floorNumber, description, display_order as displayOrder, created_at as createdAt, updated_at as updatedAt FROM campus_floors WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Floor created successfully', floor: newFloor[0] });
  } catch (err) {
    console.error('Error creating floor:', err);
    res.status(500).json({ error: 'Failed to create floor: ' + err.message });
  }
});

// PUT /api/campus/floors/:id - Edit / Rename Floor (Admin Only)
router.put('/floors/:id', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { buildingId, name, floorNumber, description, displayOrder } = req.body;

    const [existing] = await pool.execute('SELECT * FROM campus_floors WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Floor not found' });

    const bId = buildingId ? parseInt(buildingId) : existing[0].building_id;
    const newFloorNum = floorNumber !== undefined ? parseInt(floorNumber) : existing[0].floor_number;

    if (newFloorNum !== existing[0].floor_number) {
      const [dups] = await pool.execute(
        'SELECT id FROM campus_floors WHERE building_id = ? AND floor_number = ? AND id != ?',
        [bId, newFloorNum, id]
      );
      if (dups.length > 0) {
        return res.status(400).json({ error: `Floor Number ${newFloorNum} already exists in this building` });
      }
    }

    await pool.execute(
      'UPDATE campus_floors SET name = ?, floor_number = ?, description = ?, display_order = ? WHERE id = ?',
      [name || existing[0].name, newFloorNum, description ?? existing[0].description, displayOrder ?? existing[0].display_order ?? 0, id]
    );

    const [updated] = await pool.execute(
      'SELECT id, building_id as buildingId, name, floor_number as floorNumber, description, display_order as displayOrder, created_at as createdAt, updated_at as updatedAt FROM campus_floors WHERE id = ?',
      [id]
    );

    res.json({ message: 'Floor updated successfully', floor: updated[0] });
  } catch (err) {
    console.error('Error updating floor:', err);
    res.status(500).json({ error: 'Failed to update floor' });
  }
});

// POST /api/campus/floors/:id/duplicate - Duplicate floor (Admin Only)
router.post('/floors/:id/duplicate', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM campus_floors WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Floor to duplicate not found' });

    const original = existing[0];
    const [maxFloor] = await pool.execute(
      'SELECT MAX(floor_number) as maxNum FROM campus_floors WHERE building_id = ?',
      [original.building_id]
    );
    const newNum = (maxFloor[0].maxNum !== null ? maxFloor[0].maxNum : 0) + 1;
    const newName = `${original.name} (Copy)`;

    const [result] = await pool.execute(
      'INSERT INTO campus_floors (building_id, name, floor_number, description, display_order) VALUES (?, ?, ?, ?, ?)',
      [original.building_id, newName, newNum, original.description || '', newNum]
    );

    const [duplicated] = await pool.execute(
      'SELECT id, building_id as buildingId, name, floor_number as floorNumber, description, display_order as displayOrder, created_at as createdAt, updated_at as updatedAt FROM campus_floors WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ message: 'Floor duplicated successfully', floor: duplicated[0] });
  } catch (err) {
    console.error('Error duplicating floor:', err);
    res.status(500).json({ error: 'Failed to duplicate floor' });
  }
});

// DELETE /api/campus/floors/:id - Delete floor (Admin Only)
router.delete('/floors/:id', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM campus_floors WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Floor not found' });

    await pool.execute('DELETE FROM campus_floors WHERE id = ?', [id]);
    res.json({ message: 'Floor deleted successfully', id: parseInt(id) });
  } catch (err) {
    console.error('Error deleting floor:', err);
    res.status(500).json({ error: 'Failed to delete floor: ' + err.message });
  }
});

// GET /api/campus/floors/:id/status - Get status & metadata for floor
router.get('/floors/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(
      `SELECT 
        id, building_id as buildingId, name, floor_number as floorNumber, 
        publish_status as publishStatus, last_saved_at as lastSavedAt, 
        last_published_at as lastPublishedAt, updated_by as updatedBy 
      FROM campus_floors WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Floor not found' });
    res.json({
      ...rows[0],
      publishStatus: rows[0].publishStatus || 'DRAFT',
      updatedBy: rows[0].updatedBy || 'Admin'
    });
  } catch (err) {
    console.error('Error fetching floor status:', err);
    res.status(500).json({ error: 'Failed to fetch floor status' });
  }
});

// POST /api/campus/floors/:id/save - Save floor plan draft (Admin Only)
router.post('/floors/:id/save', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBy = req.body.updatedBy || req.user?.username || 'Admin';

    const [existing] = await pool.execute('SELECT * FROM campus_floors WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Floor not found' });

    await pool.execute(
      `UPDATE campus_floors 
       SET publish_status = 'DRAFT', last_saved_at = NOW(), updated_by = ? 
       WHERE id = ?`,
      [updatedBy, id]
    );

    const [updated] = await pool.execute(
      `SELECT 
        id, building_id as buildingId, name, floor_number as floorNumber, 
        publish_status as publishStatus, last_saved_at as lastSavedAt, 
        last_published_at as lastPublishedAt, updated_by as updatedBy 
      FROM campus_floors WHERE id = ?`,
      [id]
    );

    res.json({
      message: 'Floor plan saved successfully.',
      floor: {
        ...updated[0],
        publishStatus: updated[0].publishStatus || 'DRAFT',
        updatedBy: updated[0].updatedBy || 'Admin'
      }
    });
  } catch (err) {
    console.error('Error saving floor plan:', err);
    res.status(500).json({ error: 'Failed to save floor plan: ' + err.message });
  }
});

// POST /api/campus/floors/:id/publish - Publish floor plan draft (Admin Only)
router.post('/floors/:id/publish', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBy = req.body.updatedBy || req.user?.username || 'Admin';

    const [existing] = await pool.execute('SELECT * FROM campus_floors WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Floor not found' });

    // Validation: Check if floor contains at least one room or facility object
    const [draftRooms] = await pool.execute(
      "SELECT id FROM campus_rooms WHERE floor_id = ? AND (version_status = 'DRAFT' OR version_status IS NULL)",
      [id]
    );
    const [draftObjs] = await pool.execute(
      "SELECT id FROM floor_plan_objects WHERE floor_id = ? AND (version_status = 'DRAFT' OR version_status IS NULL)",
      [id]
    );

    if (draftRooms.length === 0 && draftObjs.length === 0) {
      return res.status(400).json({
        error: 'Floor plan validation failed: The floor plan is empty. Please add at least one room or facility object before publishing.'
      });
    }

    // Delete existing PUBLISHED items for this floor
    await pool.execute("DELETE FROM campus_rooms WHERE floor_id = ? AND version_status = 'PUBLISHED'", [id]);
    await pool.execute("DELETE FROM floor_plan_objects WHERE floor_id = ? AND version_status = 'PUBLISHED'", [id]);

    // Promote DRAFT rooms to PUBLISHED version
    await pool.execute(`
      INSERT INTO campus_rooms (
        building_id, floor_id, room_type_id, room_number, room_name, room_type, 
        capacity, department, description, status, x, y, width, height, rotation, shape, version_status
      )
      SELECT 
        building_id, floor_id, room_type_id, room_number, room_name, room_type, 
        capacity, department, description, status, x, y, width, height, rotation, shape, 'PUBLISHED'
      FROM campus_rooms 
      WHERE floor_id = ? AND (version_status = 'DRAFT' OR version_status IS NULL)
    `, [id]);

    // Promote DRAFT facility objects to PUBLISHED version
    await pool.execute(`
      INSERT INTO floor_plan_objects (
        floor_id, object_type, name, x, y, width, height, rotation, shape, metadata, version_status
      )
      SELECT 
        floor_id, object_type, name, x, y, width, height, rotation, shape, metadata, 'PUBLISHED'
      FROM floor_plan_objects 
      WHERE floor_id = ? AND (version_status = 'DRAFT' OR version_status IS NULL)
    `, [id]);

    // Update floor status to PUBLISHED and set timestamps
    await pool.execute(
      `UPDATE campus_floors 
       SET publish_status = 'PUBLISHED', last_published_at = NOW(), last_saved_at = NOW(), updated_by = ? 
       WHERE id = ?`,
      [updatedBy, id]
    );

    // Record publication version in floor_plan_versions
    try {
      const [vRows] = await pool.execute(
        'SELECT COUNT(*) as vCount FROM floor_plan_versions WHERE floor_id = ?',
        [id]
      );
      const nextVersion = `v${(vRows[0]?.vCount || 0) + 1}.0`;
      await pool.execute(
        `INSERT INTO floor_plan_versions (floor_id, version, status, created_by, published_by, published_at)
         VALUES (?, ?, 'PUBLISHED', ?, ?, NOW())`,
        [id, nextVersion, updatedBy, updatedBy]
      );
    } catch (verErr) {
      console.error('Error logging floor_plan_version:', verErr.message);
    }

    const [updated] = await pool.execute(
      `SELECT 
        id, building_id as buildingId, name, floor_number as floorNumber, 
        publish_status as publishStatus, last_saved_at as lastSavedAt, 
        last_published_at as lastPublishedAt, updated_by as updatedBy 
      FROM campus_floors WHERE id = ?`,
      [id]
    );

    res.json({
      message: 'Floor plan published successfully.',
      floor: {
        ...updated[0],
        publishStatus: updated[0].publishStatus || 'PUBLISHED',
        updatedBy: updated[0].updatedBy || 'Admin'
      }
    });
  } catch (err) {
    console.error('Error publishing floor plan:', err);
    res.status(500).json({ error: 'Failed to publish floor plan: ' + err.message });
  }
});

// GET /api/campus/floors/:floorId/versions - Fetch version history for a floor plan
router.get('/floors/:floorId/versions', async (req, res) => {
  try {
    const { floorId } = req.params;
    const [rows] = await pool.execute(
      `SELECT 
        id, 
        floor_id as floorId, 
        version, 
        status, 
        created_by as createdBy, 
        published_by as publishedBy, 
        created_at as createdAt, 
        published_at as publishedAt 
      FROM floor_plan_versions 
      WHERE floor_id = ? 
      ORDER BY id DESC`,
      [floorId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching floor plan versions:', err);
    res.status(500).json({ error: 'Failed to fetch floor plan versions' });
  }
});

// GET /api/campus/floors/:floorId/published - Public endpoint for Students & Faculty
router.get('/floors/:floorId/published', async (req, res) => {
  try {
    const { floorId } = req.params;
    const [floorRows] = await pool.execute('SELECT * FROM campus_floors WHERE id = ?', [floorId]);
    if (floorRows.length === 0) return res.status(404).json({ error: 'Floor not found' });

    const floorInfo = floorRows[0];
    if (floorInfo.publish_status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Published floor plan not available yet.' });
    }

    const [rooms] = await pool.execute(
      `SELECT id, floor_id as floorId, building_id as buildingId, room_number as roomNumber, 
              room_name as roomName, room_type as roomType, capacity, department, description, 
              status, x, y, width, height, rotation, shape, created_at as createdAt 
       FROM campus_rooms 
       WHERE floor_id = ? AND version_status = 'PUBLISHED' 
       ORDER BY id ASC`,
      [floorId]
    );

    const [objects] = await pool.execute(
      `SELECT id, floor_id as floorId, object_type as objectType, name, x, y, width, height, 
              rotation, shape, metadata, created_at as createdAt 
       FROM floor_plan_objects 
       WHERE floor_id = ? AND version_status = 'PUBLISHED' 
       ORDER BY id ASC`,
      [floorId]
    );

    const formattedObjects = objects.map(o => ({
      ...o,
      metadata: typeof o.metadata === 'string' ? JSON.parse(o.metadata) : (o.metadata || {})
    }));

    res.json({
      floor: {
        id: floorInfo.id,
        name: floorInfo.name,
        buildingId: floorInfo.building_id,
        publishStatus: floorInfo.publish_status,
        lastPublishedAt: floorInfo.last_published_at
      },
      rooms,
      objects: formattedObjects
    });
  } catch (err) {
    console.error('Error fetching published floor plan:', err);
    res.status(500).json({ error: 'Failed to fetch published floor plan' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ROOM MANAGEMENT ROUTES & PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/campus/floors/:floorId/rooms - Fetch rooms for floor
router.get('/floors/:floorId/rooms', async (req, res) => {
  try {
    await seedBuildingsIfEmpty();
    const { floorId } = req.params;
    const [rooms] = await pool.execute(`
      SELECT 
        id, 
        floor_id as floorId, 
        building_id as buildingId,
        room_number as roomNumber, 
        room_name as roomName, 
        room_type as roomType, 
        capacity, 
        department, 
        description, 
        status, 
        x, 
        y, 
        width, 
        height, 
        rotation, 
        shape, 
        created_at as createdAt, 
        updated_at as updatedAt 
      FROM campus_rooms 
      WHERE floor_id = ? 
      ORDER BY id ASC
    `, [floorId]);

    res.json(rooms);
  } catch (err) {
    console.error('Error fetching rooms for floor:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// POST /api/campus/floors/:floorId/rooms - Add new room to floor (Admin Only)
router.post('/floors/:floorId/rooms', ...requireAdmin, async (req, res) => {
  try {
    const { floorId } = req.params;
    const {
      buildingId,
      roomNumber,
      roomName,
      roomType,
      capacity,
      department,
      description,
      status,
      x,
      y,
      width,
      height,
      rotation,
      shape
    } = req.body;

    if (!roomNumber) {
      return res.status(400).json({ error: 'Room Number is required' });
    }

    const fId = parseInt(floorId);
    let bId = parseInt(buildingId);

    // If buildingId not provided, lookup building_id from campus_floors
    if (!bId) {
      const [fRows] = await pool.execute('SELECT building_id FROM campus_floors WHERE id = ?', [fId]);
      if (fRows.length > 0) bId = fRows[0].building_id;
    }

    const [resInsert] = await pool.execute(`
      INSERT INTO campus_rooms (
        building_id, floor_id, room_type_id, room_number, room_name, room_type, 
        capacity, department, description, status, x, y, width, height, rotation, shape
      ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      bId || 1,
      fId,
      roomNumber.trim(),
      (roomName || roomNumber).trim(),
      roomType || 'Classroom',
      parseInt(capacity) || 30,
      department || 'General',
      description || '',
      status || 'Available',
      parseFloat(x) || 40,
      parseFloat(y) || 40,
      parseFloat(width) || 200,
      parseFloat(height) || 150,
      parseFloat(rotation) || 0,
      shape || 'rectangle'
    ]);

    const [newRoom] = await pool.execute(`
      SELECT 
        id, 
        floor_id as floorId, 
        building_id as buildingId,
        room_number as roomNumber, 
        room_name as roomName, 
        room_type as roomType, 
        capacity, 
        department, 
        description, 
        status, 
        x, 
        y, 
        width, 
        height, 
        rotation, 
        shape, 
        created_at as createdAt, 
        updated_at as updatedAt 
      FROM campus_rooms 
      WHERE id = ?
    `, [resInsert.insertId]);

    res.status(201).json({ message: 'Room created successfully', room: newRoom[0] });
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ error: 'Failed to create room: ' + err.message });
  }
});

// PUT /api/campus/rooms/:id - Update existing room details and position (Admin Only)
router.put('/rooms/:id', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      roomNumber,
      roomName,
      roomType,
      capacity,
      department,
      description,
      status,
      x,
      y,
      width,
      height,
      rotation,
      shape
    } = req.body;

    const [existing] = await pool.execute('SELECT * FROM campus_rooms WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Room not found' });

    const cur = existing[0];

    await pool.execute(`
      UPDATE campus_rooms 
      SET 
        room_number = ?, 
        room_name = ?, 
        room_type = ?, 
        capacity = ?, 
        department = ?, 
        description = ?, 
        status = ?, 
        x = ?, 
        y = ?, 
        width = ?, 
        height = ?, 
        rotation = ?, 
        shape = ?
      WHERE id = ?
    `, [
      roomNumber !== undefined ? String(roomNumber).trim() : cur.room_number,
      roomName !== undefined ? String(roomName).trim() : cur.room_name,
      roomType !== undefined ? String(roomType) : (cur.room_type || 'Classroom'),
      capacity !== undefined ? parseInt(capacity) : cur.capacity,
      department !== undefined ? String(department) : cur.department,
      description !== undefined ? String(description) : cur.description,
      status !== undefined ? String(status) : cur.status,
      x !== undefined ? parseFloat(x) : cur.x,
      y !== undefined ? parseFloat(y) : cur.y,
      width !== undefined ? parseFloat(width) : cur.width,
      height !== undefined ? parseFloat(height) : cur.height,
      rotation !== undefined ? parseFloat(rotation) : cur.rotation,
      shape !== undefined ? String(shape) : (cur.shape || 'rectangle'),
      id
    ]);

    const [updated] = await pool.execute(`
      SELECT 
        id, 
        floor_id as floorId, 
        building_id as buildingId,
        room_number as roomNumber, 
        room_name as roomName, 
        room_type as roomType, 
        capacity, 
        department, 
        description, 
        status, 
        x, 
        y, 
        width, 
        height, 
        rotation, 
        shape, 
        created_at as createdAt, 
        updated_at as updatedAt 
      FROM campus_rooms 
      WHERE id = ?
    `, [id]);

    res.json({ message: 'Room updated successfully', room: updated[0] });
  } catch (err) {
    console.error('Error updating room:', err);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// DELETE /api/campus/rooms/:id - Delete room (Admin Only)
router.delete('/rooms/:id', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM campus_rooms WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Room not found' });

    await pool.execute('DELETE FROM campus_rooms WHERE id = ?', [id]);
    res.json({ message: 'Room deleted successfully', id: parseInt(id) });
  } catch (err) {
    console.error('Error deleting room:', err);
    res.status(500).json({ error: 'Failed to delete room: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FACILITY OBJECT ROUTES (FloorPlanObjects)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/campus/floors/:floorId/objects - List facility objects for a floor
router.get('/floors/:floorId/objects', async (req, res) => {
  try {
    await seedBuildingsIfEmpty();
    const { floorId } = req.params;
    const [objects] = await pool.execute(`
      SELECT 
        id, 
        floor_id as floorId, 
        object_type as objectType, 
        name, 
        x, 
        y, 
        width, 
        height, 
        rotation, 
        shape, 
        metadata,
        created_at as createdAt, 
        updated_at as updatedAt 
      FROM floor_plan_objects 
      WHERE floor_id = ? 
      ORDER BY id ASC
    `, [floorId]);

    const formatted = objects.map(o => ({
      ...o,
      metadata: typeof o.metadata === 'string' ? JSON.parse(o.metadata) : (o.metadata || {})
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching floor plan objects:', err);
    res.status(500).json({ error: 'Failed to fetch floor plan objects' });
  }
});

// POST /api/campus/floors/:floorId/objects - Add facility object to floor (Admin Only)
router.post('/floors/:floorId/objects', ...requireAdmin, async (req, res) => {
  try {
    const { floorId } = req.params;
    const {
      objectType,
      name,
      x,
      y,
      width,
      height,
      rotation,
      shape,
      metadata
    } = req.body;

    if (!name || !objectType) {
      return res.status(400).json({ error: 'Name and Object Type are required' });
    }

    const fId = parseInt(floorId);
    const metaStr = typeof metadata === 'object' ? JSON.stringify(metadata) : (metadata || JSON.stringify({ status: 'Active', description: '' }));

    const [resInsert] = await pool.execute(`
      INSERT INTO floor_plan_objects (
        floor_id, object_type, name, x, y, width, height, rotation, shape, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      fId,
      objectType.trim(),
      name.trim(),
      parseFloat(x) || 100,
      parseFloat(y) || 100,
      parseFloat(width) || 140,
      parseFloat(height) || 100,
      parseFloat(rotation) || 0,
      shape || 'rectangle',
      metaStr
    ]);

    const [newObj] = await pool.execute(`
      SELECT 
        id, 
        floor_id as floorId, 
        object_type as objectType, 
        name, 
        x, 
        y, 
        width, 
        height, 
        rotation, 
        shape, 
        metadata,
        created_at as createdAt, 
        updated_at as updatedAt 
      FROM floor_plan_objects 
      WHERE id = ?
    `, [resInsert.insertId]);

    const retObj = {
      ...newObj[0],
      metadata: typeof newObj[0].metadata === 'string' ? JSON.parse(newObj[0].metadata) : (newObj[0].metadata || {})
    };

    res.status(201).json({ message: 'Facility object created successfully', object: retObj });
  } catch (err) {
    console.error('Error creating floor plan object:', err);
    res.status(500).json({ error: 'Failed to create floor plan object: ' + err.message });
  }
});

// PUT /api/campus/objects/:id - Update facility object (Admin Only)
router.put('/objects/:id', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      objectType,
      name,
      x,
      y,
      width,
      height,
      rotation,
      shape,
      metadata
    } = req.body;

    const [existing] = await pool.execute('SELECT * FROM floor_plan_objects WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Object not found' });

    const cur = existing[0];
    const metaStr = metadata !== undefined 
      ? (typeof metadata === 'object' ? JSON.stringify(metadata) : String(metadata))
      : cur.metadata;

    await pool.execute(`
      UPDATE floor_plan_objects 
      SET 
        object_type = ?, 
        name = ?, 
        x = ?, 
        y = ?, 
        width = ?, 
        height = ?, 
        rotation = ?, 
        shape = ?, 
        metadata = ?
      WHERE id = ?
    `, [
      objectType !== undefined ? String(objectType).trim() : cur.object_type,
      name !== undefined ? String(name).trim() : cur.name,
      x !== undefined ? parseFloat(x) : cur.x,
      y !== undefined ? parseFloat(y) : cur.y,
      width !== undefined ? parseFloat(width) : cur.width,
      height !== undefined ? parseFloat(height) : cur.height,
      rotation !== undefined ? parseFloat(rotation) : cur.rotation,
      shape !== undefined ? String(shape) : cur.shape,
      metaStr,
      id
    ]);

    const [updated] = await pool.execute(`
      SELECT 
        id, 
        floor_id as floorId, 
        object_type as objectType, 
        name, 
        x, 
        y, 
        width, 
        height, 
        rotation, 
        shape, 
        metadata,
        created_at as createdAt, 
        updated_at as updatedAt 
      FROM floor_plan_objects 
      WHERE id = ?
    `, [id]);

    const retObj = {
      ...updated[0],
      metadata: typeof updated[0].metadata === 'string' ? JSON.parse(updated[0].metadata) : (updated[0].metadata || {})
    };

    res.json({ message: 'Facility object updated successfully', object: retObj });
  } catch (err) {
    console.error('Error updating floor plan object:', err);
    res.status(500).json({ error: 'Failed to update floor plan object' });
  }
});

// DELETE /api/campus/objects/:id - Delete facility object (Admin Only)
router.delete('/objects/:id', ...requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM floor_plan_objects WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Object not found' });

    await pool.execute('DELETE FROM floor_plan_objects WHERE id = ?', [id]);
    res.json({ message: 'Object deleted successfully', id: parseInt(id) });
  } catch (err) {
    console.error('Error deleting floor plan object:', err);
    res.status(500).json({ error: 'Failed to delete object: ' + err.message });
  }
});

export default router;
