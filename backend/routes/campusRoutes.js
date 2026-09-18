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

// Helper to seed buildings if empty
async function seedBuildingsIfEmpty() {
  try {
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
          await pool.execute(
            'INSERT INTO campus_floors (building_id, name, floor_number, status) VALUES (?, ?, ?, ?)',
            [bId, `Floor ${i} (${i === 1 ? 'Ground' : i === 2 ? '1st Floor' : i === 3 ? '2nd Floor' : i + 'th Floor'})`, i, 'Active']
          );
        }
      }
    }
  } catch (err) {
    console.error('Error seeding campus buildings:', err.message);
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
      await pool.execute(
        'INSERT INTO campus_floors (building_id, name, floor_number, status) VALUES (?, ?, ?, ?)',
        [buildingId, `Floor ${i} (${i === 1 ? 'Ground Floor' : `${i - 1}st/2nd Floor`})`, i, 'Active']
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

    // Sync floors count if increased
    const [currentFloors] = await pool.execute('SELECT COUNT(*) as cnt FROM campus_floors WHERE building_id = ?', [id]);
    const currentCount = currentFloors[0].cnt;
    if (numFloors > currentCount) {
      for (let i = currentCount + 1; i <= numFloors; i++) {
        await pool.execute(
          'INSERT INTO campus_floors (building_id, name, floor_number, status) VALUES (?, ?, ?, ?)',
          [id, `Floor ${i} (${i === 1 ? 'Ground Floor' : `${i - 1} Floor`})`, i, 'Active']
        );
      }
    }

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
// FLOOR ROUTES BY BUILDING
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/campus/buildings/:buildingId/floors - Get floors for a building
router.get('/buildings/:buildingId/floors', async (req, res) => {
  try {
    const { buildingId } = req.params;
    const [floors] = await pool.execute(
      'SELECT * FROM campus_floors WHERE building_id = ? ORDER BY floor_number ASC',
      [buildingId]
    );
    res.json(floors);
  } catch (err) {
    console.error('Error fetching floors:', err);
    res.status(500).json({ error: 'Failed to fetch floors' });
  }
});

export default router;
