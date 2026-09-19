import express from 'express';
import pool from '../db.js';
import { authenticateToken, authorizeRole } from '../middleware.js';
import { initBlockTables } from '../init_block_tables.js';

const router = express.Router();

// Role middleware for admin / editor access
const requireEditor = [
  authenticateToken,
  authorizeRole(['admin', 'administrator', 'principal', 'office', 'systemadmin', 'hod'])
];

// Helper to log audit trail
async function logAudit(req, action, targetType, targetId, details = {}) {
  try {
    const userId = req.user?.id || null;
    const username = req.user?.username || req.user?.name || 'Admin';
    await pool.execute(
      'INSERT INTO block_audit_logs (user_id, username, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, action, targetType, String(targetId), JSON.stringify(details)]
    );
  } catch (err) {
    console.error('[BlockAudit] Error logging audit action:', err.message);
  }
}

// Ensure DB tables on initial load
initBlockTables().catch(console.error);

// ─────────────────────────────────────────────────────────────────────────────
// 1. BUILDING MANAGEMENT APIs
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/block/buildings - List all buildings with search/filter
router.get('/buildings', async (req, res) => {
  try {
    const { search, type, department, status } = req.query;
    let query = `
      SELECT b.*, 
        COUNT(f.id) as floors_count
      FROM buildings b
      LEFT JOIN floors f ON f.building_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ' AND (LOWER(b.name) LIKE ? OR LOWER(b.code) LIKE ? OR LOWER(b.department) LIKE ?)';
      const q = `%${search.trim().toLowerCase()}%`;
      params.push(q, q, q);
    }
    if (type && type !== 'all') {
      query += ' AND b.building_type = ?';
      params.push(type);
    }
    if (department && department !== 'all') {
      query += ' AND b.department = ?';
      params.push(department);
    }
    if (status && status !== 'all') {
      query += ' AND b.status = ?';
      params.push(status);
    }

    query += ' GROUP BY b.id ORDER BY b.id ASC';

    const [rows] = await pool.execute(query, params);
    const buildings = rows.map(r => ({
      ...r,
      boundary_points: typeof r.boundary_points === 'string' ? JSON.parse(r.boundary_points) : (r.boundary_points || []),
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata || {})
    }));

    res.json(buildings);
  } catch (err) {
    console.error('[BlockAPI] Error fetching buildings:', err);
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
});

// GET /api/block/buildings/:id - Single building detail
router.get('/buildings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM buildings WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Building not found' });

    const building = rows[0];
    building.boundary_points = typeof building.boundary_points === 'string' ? JSON.parse(building.boundary_points) : (building.boundary_points || []);
    building.metadata = typeof building.metadata === 'string' ? JSON.parse(building.metadata) : (building.metadata || {});

    const [floors] = await pool.execute('SELECT * FROM floors WHERE building_id = ? ORDER BY floor_number ASC', [id]);
    res.json({ ...building, floors });
  } catch (err) {
    console.error('[BlockAPI] Error fetching building detail:', err);
    res.status(500).json({ error: 'Failed to fetch building details' });
  }
});

// POST /api/block/buildings - Create new building
router.post('/buildings', ...requireEditor, async (req, res) => {
  try {
    const {
      code, name, description, building_type, department, status,
      total_floors, geometry_type, x, y, width, height, rotation, boundary_points, metadata
    } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Building Name is required' });

    let bCode = (code || '').trim().toUpperCase();
    if (!bCode) {
      bCode = 'BLDG-' + name.trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) + '-' + Math.floor(Math.random() * 1000);
    }

    const numFloors = parseInt(total_floors) || 1;
    const gType = geometry_type || 'RECTANGLE';
    const bPoints = JSON.stringify(boundary_points || []);
    const meta = JSON.stringify(metadata || {});
    const username = req.user?.username || req.user?.name || 'Admin';

    const [result] = await pool.execute(
      `INSERT INTO buildings 
      (code, name, description, building_type, department, status, total_floors, geometry_type, x, y, width, height, rotation, boundary_points, metadata, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bCode, name.trim(), description || '', building_type || 'Academic', department || 'General',
        status || 'Active', numFloors, gType, Number(x) || 40, Number(y) || 40, Number(width) || 300,
        Number(height) || 200, Number(rotation) || 0, bPoints, meta, username, username
      ]
    );

    const bId = result.insertId;

    // Create floors for building
    for (let i = 0; i < numFloors; i++) {
      const fName = i === 0 ? 'Ground Floor' : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Floor`;
      const fCode = `F-${i}`;
      await pool.execute(
        'INSERT INTO floors (building_id, floor_number, name, code, description, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [bId, i, fName, fCode, `Level ${i}`, username, username]
      );
    }

    const [newBldg] = await pool.execute('SELECT * FROM buildings WHERE id = ?', [bId]);
    await logAudit(req, 'CREATE_BUILDING', 'BUILDING', bId, { name, code: bCode });

    res.status(201).json({
      message: 'Building created successfully',
      building: {
        ...newBldg[0],
        boundary_points: boundary_points || [],
        metadata: metadata || {}
      }
    });
  } catch (err) {
    console.error('[BlockAPI] Error creating building:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: `Building code "${req.body.code}" already exists.` });
    }
    res.status(500).json({ error: 'Failed to create building: ' + err.message });
  }
});

// PUT /api/block/buildings/:id - Edit building
router.put('/buildings/:id', ...requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM buildings WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Building not found' });

    const ex = existing[0];
    const {
      code, name, description, building_type, department, status,
      total_floors, geometry_type, x, y, width, height, rotation, boundary_points, metadata
    } = req.body;

    const bCode = (code || ex.code).trim().toUpperCase();
    const bName = (name || ex.name).trim();
    const bDesc = description !== undefined ? description : ex.description;
    const bType = building_type || ex.building_type;
    const bDept = department || ex.department;
    const bStatus = status || ex.status;
    const numFloors = total_floors !== undefined ? parseInt(total_floors) : ex.total_floors;
    const gType = geometry_type || ex.geometry_type;
    const bPoints = boundary_points !== undefined ? JSON.stringify(boundary_points) : ex.boundary_points;
    const meta = metadata !== undefined ? JSON.stringify(metadata) : ex.metadata;
    const username = req.user?.username || req.user?.name || 'Admin';

    await pool.execute(
      `UPDATE buildings SET
        code = ?, name = ?, description = ?, building_type = ?, department = ?, status = ?,
        total_floors = ?, geometry_type = ?, x = ?, y = ?, width = ?, height = ?, rotation = ?,
        boundary_points = ?, metadata = ?, updated_by = ?
      WHERE id = ?`,
      [
        bCode, bName, bDesc, bType, bDept, bStatus, numFloors, gType,
        x !== undefined ? Number(x) : ex.x, y !== undefined ? Number(y) : ex.y,
        width !== undefined ? Number(width) : ex.width, height !== undefined ? Number(height) : ex.height,
        rotation !== undefined ? Number(rotation) : ex.rotation, bPoints, meta, username, id
      ]
    );

    const [updated] = await pool.execute('SELECT * FROM buildings WHERE id = ?', [id]);
    await logAudit(req, 'UPDATE_BUILDING', 'BUILDING', id, { name: bName, code: bCode });

    res.json({
      message: 'Building updated successfully',
      building: {
        ...updated[0],
        boundary_points: typeof updated[0].boundary_points === 'string' ? JSON.parse(updated[0].boundary_points) : updated[0].boundary_points
      }
    });
  } catch (err) {
    console.error('[BlockAPI] Error updating building:', err);
    res.status(500).json({ error: 'Failed to update building: ' + err.message });
  }
});

// DELETE /api/block/buildings/:id - Cascade delete building
router.delete('/buildings/:id', ...requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT name FROM buildings WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Building not found' });

    await pool.execute('DELETE FROM buildings WHERE id = ?', [id]);
    await logAudit(req, 'DELETE_BUILDING', 'BUILDING', id, { name: existing[0].name });

    res.json({ message: 'Building deleted successfully', id: Number(id) });
  } catch (err) {
    console.error('[BlockAPI] Error deleting building:', err);
    res.status(500).json({ error: 'Failed to delete building: ' + err.message });
  }
});

// POST /api/block/buildings/:id/duplicate - Duplicate building
router.post('/buildings/:id/duplicate', ...requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM buildings WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Building to duplicate not found' });

    const orig = existing[0];
    const newCode = `${orig.code}-COPY-${Math.floor(Math.random() * 1000)}`;
    const newName = `${orig.name} (Copy)`;
    const username = req.user?.username || req.user?.name || 'Admin';

    const [resBldg] = await pool.execute(
      `INSERT INTO buildings 
      (code, name, description, building_type, department, status, total_floors, geometry_type, x, y, width, height, rotation, boundary_points, metadata, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newCode, newName, orig.description, orig.building_type, orig.department,
        orig.status, orig.total_floors, orig.geometry_type, orig.x + 40, orig.y + 40,
        orig.width, orig.height, orig.rotation, orig.boundary_points, orig.metadata, username, username
      ]
    );

    const newBId = resBldg.insertId;

    // Duplicate floors
    const [floors] = await pool.execute('SELECT * FROM floors WHERE building_id = ?', [id]);
    for (const fl of floors) {
      await pool.execute(
        'INSERT INTO floors (building_id, floor_number, name, code, description, status, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [newBId, fl.floor_number, fl.name, fl.code, fl.description, fl.status, username, username]
      );
    }

    const [newBldg] = await pool.execute('SELECT * FROM buildings WHERE id = ?', [newBId]);
    await logAudit(req, 'DUPLICATE_BUILDING', 'BUILDING', newBId, { originalId: id });

    res.status(201).json({ message: 'Building duplicated successfully', building: newBldg[0] });
  } catch (err) {
    console.error('[BlockAPI] Error duplicating building:', err);
    res.status(500).json({ error: 'Failed to duplicate building: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. FLOOR MANAGEMENT APIs
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/block/buildings/:buildingId/floors
router.get('/buildings/:buildingId/floors', async (req, res) => {
  try {
    const { buildingId } = req.params;
    const [floors] = await pool.execute('SELECT * FROM floors WHERE building_id = ? ORDER BY floor_number ASC', [buildingId]);
    res.json(floors);
  } catch (err) {
    console.error('[BlockAPI] Error fetching floors:', err);
    res.status(500).json({ error: 'Failed to fetch floors' });
  }
});

// GET /api/block/floors/:id
router.get('/floors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [floors] = await pool.execute(`
      SELECT f.*, 
             b.name as building_name, 
             b.code as building_code, 
             b.geometry_type as building_geometry_type,
             b.width as building_width,
             b.height as building_height,
             b.boundary_points as building_boundary_points
      FROM floors f
      LEFT JOIN buildings b ON f.building_id = b.id
      WHERE f.id = ?
    `, [id]);
    if (floors.length === 0) return res.status(404).json({ error: 'Floor not found' });

    const floor = floors[0];
    floor.boundary_points = typeof floor.boundary_points === 'string' ? JSON.parse(floor.boundary_points) : (floor.boundary_points || []);
    floor.building_boundary_points = typeof floor.building_boundary_points === 'string' ? JSON.parse(floor.building_boundary_points) : (floor.building_boundary_points || []);

    res.json(floor);
  } catch (err) {
    console.error('[BlockAPI] Error fetching floor detail:', err);
    res.status(500).json({ error: 'Failed to fetch floor detail' });
  }
});

// POST /api/block/buildings/:buildingId/floors
router.post('/buildings/:buildingId/floors', ...requireEditor, async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { floor_number, name, code, description, status, width, height } = req.body;

    if (name === undefined || floor_number === undefined) {
      return res.status(400).json({ error: 'Floor Name and Floor Number are required' });
    }

    const numFloor = parseInt(floor_number);
    const username = req.user?.username || req.user?.name || 'Admin';

    // Check duplicate floor_number for building
    const [dups] = await pool.execute('SELECT id FROM floors WHERE building_id = ? AND floor_number = ?', [buildingId, numFloor]);
    if (dups.length > 0) {
      return res.status(400).json({ error: `Floor Number ${numFloor} already exists in this building` });
    }

    const [resFloor] = await pool.execute(
      `INSERT INTO floors (building_id, floor_number, name, code, description, status, width, height, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        buildingId, numFloor, name.trim(), code || `F-${numFloor}`, description || '',
        status || 'Active', Number(width) || 1200, Number(height) || 800, username, username
      ]
    );

    const fId = resFloor.insertId;

    // Initialize default layers for floor
    const defaultLayers = [
      { key: 'boundary', name: 'Building Boundary', z: 0 },
      { key: 'structural', name: 'Structural Elements', z: 1 },
      { key: 'rooms', name: 'Rooms & Spaces', z: 2 },
      { key: 'corridors', name: 'Corridors & Passages', z: 3 },
      { key: 'facilities', name: 'Special Facilities', z: 4 },
      { key: 'open_areas', name: 'Open Areas & Gardens', z: 5 },
      { key: 'doors_windows', name: 'Doors & Windows', z: 6 },
      { key: 'navigation', name: 'Navigation Elements', z: 7 },
      { key: 'labels', name: 'Labels & Annotations', z: 8 },
      { key: 'custom', name: 'Custom Objects', z: 9 }
    ];

    for (const l of defaultLayers) {
      await pool.execute(
        'INSERT INTO floor_layers (floor_id, layer_key, name, z_index) VALUES (?, ?, ?, ?)',
        [fId, l.key, l.name, l.z]
      );
    }

    const [newFl] = await pool.execute('SELECT * FROM floors WHERE id = ?', [fId]);
    await logAudit(req, 'CREATE_FLOOR', 'FLOOR', fId, { name, buildingId });

    res.status(201).json({ message: 'Floor created successfully', floor: newFl[0] });
  } catch (err) {
    console.error('[BlockAPI] Error creating floor:', err);
    res.status(500).json({ error: 'Failed to create floor: ' + err.message });
  }
});

// PUT /api/block/floors/:id
router.put('/floors/:id', ...requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT * FROM floors WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Floor not found' });

    const ex = existing[0];
    const { floor_number, name, code, description, status, width, height, publish_status } = req.body;
    const username = req.user?.username || req.user?.name || 'Admin';

    const numFloor = floor_number !== undefined ? parseInt(floor_number) : ex.floor_number;

    if (numFloor !== ex.floor_number) {
      const [dups] = await pool.execute('SELECT id FROM floors WHERE building_id = ? AND floor_number = ? AND id != ?', [ex.building_id, numFloor, id]);
      if (dups.length > 0) return res.status(400).json({ error: `Floor Number ${numFloor} already exists in this building` });
    }

    await pool.execute(
      `UPDATE floors SET
        floor_number = ?, name = ?, code = ?, description = ?, status = ?,
        width = ?, height = ?, publish_status = ?, updated_by = ?
      WHERE id = ?`,
      [
        numFloor, name ? name.trim() : ex.name, code || ex.code, description ?? ex.description,
        status || ex.status, width !== undefined ? Number(width) : ex.width,
        height !== undefined ? Number(height) : ex.height, publish_status || ex.publish_status, username, id
      ]
    );

    const [updated] = await pool.execute('SELECT * FROM floors WHERE id = ?', [id]);
    await logAudit(req, 'UPDATE_FLOOR', 'FLOOR', id, { name: updated[0].name });

    res.json({ message: 'Floor updated successfully', floor: updated[0] });
  } catch (err) {
    console.error('[BlockAPI] Error updating floor:', err);
    res.status(500).json({ error: 'Failed to update floor' });
  }
});

// DELETE /api/block/floors/:id
router.delete('/floors/:id', ...requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await pool.execute('SELECT name FROM floors WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Floor not found' });

    await pool.execute('DELETE FROM floors WHERE id = ?', [id]);
    await logAudit(req, 'DELETE_FLOOR', 'FLOOR', id, { name: existing[0].name });

    res.json({ message: 'Floor deleted successfully', id: Number(id) });
  } catch (err) {
    console.error('[BlockAPI] Error deleting floor:', err);
    res.status(500).json({ error: 'Failed to delete floor' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. FLOOR OBJECTS & AUTOSAVE BATCH APIs
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/block/floors/:floorId/objects - Load objects & layers for CAD editor
router.get('/floors/:floorId/objects', async (req, res) => {
  try {
    const { floorId } = req.params;

    const [layers] = await pool.execute('SELECT * FROM floor_layers WHERE floor_id = ? ORDER BY z_index ASC', [floorId]);
    const [objects] = await pool.execute('SELECT * FROM floor_objects WHERE floor_id = ? ORDER BY z_index ASC, id ASC', [floorId]);

    const formattedObjects = objects.map(o => ({
      ...o,
      points: typeof o.points === 'string' ? JSON.parse(o.points) : (o.points || []),
      properties: typeof o.properties === 'string' ? JSON.parse(o.properties) : (o.properties || {})
    }));

    res.json({
      layers,
      objects: formattedObjects
    });
  } catch (err) {
    console.error('[BlockAPI] Error fetching floor objects:', err);
    res.status(500).json({ error: 'Failed to fetch floor layout objects' });
  }
});

// POST /api/block/floors/:floorId/objects - Batch Autosave Floor Layout
router.post('/floors/:floorId/objects', ...requireEditor, async (req, res) => {
  try {
    const { floorId } = req.params;
    const { objects, layers } = req.body;
    const username = req.user?.username || req.user?.name || 'Admin';

    if (!Array.isArray(objects)) {
      return res.status(400).json({ error: 'Objects array is required' });
    }

    // Replace floor objects with latest saved batch (or update existing)
    await pool.execute('DELETE FROM floor_objects WHERE floor_id = ? AND (version_status = "DRAFT" OR version_status IS NULL)', [floorId]);

    for (const obj of objects) {
      const pointsJson = JSON.stringify(obj.points || []);
      const propsJson = JSON.stringify(obj.properties || {});

      await pool.execute(
        `INSERT INTO floor_objects
        (floor_id, layer_id, object_type, geometry_type, x, y, width, height, rotation, points, label, z_index, locked, visible, fill_color, stroke_color, stroke_width, properties, version_status, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)`,
        [
          floorId, obj.layer_id || null, obj.object_type || 'ROOM', obj.geometry_type || 'RECTANGLE',
          Number(obj.x) || 0, Number(obj.y) || 0, Number(obj.width) || 100, Number(obj.height) || 100,
          Number(obj.rotation) || 0, pointsJson, obj.label || '', Number(obj.z_index) || 0,
          obj.locked ? 1 : 0, obj.visible !== false ? 1 : 0, obj.fill_color || '#3B82F6',
          obj.stroke_color || '#1E40AF', Number(obj.stroke_width) || 2, propsJson, username, username
        ]
      );
    }

    // Update floor publish_status & timestamp
    await pool.execute('UPDATE floors SET publish_status = "DRAFT", updated_at = NOW(), updated_by = ? WHERE id = ?', [username, floorId]);

    res.json({ message: 'Floor plan batch saved successfully', savedCount: objects.length });
  } catch (err) {
    console.error('[BlockAPI] Error saving floor objects:', err);
    res.status(500).json({ error: 'Failed to save floor objects: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. ROOM INVENTORY AGGREGATE API
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/block/rooms - Aggregated room list across all buildings & floors
router.get('/rooms', async (req, res) => {
  try {
    const { buildingId, floorId, type, department, status, search } = req.query;

    let query = `
      SELECT o.*, 
        f.name as floor_name, f.floor_number, 
        b.name as building_name, b.code as building_code, b.id as building_id
      FROM floor_objects o
      JOIN floors f ON o.floor_id = f.id
      JOIN buildings b ON f.building_id = b.id
      WHERE o.object_type IN ('ROOM', 'CLASSROOM', 'LAB', 'FACULTY_ROOM', 'HOD_ROOM', 'OFFICE', 'MEETING_ROOM', 'AUDITORIUM', 'SEMINAR_HALL', 'STORE', 'WASHROOM', 'RECEPTION', 'LIBRARY', 'CONFERENCE_ROOM', 'OTHER')
    `;
    const params = [];

    if (buildingId && buildingId !== 'all') {
      query += ' AND b.id = ?';
      params.push(buildingId);
    }
    if (floorId && floorId !== 'all') {
      query += ' AND f.id = ?';
      params.push(floorId);
    }
    if (type && type !== 'all') {
      query += ' AND (o.object_type = ? OR JSON_UNQUOTE(JSON_EXTRACT(o.properties, "$.roomType")) = ?)';
      params.push(type, type);
    }
    if (department && department !== 'all') {
      query += ' AND JSON_UNQUOTE(JSON_EXTRACT(o.properties, "$.department")) = ?';
      params.push(department);
    }
    if (status && status !== 'all') {
      query += ' AND JSON_UNQUOTE(JSON_EXTRACT(o.properties, "$.status")) = ?';
      params.push(status);
    }
    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      query += ' AND (LOWER(o.label) LIKE ? OR LOWER(JSON_UNQUOTE(JSON_EXTRACT(o.properties, "$.roomNumber"))) LIKE ?)';
      params.push(q, q);
    }

    query += ' ORDER BY b.name ASC, f.floor_number ASC, o.label ASC';

    const [rows] = await pool.execute(query, params);
    const rooms = rows.map(r => ({
      ...r,
      points: typeof r.points === 'string' ? JSON.parse(r.points) : (r.points || []),
      properties: typeof r.properties === 'string' ? JSON.parse(r.properties) : (r.properties || {})
    }));

    res.json(rooms);
  } catch (err) {
    console.error('[BlockAPI] Error fetching rooms inventory:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. VERSION CONTROL & PUBLISHING APIs
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/block/floors/:floorId/versions
router.get('/floors/:floorId/versions', async (req, res) => {
  try {
    const { floorId } = req.params;
    const [rows] = await pool.execute('SELECT id, floor_id, version_number, description, status, published_at, created_by, created_at FROM floor_versions WHERE floor_id = ? ORDER BY id DESC', [floorId]);
    res.json(rows);
  } catch (err) {
    console.error('[BlockAPI] Error fetching floor versions:', err);
    res.status(500).json({ error: 'Failed to fetch version history' });
  }
});

// GET /api/block/floor-versions/:id - Snapshot data preview
router.get('/floor-versions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM floor_versions WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Version not found' });

    const ver = rows[0];
    ver.snapshot_data = typeof ver.snapshot_data === 'string' ? JSON.parse(ver.snapshot_data) : ver.snapshot_data;

    res.json(ver);
  } catch (err) {
    console.error('[BlockAPI] Error fetching version snapshot:', err);
    res.status(500).json({ error: 'Failed to fetch version snapshot' });
  }
});

// POST /api/block/floors/:floorId/versions - Manual Version Snapshot
router.post('/floors/:floorId/versions', ...requireEditor, async (req, res) => {
  try {
    const { floorId } = req.params;
    const { description } = req.body;
    const username = req.user?.username || req.user?.name || 'Admin';

    const [layers] = await pool.execute('SELECT * FROM floor_layers WHERE floor_id = ?', [floorId]);
    const [objects] = await pool.execute('SELECT * FROM floor_objects WHERE floor_id = ? AND version_status = "DRAFT"', [floorId]);

    const formattedObjs = objects.map(o => ({
      ...o,
      points: typeof o.points === 'string' ? JSON.parse(o.points) : (o.points || []),
      properties: typeof o.properties === 'string' ? JSON.parse(o.properties) : (o.properties || {})
    }));

    const snapshot = {
      layers,
      objects: formattedObjs
    };

    const [vCount] = await pool.execute('SELECT COUNT(*) as cnt FROM floor_versions WHERE floor_id = ?', [floorId]);
    const nextVerNum = `v${(vCount[0]?.cnt || 0) + 1}.0`;

    const [result] = await pool.execute(
      'INSERT INTO floor_versions (floor_id, version_number, description, snapshot_data, status, created_by) VALUES (?, ?, ?, ?, "DRAFT", ?)',
      [floorId, nextVerNum, description || `Version snapshot ${nextVerNum}`, JSON.stringify(snapshot), username]
    );

    await logAudit(req, 'CREATE_VERSION', 'FLOOR_VERSION', result.insertId, { version: nextVerNum, floorId });

    res.status(201).json({ message: 'Version snapshot created', versionId: result.insertId, versionNumber: nextVerNum });
  } catch (err) {
    console.error('[BlockAPI] Error creating version snapshot:', err);
    res.status(500).json({ error: 'Failed to create version snapshot' });
  }
});

// POST /api/block/floor-versions/:id/publish - Publish version
router.post('/floor-versions/:id/publish', ...requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const [verRows] = await pool.execute('SELECT * FROM floor_versions WHERE id = ?', [id]);
    if (verRows.length === 0) return res.status(404).json({ error: 'Version snapshot not found' });

    const ver = verRows[0];
    const username = req.user?.username || req.user?.name || 'Admin';

    await pool.execute('UPDATE floor_versions SET status = "PUBLISHED", published_at = NOW() WHERE id = ?', [id]);
    await pool.execute('UPDATE floors SET publish_status = "PUBLISHED", current_version_id = ?, published_version_id = ?, updated_by = ? WHERE id = ?', [id, id, username, ver.floor_id]);

    await logAudit(req, 'PUBLISH_VERSION', 'FLOOR_VERSION', id, { version: ver.version_number, floorId: ver.floor_id });

    res.json({ message: `Version ${ver.version_number} published successfully.` });
  } catch (err) {
    console.error('[BlockAPI] Error publishing version:', err);
    res.status(500).json({ error: 'Failed to publish version' });
  }
});

// POST /api/block/floor-versions/:id/restore - Restore past version snapshot
router.post('/floor-versions/:id/restore', ...requireEditor, async (req, res) => {
  try {
    const { id } = req.params;
    const [verRows] = await pool.execute('SELECT * FROM floor_versions WHERE id = ?', [id]);
    if (verRows.length === 0) return res.status(404).json({ error: 'Version not found' });

    const ver = verRows[0];
    const snapshot = typeof ver.snapshot_data === 'string' ? JSON.parse(ver.snapshot_data) : ver.snapshot_data;
    const username = req.user?.username || req.user?.name || 'Admin';
    const floorId = ver.floor_id;

    if (!snapshot || !Array.isArray(snapshot.objects)) {
      return res.status(400).json({ error: 'Invalid version snapshot data' });
    }

    // Delete current draft objects
    await pool.execute('DELETE FROM floor_objects WHERE floor_id = ? AND version_status = "DRAFT"', [floorId]);

    // Restore snapshot objects
    for (const obj of snapshot.objects) {
      await pool.execute(
        `INSERT INTO floor_objects
        (floor_id, layer_id, object_type, geometry_type, x, y, width, height, rotation, points, label, z_index, locked, visible, fill_color, stroke_color, stroke_width, properties, version_status, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)`,
        [
          floorId, obj.layer_id || null, obj.object_type || 'ROOM', obj.geometry_type || 'RECTANGLE',
          Number(obj.x) || 0, Number(obj.y) || 0, Number(obj.width) || 100, Number(obj.height) || 100,
          Number(obj.rotation) || 0, JSON.stringify(obj.points || []), obj.label || '', Number(obj.z_index) || 0,
          obj.locked ? 1 : 0, obj.visible !== false ? 1 : 0, obj.fill_color || '#3B82F6',
          obj.stroke_color || '#1E40AF', Number(obj.stroke_width) || 2, JSON.stringify(obj.properties || {}),
          username, username
        ]
      );
    }

    // Create a new restored version entry (non-destructive history)
    const [vCount] = await pool.execute('SELECT COUNT(*) as cnt FROM floor_versions WHERE floor_id = ?', [floorId]);
    const restoredVerNum = `v${(vCount[0]?.cnt || 0) + 1}.0-Restored-from-${ver.version_number}`;

    await pool.execute(
      'INSERT INTO floor_versions (floor_id, version_number, description, snapshot_data, status, created_by) VALUES (?, ?, ?, ?, "DRAFT", ?)',
      [floorId, restoredVerNum, `Restored from ${ver.version_number}`, ver.snapshot_data, username]
    );

    await logAudit(req, 'RESTORE_VERSION', 'FLOOR_VERSION', id, { version: ver.version_number, floorId });

    res.json({ message: `Successfully restored layout from ${ver.version_number}` });
  } catch (err) {
    console.error('[BlockAPI] Error restoring version snapshot:', err);
    res.status(500).json({ error: 'Failed to restore version snapshot' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. IMPORT / EXPORT APIs
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/block/floors/:floorId/export/json - Full JSON export
router.get('/floors/:floorId/export/json', async (req, res) => {
  try {
    const { floorId } = req.params;
    const [floors] = await pool.execute('SELECT * FROM floors WHERE id = ?', [floorId]);
    if (floors.length === 0) return res.status(404).json({ error: 'Floor not found' });

    const floor = floors[0];
    const [layers] = await pool.execute('SELECT * FROM floor_layers WHERE floor_id = ? ORDER BY z_index ASC', [floorId]);
    const [objects] = await pool.execute('SELECT * FROM floor_objects WHERE floor_id = ? ORDER BY z_index ASC', [floorId]);

    const exportData = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      floor: {
        id: floor.id,
        building_id: floor.building_id,
        name: floor.name,
        code: floor.code,
        floor_number: floor.floor_number,
        width: floor.width,
        height: floor.height,
        boundary_points: typeof floor.boundary_points === 'string' ? JSON.parse(floor.boundary_points) : floor.boundary_points
      },
      layers,
      objects: objects.map(o => ({
        ...o,
        points: typeof o.points === 'string' ? JSON.parse(o.points) : (o.points || []),
        properties: typeof o.properties === 'string' ? JSON.parse(o.properties) : (o.properties || {})
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=floor-${floor.code || floor.id}-layout.json`);
    res.json(exportData);
  } catch (err) {
    console.error('[BlockAPI] Error exporting floor JSON:', err);
    res.status(500).json({ error: 'Failed to export floor JSON' });
  }
});

// POST /api/block/floors/:floorId/import - Import JSON floor plan
router.post('/floors/:floorId/import', ...requireEditor, async (req, res) => {
  try {
    const { floorId } = req.params;
    const importData = req.body;
    const username = req.user?.username || req.user?.name || 'Admin';

    if (!importData || !Array.isArray(importData.objects)) {
      return res.status(400).json({ error: 'Invalid JSON floor plan format. Must contain objects array.' });
    }

    // Replace DRAFT objects with imported vector objects
    await pool.execute('DELETE FROM floor_objects WHERE floor_id = ? AND (version_status = "DRAFT" OR version_status IS NULL)', [floorId]);

    for (const obj of importData.objects) {
      await pool.execute(
        `INSERT INTO floor_objects
        (floor_id, layer_id, object_type, geometry_type, x, y, width, height, rotation, points, label, z_index, locked, visible, fill_color, stroke_color, stroke_width, properties, version_status, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)`,
        [
          floorId, obj.layer_id || null, obj.object_type || 'ROOM', obj.geometry_type || 'RECTANGLE',
          Number(obj.x) || 0, Number(obj.y) || 0, Number(obj.width) || 100, Number(obj.height) || 100,
          Number(obj.rotation) || 0, JSON.stringify(obj.points || []), obj.label || '', Number(obj.z_index) || 0,
          obj.locked ? 1 : 0, obj.visible !== false ? 1 : 0, obj.fill_color || '#3B82F6',
          obj.stroke_color || '#1E40AF', Number(obj.stroke_width) || 2, JSON.stringify(obj.properties || {}),
          username, username
        ]
      );
    }

    await logAudit(req, 'IMPORT_FLOOR_JSON', 'FLOOR', floorId, { count: importData.objects.length });

    res.json({ message: `Successfully imported ${importData.objects.length} floor objects.` });
  } catch (err) {
    console.error('[BlockAPI] Error importing floor JSON:', err);
    res.status(500).json({ error: 'Failed to import floor JSON: ' + err.message });
  }
});

export default router;
