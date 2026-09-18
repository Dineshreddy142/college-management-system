import express from 'express';
import pool from '../db.js';

const router = express.Router();

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
    } catch (e) {
      // Column may already exist, ignore error
    }

    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM campus_buildings');
    if (rows[0].count === 0) {
      console.log('Seeding initial campus buildings...');
      for (const b of INITIAL_BUILDINGS) {
        const [res] = await pool.execute(
          'INSERT INTO campus_buildings (name, code, description, total_floors, status) VALUES (?, ?, ?, ?, ?)',
          [b.name, b.code, b.description, b.total_floors, b.status]
        );
        const bId = res.insertId;
        // Generate floors for each building
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
    
    // Also fetch floors for this building
    const [floors] = await pool.execute('SELECT * FROM campus_floors WHERE building_id = ? ORDER BY floor_number ASC', [id]);
    res.json({ ...rows[0], floors });
  } catch (err) {
    console.error('Error fetching building detail:', err);
    res.status(500).json({ error: 'Failed to fetch building details' });
  }
});

// POST /api/campus/buildings - Add new building
router.post('/buildings', async (req, res) => {
  try {
    const { name, code, description, total_floors, status } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Building Name and Building Code are required' });
    }

    const numFloors = parseInt(total_floors) || 1;
    const bStatus = status || 'Active';

    // Insert building
    const [result] = await pool.execute(
      'INSERT INTO campus_buildings (name, code, description, total_floors, status) VALUES (?, ?, ?, ?, ?)',
      [name, code.toUpperCase(), description || '', numFloors, bStatus]
    );

    const buildingId = result.insertId;

    // Create corresponding floor entries for this building
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

// PUT /api/campus/buildings/:id - Edit building
router.put('/buildings/:id', async (req, res) => {
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

// DELETE /api/campus/buildings/:id - Delete building
router.delete('/buildings/:id', async (req, res) => {
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
      'SELECT id, building_id as buildingId, name, floor_number as floorNumber, description, display_order as displayOrder, created_at as createdAt, updated_at as updatedAt FROM campus_floors WHERE building_id = ? ORDER BY floor_number ASC, display_order ASC',
      [buildingId]
    );
    res.json(floors);
  } catch (err) {
    console.error('Error fetching floors:', err);
    res.status(500).json({ error: 'Failed to fetch floors' });
  }
});

// POST /api/campus/floors - Add new floor to building
router.post('/floors', async (req, res) => {
  try {
    const { buildingId, name, floorNumber, description, displayOrder } = req.body;
    if (!buildingId || name === undefined || floorNumber === undefined) {
      return res.status(400).json({ error: 'buildingId, Floor Name, and Floor Number are required' });
    }

    const bId = parseInt(buildingId);
    const numFloor = parseInt(floorNumber);

    // Validation: prevent duplicate floorNumber inside same building
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

// PUT /api/campus/floors/:id - Edit / Rename Floor
router.put('/floors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { buildingId, name, floorNumber, description, displayOrder } = req.body;

    const [existing] = await pool.execute('SELECT * FROM campus_floors WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Floor not found' });

    const bId = buildingId ? parseInt(buildingId) : existing[0].building_id;
    const newFloorNum = floorNumber !== undefined ? parseInt(floorNumber) : existing[0].floor_number;

    // Check duplicate floor number if floor number changed
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

// POST /api/campus/floors/:id/duplicate - Duplicate floor
router.post('/floors/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM campus_floors WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Floor to duplicate not found' });

    const original = existing[0];
    
    // Find next available floor number for this building
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

// DELETE /api/campus/floors/:id - Delete floor
router.delete('/floors/:id', async (req, res) => {
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

export default router;
