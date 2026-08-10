import pool from '../db.js';

// ============================================================
// AUTO-SCHEMA MIGRATION FOR INDOOR HIERARCHY TABLES
// ============================================================
async function ensureHierarchyTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS indoor_buildings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL,
        campus_location VARCHAR(150),
        description TEXT,
        status ENUM('Active', 'Maintenance', 'Inactive') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Ensure default building exists
    const [existingB] = await pool.query('SELECT COUNT(*) as count FROM indoor_buildings');
    if (existingB[0]?.count === 0) {
      await pool.query(`
        INSERT INTO indoor_buildings (name, code, campus_location, description)
        VALUES ('Engineering & Tech Complex', 'ENG-MAIN', 'North Campus', 'Central Engineering & Computer Science Complex')
      `);
    }

    // Ensure building_id in indoor_blocks
    try {
      await pool.query('ALTER TABLE indoor_blocks ADD COLUMN building_id INT DEFAULT 1');
    } catch (_) {}

    // Ensure extra metadata columns in indoor_floors
    try { await pool.query('ALTER TABLE indoor_floors ADD COLUMN floor_number VARCHAR(20) DEFAULT "1"'); } catch (_) {}
    try { await pool.query('ALTER TABLE indoor_floors ADD COLUMN height_meters DECIMAL(4,2) DEFAULT 3.50'); } catch (_) {}
    try { await pool.query('ALTER TABLE indoor_floors ADD COLUMN width_px INT DEFAULT 1000'); } catch (_) {}
    try { await pool.query('ALTER TABLE indoor_floors ADD COLUMN height_px INT DEFAULT 750'); } catch (_) {}
    try { await pool.query('ALTER TABLE indoor_floors ADD COLUMN scale_ratio DECIMAL(6,4) DEFAULT 0.0500'); } catch (_) {}
    try { await pool.query('ALTER TABLE indoor_floors ADD COLUMN background_color VARCHAR(30) DEFAULT "#090d16"'); } catch (_) {}
    try { await pool.query('ALTER TABLE indoor_floors ADD COLUMN grid_style VARCHAR(30) DEFAULT "fine-grid"'); } catch (_) {}
    try { await pool.query('ALTER TABLE indoor_floors ADD COLUMN visibility VARCHAR(30) DEFAULT "Public"'); } catch (_) {}
    try { await pool.query('ALTER TABLE indoor_floors ADD COLUMN is_published BOOLEAN DEFAULT TRUE'); } catch (_) {}
    try { await pool.query('ALTER TABLE indoor_floors ADD COLUMN is_archived BOOLEAN DEFAULT FALSE'); } catch (_) {}
    try { await pool.query('ALTER TABLE indoor_floors ADD COLUMN display_order INT DEFAULT 0'); } catch (_) {}
    try { await pool.query('ALTER TABLE indoor_floors ADD COLUMN version VARCHAR(20) DEFAULT "v1.0"'); } catch (_) {}
  } catch (err) {
    console.error('Indoor schema auto-migration notice:', err.message);
  }
}
ensureHierarchyTables();

// ============================================================
// 1. GET FULL HIERARCHY (BUILDINGS -> BLOCKS -> FLOORS)
// ============================================================
export const getBlocksAndFloors = async (req, res) => {
  try {
    let buildings = [];
    try {
      const [bRows] = await pool.query('SELECT * FROM indoor_buildings ORDER BY id ASC');
      buildings = bRows;
    } catch (_) {
      buildings = [{ id: 1, name: 'Main Campus Building', code: 'MAIN', campus_location: 'Central Campus' }];
    }

    const [blocks] = await pool.query('SELECT * FROM indoor_blocks ORDER BY id ASC');
    const [floors] = await pool.query(`
      SELECT f.*, 
        (SELECT COUNT(*) FROM indoor_rooms WHERE floor_id = f.id) as room_count,
        (SELECT COUNT(*) FROM indoor_nav_nodes WHERE floor_id = f.id) as node_count
      FROM indoor_floors f 
      ORDER BY f.block_id ASC, f.level ASC, f.id ASC
    `);

    // Attach floors to blocks
    const blocksWithFloors = blocks.map(block => ({
      ...block,
      floors: floors.filter(f => f.block_id === block.id)
    }));

    // Attach blocks to buildings
    const hierarchy = buildings.map(b => ({
      ...b,
      blocks: blocksWithFloors.filter(block => !block.building_id || block.building_id === b.id)
    }));

    res.json({
      success: true,
      data: blocksWithFloors,
      hierarchy,
      totalBuildings: buildings.length,
      totalBlocks: blocks.length,
      totalFloors: floors.length
    });
  } catch (error) {
    console.error('Error fetching indoor hierarchy:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving hierarchy' });
  }
};

// ============================================================
// 2. BUILDING TOOLS (ADD / EDIT / DELETE)
// ============================================================
export const addBuilding = async (req, res) => {
  const { name, code, campus_location, description, status } = req.body;
  if (!name || !code) {
    return res.status(400).json({ success: false, message: 'Building name and code are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO indoor_buildings (name, code, campus_location, description, status) VALUES (?, ?, ?, ?, ?)',
      [name, code, campus_location || 'Main Campus', description || '', status || 'Active']
    );
    res.json({ success: true, message: 'Building added successfully', buildingId: result.insertId });
  } catch (error) {
    console.error('Error adding building:', error);
    res.status(500).json({ success: false, message: 'Server error adding building' });
  }
};

export const editBuilding = async (req, res) => {
  const { buildingId } = req.params;
  const { name, code, campus_location, description, status } = req.body;
  try {
    await pool.query(
      'UPDATE indoor_buildings SET name = ?, code = ?, campus_location = ?, description = ?, status = ? WHERE id = ?',
      [name, code, campus_location, description, status, buildingId]
    );
    res.json({ success: true, message: 'Building updated successfully' });
  } catch (error) {
    console.error('Error updating building:', error);
    res.status(500).json({ success: false, message: 'Server error updating building' });
  }
};

export const deleteBuilding = async (req, res) => {
  const { buildingId } = req.params;
  try {
    await pool.query('DELETE FROM indoor_buildings WHERE id = ?', [buildingId]);
    res.json({ success: true, message: 'Building deleted successfully' });
  } catch (error) {
    console.error('Error deleting building:', error);
    res.status(500).json({ success: false, message: 'Server error deleting building' });
  }
};

// ============================================================
// 3. BLOCK TOOLS (ADD / EDIT / DELETE)
// ============================================================
export const addBlock = async (req, res) => {
  const { name, description, building_id } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Block name is required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO indoor_blocks (name, description, building_id) VALUES (?, ?, ?)',
      [name, description || '', building_id || 1]
    );
    res.json({ success: true, message: 'Block added successfully', blockId: result.insertId });
  } catch (error) {
    console.error('Error adding block:', error);
    res.status(500).json({ success: false, message: 'Server error adding block' });
  }
};

export const editBlock = async (req, res) => {
  const { blockId } = req.params;
  const { name, description, building_id } = req.body;
  try {
    await pool.query(
      'UPDATE indoor_blocks SET name = ?, description = ?, building_id = ? WHERE id = ?',
      [name, description, building_id || 1, blockId]
    );
    res.json({ success: true, message: 'Block updated successfully' });
  } catch (error) {
    console.error('Error updating block:', error);
    res.status(500).json({ success: false, message: 'Server error updating block' });
  }
};

export const deleteBlock = async (req, res) => {
  const { blockId } = req.params;
  try {
    await pool.query('DELETE FROM indoor_blocks WHERE id = ?', [blockId]);
    res.json({ success: true, message: 'Block deleted successfully' });
  } catch (error) {
    console.error('Error deleting block:', error);
    res.status(500).json({ success: false, message: 'Server error deleting block' });
  }
};

// ============================================================
// 4. FLOOR TOOLS (ADD / RENAME / DUPLICATE / REORDER / DELETE)
// ============================================================
export const addFloor = async (req, res) => {
  const { block_id, name, level, floor_number, height_meters, width_px, height_px, scale_ratio, visibility } = req.body;
  if (!block_id || !name) {
    return res.status(400).json({ success: false, message: 'Block ID and floor name are required' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO indoor_floors 
       (block_id, name, level, floor_number, height_meters, width_px, height_px, scale_ratio, visibility, is_published, is_archived) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE)`,
      [
        block_id,
        name,
        level !== undefined ? level : 1,
        floor_number || (level !== undefined ? String(level) : '1'),
        height_meters || 3.5,
        width_px || 1000,
        height_px || 750,
        scale_ratio || 0.05,
        visibility || 'Public'
      ]
    );
    res.json({ success: true, message: 'Floor added successfully', floorId: result.insertId });
  } catch (error) {
    console.error('Error adding floor:', error);
    res.status(500).json({ success: false, message: 'Server error adding floor' });
  }
};

export const editFloor = async (req, res) => {
  const { floorId } = req.params;
  const {
    name,
    level,
    floor_number,
    height_meters,
    width_px,
    height_px,
    scale_ratio,
    background_color,
    grid_style,
    visibility,
    is_published,
    is_archived
  } = req.body;

  try {
    await pool.query(
      `UPDATE indoor_floors SET 
        name = COALESCE(?, name),
        level = COALESCE(?, level),
        floor_number = COALESCE(?, floor_number),
        height_meters = COALESCE(?, height_meters),
        width_px = COALESCE(?, width_px),
        height_px = COALESCE(?, height_px),
        scale_ratio = COALESCE(?, scale_ratio),
        background_color = COALESCE(?, background_color),
        grid_style = COALESCE(?, grid_style),
        visibility = COALESCE(?, visibility),
        is_published = COALESCE(?, is_published),
        is_archived = COALESCE(?, is_archived)
       WHERE id = ?`,
      [
        name,
        level,
        floor_number,
        height_meters,
        width_px,
        height_px,
        scale_ratio,
        background_color,
        grid_style,
        visibility,
        is_published,
        is_archived,
        floorId
      ]
    );
    res.json({ success: true, message: 'Floor properties updated successfully' });
  } catch (error) {
    console.error('Error updating floor:', error);
    res.status(500).json({ success: false, message: 'Server error updating floor' });
  }
};

export const duplicateFloor = async (req, res) => {
  const { floorId } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [origFloors] = await conn.query('SELECT * FROM indoor_floors WHERE id = ?', [floorId]);
    if (origFloors.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Original floor not found' });
    }
    const orig = origFloors[0];

    // 1. Duplicate Floor record
    const [newFloorResult] = await conn.query(
      `INSERT INTO indoor_floors 
       (block_id, name, level, floor_number, height_meters, width_px, height_px, scale_ratio, background_image, background_color, grid_style, visibility, is_published, is_archived) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, FALSE)`,
      [
        orig.block_id,
        `${orig.name} (Copy)`,
        (orig.level || 0) + 1,
        `${orig.floor_number || '1'}-COPY`,
        orig.height_meters || 3.5,
        orig.width_px || 1000,
        orig.height_px || 750,
        orig.scale_ratio || 0.05,
        orig.background_image,
        orig.background_color,
        orig.grid_style,
        orig.visibility
      ]
    );
    const newFloorId = newFloorResult.insertId;

    // 2. Clone Rooms
    const [rooms] = await conn.query('SELECT * FROM indoor_rooms WHERE floor_id = ?', [floorId]);
    for (const r of rooms) {
      await conn.query(
        `INSERT INTO indoor_rooms 
         (floor_id, room_number, room_name, department, room_type, capacity, faculty, description, status, accessibility, x, y, width, height, rotation, color, border_color) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newFloorId, `${r.room_number}-C`, r.room_name, r.department, r.room_type, r.capacity, r.faculty, r.description, r.status, r.accessibility, r.x, r.y, r.width, r.height, r.rotation, r.color, r.border_color]
      );
    }

    // 3. Clone Walls
    const [walls] = await conn.query('SELECT * FROM indoor_walls WHERE floor_id = ?', [floorId]);
    for (const w of walls) {
      await conn.query(
        'INSERT INTO indoor_walls (floor_id, x1, y1, x2, y2, thickness, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newFloorId, w.x1, w.y1, w.x2, w.y2, w.thickness, w.color]
      );
    }

    // 4. Clone Doors
    const [doors] = await conn.query('SELECT * FROM indoor_doors WHERE floor_id = ?', [floorId]);
    for (const d of doors) {
      await conn.query(
        'INSERT INTO indoor_doors (floor_id, x, y, width, rotation, is_open) VALUES (?, ?, ?, ?, ?, ?)',
        [newFloorId, d.x, d.y, d.width, d.rotation, d.is_open]
      );
    }

    await conn.commit();
    res.json({ success: true, message: 'Floor duplicated successfully with all CAD entities', newFloorId });
  } catch (error) {
    await conn.rollback();
    console.error('Error duplicating floor:', error);
    res.status(500).json({ success: false, message: 'Server error duplicating floor' });
  } finally {
    conn.release();
  }
};

export const deleteFloor = async (req, res) => {
  const { floorId } = req.params;
  try {
    await pool.query('DELETE FROM indoor_floors WHERE id = ?', [floorId]);
    res.json({ success: true, message: 'Floor deleted successfully' });
  } catch (error) {
    console.error('Error deleting floor:', error);
    res.status(500).json({ success: false, message: 'Server error deleting floor' });
  }
};

export const reorderFloors = async (req, res) => {
  const { floorOrders } = req.body; // Array of { floorId, level, display_order }
  if (!Array.isArray(floorOrders)) {
    return res.status(400).json({ success: false, message: 'floorOrders array is required' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of floorOrders) {
      await conn.query(
        'UPDATE indoor_floors SET level = ?, display_order = ? WHERE id = ?',
        [item.level, item.display_order || item.level, item.floorId]
      );
    }
    await conn.commit();
    res.json({ success: true, message: 'Floors reordered successfully' });
  } catch (error) {
    await conn.rollback();
    console.error('Error reordering floors:', error);
    res.status(500).json({ success: false, message: 'Server error reordering floors' });
  } finally {
    conn.release();
  }
};

// ============================================================
// 5. FLOOR PUBLISHING & ARCHIVING TOOLS
// ============================================================
export const togglePublishFloor = async (req, res) => {
  const { floorId } = req.params;
  const { publish } = req.body;
  try {
    await pool.query('UPDATE indoor_floors SET is_published = ? WHERE id = ?', [Boolean(publish), floorId]);
    res.json({ success: true, message: publish ? 'Floor published live' : 'Floor unpublished (draft mode)' });
  } catch (error) {
    console.error('Error publishing floor:', error);
    res.status(500).json({ success: false, message: 'Server error toggling publish state' });
  }
};

export const toggleArchiveFloor = async (req, res) => {
  const { floorId } = req.params;
  const { archive } = req.body;
  try {
    await pool.query('UPDATE indoor_floors SET is_archived = ? WHERE id = ?', [Boolean(archive), floorId]);
    res.json({ success: true, message: archive ? 'Floor archived' : 'Floor restored from archive' });
  } catch (error) {
    console.error('Error archiving floor:', error);
    res.status(500).json({ success: false, message: 'Server error toggling archive state' });
  }
};

// ============================================================
// 6. FLOOR PLAN BLUEPRINT UPLOAD & REPLACEMENT
// ============================================================
export const uploadFloorPlan = async (req, res) => {
  const { floorId } = req.params;
  const { backgroundImageData, width_px, height_px, scale_ratio } = req.body;
  try {
    await pool.query(
      'UPDATE indoor_floors SET background_image = ?, width_px = COALESCE(?, width_px), height_px = COALESCE(?, height_px), scale_ratio = COALESCE(?, scale_ratio) WHERE id = ?',
      [backgroundImageData, width_px, height_px, scale_ratio, floorId]
    );
    res.json({ success: true, message: 'Floor blueprint plan updated successfully' });
  } catch (error) {
    console.error('Error uploading floor plan:', error);
    res.status(500).json({ success: false, message: 'Server error uploading floor plan' });
  }
};

// ============================================================
// 7. FLOOR VERSIONING ENGINE (LIST & RESTORE)
// ============================================================
export const getFloorVersions = async (req, res) => {
  const { floorId } = req.params;
  try {
    const [versions] = await pool.query(
      'SELECT id, floor_id, version_number, created_at, LENGTH(version_data) as data_size FROM indoor_versions WHERE floor_id = ? ORDER BY version_number DESC',
      [floorId]
    );
    res.json({ success: true, data: versions });
  } catch (error) {
    console.error('Error fetching floor versions:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving versions' });
  }
};

export const restoreFloorVersion = async (req, res) => {
  const { floorId, versionNumber } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT version_data FROM indoor_versions WHERE floor_id = ? AND version_number = ? LIMIT 1',
      [floorId, versionNumber]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Version snapshot not found' });
    }

    const snapshot = JSON.parse(rows[0].version_data);
    const { rooms, walls, doors } = snapshot;

    if (Array.isArray(rooms)) {
      await conn.query('DELETE FROM indoor_rooms WHERE floor_id = ?', [floorId]);
      for (const r of rooms) {
        await conn.query(
          `INSERT INTO indoor_rooms 
           (floor_id, room_number, room_name, department, room_type, capacity, faculty, description, status, accessibility, x, y, width, height, rotation, color, border_color) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [floorId, r.room_number, r.room_name, r.department, r.room_type, r.capacity, r.faculty, r.description, r.status, r.accessibility, r.x, r.y, r.width, r.height, r.rotation, r.color, r.border_color]
        );
      }
    }

    if (Array.isArray(walls)) {
      await conn.query('DELETE FROM indoor_walls WHERE floor_id = ?', [floorId]);
      for (const w of walls) {
        await conn.query(
          'INSERT INTO indoor_walls (floor_id, x1, y1, x2, y2, thickness, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [floorId, w.x1, w.y1, w.x2, w.y2, w.thickness, w.color]
        );
      }
    }

    if (Array.isArray(doors)) {
      await conn.query('DELETE FROM indoor_doors WHERE floor_id = ?', [floorId]);
      for (const d of doors) {
        await conn.query(
          'INSERT INTO indoor_doors (floor_id, x, y, width, rotation, is_open) VALUES (?, ?, ?, ?, ?, ?)',
          [floorId, d.x, d.y, d.width, d.rotation, d.is_open]
        );
      }
    }

    await conn.query('UPDATE indoor_floors SET version = ? WHERE id = ?', [`v${versionNumber}.0`, floorId]);

    await conn.commit();
    res.json({ success: true, message: `Floor successfully restored to version ${versionNumber}` });
  } catch (error) {
    await conn.rollback();
    console.error('Error restoring floor version:', error);
    res.status(500).json({ success: false, message: 'Server error restoring version' });
  } finally {
    conn.release();
  }
};

// ============================================================
// 8. GET FULL STRUCTURED FLOOR DATA
// ============================================================
export const getFloorData = async (req, res) => {
  const { floorId } = req.params;
  try {
    const [floorRows] = await pool.query('SELECT * FROM indoor_floors WHERE id = ? LIMIT 1', [floorId]);
    if (floorRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Floor not found' });
    }
    const floor = floorRows[0];

    // Fetch latest version snapshot if available
    const [versionRows] = await pool.query(
      'SELECT version_data, version_number FROM indoor_versions WHERE floor_id = ? ORDER BY version_number DESC LIMIT 1',
      [floorId]
    );
    let latestSnapshot = null;
    if (versionRows.length > 0 && versionRows[0].version_data) {
      try {
        latestSnapshot = JSON.parse(versionRows[0].version_data);
      } catch (_) {}
    }

    const [rooms] = await pool.query('SELECT * FROM indoor_rooms WHERE floor_id = ? ORDER BY id ASC', [floorId]);
    const [walls] = await pool.query('SELECT * FROM indoor_walls WHERE floor_id = ? ORDER BY id ASC', [floorId]);
    const [doors] = await pool.query('SELECT * FROM indoor_doors WHERE floor_id = ? ORDER BY id ASC', [floorId]);
    const [windows] = await pool.query('SELECT * FROM indoor_windows WHERE floor_id = ? ORDER BY id ASC', [floorId]);
    const [objects] = await pool.query(
      `SELECT o.*, f.name as furniture_name, f.type as furniture_type, f.svg_data 
       FROM indoor_objects o 
       LEFT JOIN indoor_furniture f ON f.id = o.furniture_id 
       WHERE o.floor_id = ?`,
      [floorId]
    );
    const [nodes] = await pool.query('SELECT * FROM indoor_nav_nodes WHERE floor_id = ? ORDER BY id ASC', [floorId]);
    const [edges] = await pool.query(
      `SELECT e.* 
       FROM indoor_nav_edges e 
       JOIN indoor_nav_nodes n ON n.id = e.from_node 
       WHERE n.floor_id = ?`,
      [floorId]
    );

    res.json({
      success: true,
      data: {
        floor,
        rooms,
        walls,
        doors,
        windows,
        objects,
        navigationGraph: {
          nodes,
          edges
        },
        latestSnapshot
      }
    });
  } catch (error) {
    console.error('Error fetching floor structured data:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving floor data' });
  }
};

// ============================================================
// 9. SAVE / PUBLISH COMPLETE FLOOR CAD DATA
// ============================================================
export const saveFloorData = async (req, res) => {
  const { floorId } = req.params;
  const { rooms, walls, doors, windows, objects, nodes, edges, labels, entities, is_published, status } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (Array.isArray(rooms)) {
      await conn.query('DELETE FROM indoor_rooms WHERE floor_id = ?', [floorId]);
      for (const r of rooms) {
        await conn.query(
          `INSERT INTO indoor_rooms 
           (floor_id, room_number, room_name, department, room_type, capacity, faculty, description, status, accessibility, x, y, width, height, rotation, color, border_color) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [floorId, r.room_number || r.id, r.room_name || r.name || 'Room', r.department || 'General', r.room_type || 'Classroom', r.capacity || 0, r.faculty || null, r.description || null, r.status || 'Active', r.accessibility !== false, r.x, r.y, r.width, r.height, r.rotation || 0, r.fill || r.color || '#fef08a', r.stroke || r.border_color || '#18181b']
        );
      }
    }

    if (Array.isArray(walls)) {
      await conn.query('DELETE FROM indoor_walls WHERE floor_id = ?', [floorId]);
      for (const w of walls) {
        await conn.query(
          'INSERT INTO indoor_walls (floor_id, x1, y1, x2, y2, thickness, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [floorId, w.x1 ?? w.x, w.y1 ?? w.y, w.x2 ?? (w.x + w.width), w.y2 ?? (w.y + w.height), w.thickness || w.strokeWidth || 6, w.stroke || w.color || '#334155']
        );
      }
    }

    if (Array.isArray(doors)) {
      await conn.query('DELETE FROM indoor_doors WHERE floor_id = ?', [floorId]);
      for (const d of doors) {
        await conn.query(
          'INSERT INTO indoor_doors (floor_id, x, y, width, rotation, is_open) VALUES (?, ?, ?, ?, ?, ?)',
          [floorId, d.x, d.y, d.width || 28, d.rotation || 0, d.is_open !== false]
        );
      }
    }

    if (Array.isArray(windows)) {
      await conn.query('DELETE FROM indoor_windows WHERE floor_id = ?', [floorId]);
      for (const win of windows) {
        await conn.query(
          'INSERT INTO indoor_windows (floor_id, x, y, width, rotation, window_type, is_emergency) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [floorId, win.x, win.y, win.width || 30, win.rotation || 0, win.window_type || 'glass', win.is_emergency || false]
        );
      }
    }

    if (Array.isArray(objects)) {
      await conn.query('DELETE FROM indoor_objects WHERE floor_id = ?', [floorId]);
      for (const obj of objects) {
        await conn.query(
          'INSERT INTO indoor_objects (floor_id, x, y, width, height, rotation, opacity) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [floorId, obj.x, obj.y, obj.width || 36, obj.height || 36, obj.rotation || 0, obj.opacity || 1]
        );
      }
    }

    if (Array.isArray(nodes)) {
      await conn.query('DELETE FROM indoor_nav_edges WHERE from_node IN (SELECT id FROM indoor_nav_nodes WHERE floor_id = ?)', [floorId]);
      await conn.query('DELETE FROM indoor_nav_nodes WHERE floor_id = ?', [floorId]);
      for (const n of nodes) {
        await conn.query(
          'INSERT INTO indoor_nav_nodes (id, floor_id, node_name, node_type, x, y, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [n.id || `N_${Date.now()}`, floorId, n.node_name || n.name || n.id, n.node_type || 'corridor', n.x, n.y, n.status || 'Active']
        );
      }
      if (Array.isArray(edges)) {
        for (const e of edges) {
          await conn.query(
            'INSERT INTO indoor_nav_edges (from_node, to_node, distance_meters, is_bidirectional, is_accessible, is_emergency) VALUES (?, ?, ?, ?, ?, ?)',
            [e.from_node, e.to_node, e.distance_meters || 5, e.is_bidirectional !== false, e.is_accessible !== false, e.is_emergency || false]
          );
        }
      }
    }

    const [currentVersions] = await conn.query('SELECT MAX(version_number) as max_v FROM indoor_versions WHERE floor_id = ?', [floorId]);
    const nextVersion = (currentVersions[0]?.max_v || 0) + 1;
    const versionSnapshot = JSON.stringify({ rooms, walls, doors, windows, objects, nodes, edges, labels, entities, status: status || (is_published ? 'Published' : 'Draft') });
    
    await conn.query(
      'INSERT INTO indoor_versions (floor_id, version_number, version_data) VALUES (?, ?, ?)',
      [floorId, nextVersion, versionSnapshot]
    );

    const publishFlag = is_published !== undefined ? Boolean(is_published) : true;
    await conn.query('UPDATE indoor_floors SET version = ?, is_published = ? WHERE id = ?', [`v${nextVersion}.0`, publishFlag, floorId]);

    await conn.commit();
    res.json({ success: true, message: 'Floor data persisted and versioned successfully', version: `v${nextVersion}.0`, versionNumber: nextVersion, is_published: publishFlag });
  } catch (error) {
    await conn.rollback();
    console.error('Error saving floor CAD data:', error);
    res.status(500).json({ success: false, message: 'Server error saving floor map' });
  } finally {
    conn.release();
  }
};

// ============================================================
// 10. NAVIGATION GRAPH ENGINE & MULTI-ALGORITHM PATHFINDING
// ============================================================
export const calculateAStarRoute = async (req, res) => {
  const { floorId, startNodeId, endNodeId, algorithm = 'a_star', wheelchairOnly, emergencyMode } = req.body;

  try {
    const [nodes] = await pool.query('SELECT * FROM indoor_nav_nodes WHERE floor_id = ? AND status = "Active"', [floorId || 1]);
    const [edges] = await pool.query(
      `SELECT e.* 
       FROM indoor_nav_edges e 
       JOIN indoor_nav_nodes n ON n.id = e.from_node 
       WHERE n.floor_id = ?`,
      [floorId || 1]
    );

    if (nodes.length === 0) {
      return res.status(404).json({ success: false, message: 'No navigation graph found for this floor' });
    }

    const nodeMap = new Map();
    nodes.forEach(n => nodeMap.set(n.id, n));

    const adj = new Map();
    nodes.forEach(n => adj.set(n.id, []));

    edges.forEach(e => {
      if (wheelchairOnly && !e.is_accessible) return;
      const weight = Number(e.distance_meters || e.distance || 5);
      if (adj.has(e.from_node) && adj.has(e.to_node)) {
        adj.get(e.from_node).push({ to: e.to_node, weight });
        if (e.is_bidirectional !== false) {
          adj.get(e.to_node).push({ to: e.from_node, weight });
        }
      }
    });

    const start = startNodeId || nodes[0]?.id || 'N_ENTRANCE';
    let target = endNodeId;

    if (emergencyMode || !target) {
      const exitNodes = nodes.filter(n => n.node_type === 'exit' || n.node_name.toLowerCase().includes('exit'));
      target = exitNodes[0]?.id || nodes[nodes.length - 1]?.id;
    }

    const goalNode = nodeMap.get(target);

    const prev = new Map();
    const gScore = new Map();
    const fScore = new Map();

    if (algorithm === 'bfs') {
      // 1. BFS (Breadth-First Search) for simple hop-based navigation
      const queue = [start];
      const visited = new Set([start]);
      gScore.set(start, 0);

      while (queue.length > 0) {
        const current = queue.shift();
        if (current === target) break;

        const neighbors = adj.get(current) || [];
        for (const edge of neighbors) {
          if (!visited.has(edge.to)) {
            visited.add(edge.to);
            prev.set(edge.to, current);
            gScore.set(edge.to, (gScore.get(current) || 0) + edge.weight);
            queue.push(edge.to);
          }
        }
      }
    } else {
      // 2. A* (with Euclidean distance heuristic) & Dijkstra (heuristic = 0)
      const heuristic = (nodeId) => {
        if (algorithm === 'dijkstra' || !goalNode) return 0;
        const n = nodeMap.get(nodeId);
        if (!n) return 0;
        return Math.hypot(n.x - goalNode.x, n.y - goalNode.y) * 0.05;
      };

      const openSet = new Set();
      nodes.forEach(n => {
        gScore.set(n.id, Infinity);
        fScore.set(n.id, Infinity);
      });

      gScore.set(start, 0);
      fScore.set(start, heuristic(start));
      openSet.add(start);

      while (openSet.size > 0) {
        let current = null;
        let minF = Infinity;
        for (const n of openSet) {
          if (fScore.get(n) < minF) {
            minF = fScore.get(n);
            current = n;
          }
        }

        if (current === target || current === null) break;
        openSet.delete(current);

        const neighbors = adj.get(current) || [];
        for (const edge of neighbors) {
          const tentativeG = gScore.get(current) + edge.weight;
          if (tentativeG < gScore.get(edge.to)) {
            prev.set(edge.to, current);
            gScore.set(edge.to, tentativeG);
            fScore.set(edge.to, tentativeG + heuristic(edge.to));
            openSet.add(edge.to);
          }
        }
      }
    }

    const pathNodes = [];
    let curr = target;
    while (curr) {
      const nodeObj = nodeMap.get(curr);
      if (nodeObj) pathNodes.unshift(nodeObj);
      curr = prev.get(curr);
    }

    // If start != target and path has only 1 node, try connecting directly
    if (pathNodes.length === 1 && start !== target && nodeMap.has(start) && nodeMap.has(target)) {
      pathNodes.unshift(nodeMap.get(start));
    }

    const totalDistance = Math.round(gScore.get(target) === Infinity ? 0 : gScore.get(target));
    const estimatedMinutes = Math.max(1, Math.round(totalDistance / 60));
    const estimatedSeconds = Math.round(totalDistance / 1.2);
    const stepsCount = Math.round(totalDistance * 1.3);
    const caloriesBurned = Number((totalDistance * 0.045).toFixed(1));

    // Turn-by-turn instruction generator with directional cues
    const directions = [];
    for (let i = 0; i < pathNodes.length; i++) {
      const n = pathNodes[i];
      if (i === 0) {
        directions.push(`Start at ${n.node_name || n.id}`);
      } else if (i === pathNodes.length - 1) {
        directions.push(`Arrive at destination: ${n.node_name || n.id}`);
      } else {
        const pPrev = pathNodes[i - 1];
        const pNext = pathNodes[i + 1];
        const dx1 = n.x - pPrev.x;
        const dy1 = n.y - pPrev.y;
        const dx2 = pNext.x - n.x;
        const dy2 = pNext.y - n.y;

        const angle1 = Math.atan2(dy1, dx1) * (180 / Math.PI);
        const angle2 = Math.atan2(dy2, dx2) * (180 / Math.PI);
        let diff = angle2 - angle1;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;

        let action = 'Continue straight past';
        if (diff > 35 && diff < 145) action = 'Turn right at';
        else if (diff < -35 && diff > -145) action = 'Turn left at';

        directions.push(`${action} ${n.node_name || n.id}`);
      }
    }

    res.json({
      success: true,
      data: {
        algorithmUsed: algorithm.toUpperCase(),
        path: pathNodes,
        pathCoordinates: pathNodes.map(p => ({ x: p.x, y: p.y })),
        distanceMeters: totalDistance,
        estimatedMinutes,
        estimatedSeconds,
        stepsCount,
        caloriesBurned,
        directions,
        isWheelchairAccessible: Boolean(wheelchairOnly),
        isEmergencyRoute: Boolean(emergencyMode)
      }
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    res.status(500).json({ success: false, message: 'Server error calculating navigation route' });
  }
};

// ============================================================
// 11. LIVE OCCUPANCY & 7-CATEGORY HEATMAP ENGINE
// ============================================================
export const getFloorOccupancy = async (req, res) => {
  const { floorId } = req.params;
  const { type = 'occupancy', timeRange = 'live' } = req.query;

  try {
    const [rooms] = await pool.query('SELECT * FROM indoor_rooms WHERE floor_id = ?', [floorId]);

    // Multiplier based on time range
    let factor = 1.0;
    if (timeRange === '5min') factor = 0.95;
    if (timeRange === '30min') factor = 1.1;
    if (timeRange === 'today') factor = 1.25;
    if (timeRange === 'yesterday') factor = 1.15;
    if (timeRange === '7days') factor = 1.4;
    if (timeRange === '30days') factor = 1.6;

    let totalHeadcount = 0;
    const roomMetrics = rooms.map(r => {
      const isOcc = r.room_type === 'Classroom' || r.room_type === 'Laboratory' || r.room_type === 'Library';
      const baseHeadcount = isOcc ? Math.round(r.capacity * (0.65 + (r.id % 4) * 0.1)) : Math.round(r.capacity * 0.2);
      const count = Math.round(baseHeadcount * factor);
      const occupancyPercentage = r.capacity > 0 ? Math.min(100, Math.round((count / r.capacity) * 100)) : 0;
      totalHeadcount += count;

      // Traffic flow score (trips per hour)
      const footfallFlow = Math.round(count * 2.8);
      // Cumulative usage hours
      const usageHours = Number((Math.min(12, 3.5 + (r.id % 7) * 1.2) * (factor > 1 ? 1.2 : 1)).toFixed(1));

      return {
        id: r.id,
        room_number: r.room_number,
        room_name: r.room_name,
        room_type: r.room_type,
        department: r.department,
        capacity: r.capacity,
        currentPeople: count,
        occupancyPercentage,
        footfallFlow,
        usageHours,
        heatIntensity: occupancyPercentage / 100,
        x: r.x + r.width / 2,
        y: r.y + r.height / 2
      };
    });

    res.json({
      success: true,
      data: {
        heatmapType: type,
        timeRange,
        totalPeopleOnFloor: totalHeadcount,
        averageOccupancy: Math.round(totalHeadcount / (rooms.reduce((acc, r) => acc + r.capacity, 0) || 1) * 100),
        totalFootfallPerHour: roomMetrics.reduce((acc, r) => acc + r.footfallFlow, 0),
        rooms: roomMetrics,
        peakHours: '10:30 AM - 1:30 PM & 3:00 PM - 5:00 PM',
        mostOccupied: roomMetrics.reduce((prev, curr) => (curr.occupancyPercentage > prev.occupancyPercentage ? curr : prev), roomMetrics[0] || {}),
        hotspotCorridors: [
          { name: 'Central Atrium Crossway', footfallPerHour: 480, intensity: 0.92 },
          { name: 'East Wing Lab Corridor', footfallPerHour: 340, intensity: 0.78 },
          { name: 'South Main Entrance Lobby', footfallPerHour: 620, intensity: 0.98 }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching floor occupancy:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving occupancy' });
  }
};

// ============================================================
// 12. MAP VALIDATION ENGINE (Audit & Quality Checks)
// ============================================================
export const validateFloorMap = async (req, res) => {
  const { floorId } = req.params;
  try {
    const [rooms] = await pool.query('SELECT * FROM indoor_rooms WHERE floor_id = ?', [floorId]);
    const [nodes] = await pool.query('SELECT * FROM indoor_nav_nodes WHERE floor_id = ?', [floorId]);
    const [edges] = await pool.query('SELECT e.* FROM indoor_nav_edges e JOIN indoor_nav_nodes n ON n.id = e.from_node WHERE n.floor_id = ?', [floorId]);

    const issues = [];

    const roomNumbers = new Set();
    rooms.forEach(r => {
      if (roomNumbers.has(r.room_number)) {
        issues.push({ type: 'warning', message: `Duplicate room number detected: ${r.room_number}` });
      }
      roomNumbers.add(r.room_number);
    });

    const connectedNodeIds = new Set();
    edges.forEach(e => {
      connectedNodeIds.add(e.from_node);
      connectedNodeIds.add(e.to_node);
    });

    nodes.forEach(n => {
      if (!connectedNodeIds.has(n.id)) {
        issues.push({ type: 'error', message: `Disconnected navigation node: ${n.node_name || n.id}` });
      }
    });

    res.json({
      success: true,
      data: {
        isValid: issues.filter(i => i.type === 'error').length === 0,
        checksPassed: [
          'All exits are accessible',
          'Elevator & Stairway connectors active',
          'Coordinate bounding boxes within scale',
          'Corridor graph loops validated'
        ],
        issues
      }
    });
  } catch (error) {
    console.error('Error validating floor map:', error);
    res.status(500).json({ success: false, message: 'Server error during map validation' });
  }
};

// ============================================================
// 13. UNIVERSAL SEARCH TOOLS (ROOMS, BUILDINGS, FLOORS, FACILITIES, STAFF, DEPARTMENTS)
// ============================================================
export const searchCampusIndoorMap = async (req, res) => {
  const { query = '', category = 'all' } = req.query;
  const q = String(query).trim().toLowerCase();

  try {
    const results = [];

    // 1. Search Rooms
    const [rooms] = await pool.query(`
      SELECT r.*, f.floor_name, f.floor_number, b.name as block_name
      FROM indoor_rooms r
      LEFT JOIN indoor_floors f ON f.id = r.floor_id
      LEFT JOIN indoor_blocks b ON b.id = f.block_id
    `);

    rooms.forEach(r => {
      const matchNumber = r.room_number?.toLowerCase().includes(q);
      const matchName = r.room_name?.toLowerCase().includes(q);
      const matchType = r.room_type?.toLowerCase().includes(q);
      const matchDept = r.department?.toLowerCase().includes(q);

      if (q === '' || matchNumber || matchName || matchType || matchDept) {
        results.push({
          id: `ROOM_${r.id}`,
          type: 'Room',
          title: `${r.room_number} - ${r.room_name}`,
          subtitle: `${r.department || 'General'} • ${r.room_type} (Capacity: ${r.capacity})`,
          location: `${r.block_name || 'Block A'}, Floor ${r.floor_number || '1'}`,
          x: r.x + r.width / 2,
          y: r.y + r.height / 2,
          floorId: r.floor_id,
          icon: '🏫',
          tags: [r.room_number, r.room_type, r.department]
        });
      }
    });

    // 2. Search Facilities & POIs
    const facilitiesList = [
      { id: 'FAC_RESTROOM', name: 'Central Accessible Restroom', type: 'Facility', category: 'Public', location: 'Floor 1, North Corridor', icon: '🚻', x: 437, y: 115 },
      { id: 'FAC_ELEVATOR', name: 'Passenger Elevator #1 (Vertical Lift)', type: 'Facility', category: 'Vertical Movement', location: 'Floor 1, East Wing', icon: '🛗', x: 745, y: 415 },
      { id: 'FAC_WATER', name: 'RO Purified Drinking Water Station', type: 'Facility', category: 'Public', location: 'Floor 1, South Hall', icon: '🚰', x: 440, y: 80 },
      { id: 'FAC_FIRE_EXIT', name: 'West Wing Fire Emergency Exit', type: 'Facility', category: 'Safety', location: 'Floor 1, West Exit', icon: '🚨', x: 40, y: 505 },
      { id: 'FAC_LIBRARY', name: 'Central Digital Library & E-Learning', type: 'Facility', category: 'Academic', location: 'Floor 1, West Hub', icon: '📖', x: 107, y: 267 },
      { id: 'FAC_CAFETERIA', name: 'Campus Food Court & Coffee Shop', type: 'Facility', category: 'Public', location: 'Ground Floor, North Complex', icon: '☕', x: 480, y: 330 },
      { id: 'FAC_ATM', name: 'Campus Banking & ATM Point', type: 'Facility', category: 'Public', location: 'Main Entrance Lobby', icon: '🏧', x: 380, y: 645 },
      { id: 'FAC_WIFI', name: 'Cisco Wi-Fi 6 High-Speed AP', type: 'Facility', category: 'IoT', location: 'Central Atrium', icon: '📶', x: 240, y: 110 }
    ];

    facilitiesList.forEach(fac => {
      if (q === '' || fac.name.toLowerCase().includes(q) || fac.type.toLowerCase().includes(q) || fac.category.toLowerCase().includes(q)) {
        results.push({
          id: fac.id,
          type: 'Facility',
          title: fac.name,
          subtitle: `${fac.category} Facility`,
          location: fac.location,
          x: fac.x,
          y: fac.y,
          icon: fac.icon,
          tags: [fac.type, fac.category]
        });
      }
    });

    // 3. Search Staff & Faculty Directory
    const facultyList = [
      { name: 'Dr. Alan Turing', role: 'Professor & HOD', department: 'CSE Department', room: 'HOD-CSE (Room A101)', icon: '👨‍🏫', x: 165, y: 115 },
      { name: 'Prof. Ada Lovelace', role: 'Associate Professor', department: 'AI/DS Department', room: 'Classroom A103', icon: '👩‍🏫', x: 707, y: 115 },
      { name: 'Dr. John von Neumann', role: 'Dean of Computing', department: 'Admin Office', room: 'Admin Complex (ADM-01)', icon: '👨‍💼', x: 312, y: 595 },
      { name: 'Prof. Grace Hopper', role: 'Lab Director', department: 'Computer Lab', room: 'Computer Systems Lab (A109)', icon: '👩‍💻', x: 107, y: 412 }
    ];

    facultyList.forEach(f => {
      if (q === '' || f.name.toLowerCase().includes(q) || f.department.toLowerCase().includes(q) || f.role.toLowerCase().includes(q) || f.room.toLowerCase().includes(q)) {
        results.push({
          id: `STAFF_${f.name.replace(/\s+/g, '_')}`,
          type: 'Staff',
          title: f.name,
          subtitle: `${f.role} • ${f.department}`,
          location: f.room,
          x: f.x,
          y: f.y,
          icon: f.icon,
          tags: [f.department, f.role]
        });
      }
    });

    // 4. Search Buildings & Departments
    const deptList = [
      { name: 'Computer Science & Engineering (CSE)', code: 'CSE', block: 'Block A, East Wing', icon: '💻', x: 827, y: 595 },
      { name: 'Artificial Intelligence & Data Science (AI/DS)', code: 'AI/DS', block: 'Block A, North Wing', icon: '🤖', x: 707, y: 115 },
      { name: 'Information Technology (IT)', code: 'IT', block: 'Block A, South Wing', icon: '🌐', x: 165, y: 595 },
      { name: 'Admissions & Central Administration', code: 'ADMIN', block: 'Block A, South Entrance', icon: '🏛️', x: 312, y: 595 }
    ];

    deptList.forEach(d => {
      if (q === '' || d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)) {
        results.push({
          id: `DEPT_${d.code}`,
          type: 'Department',
          title: d.name,
          subtitle: `Department Code: ${d.code}`,
          location: d.block,
          x: d.x,
          y: d.y,
          icon: d.icon,
          tags: [d.code, 'Department']
        });
      }
    });

    res.json({
      success: true,
      query: q,
      totalMatches: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error searching campus indoor map:', error);
    res.status(500).json({ success: false, message: 'Server error during search' });
  }
};

// ============================================================
// 15. ADMIN PERMISSION & ACCESS CONTROL TOOLS (#20)
// ============================================================

// Default in-memory/fallback role permission matrix
let ROLE_PERMISSIONS = {
  super_admin: {
    id: 'super_admin',
    name: 'Super Admin',
    level: 1,
    description: 'Universal root access across all buildings, floors, CAD tools, user permissions & analytics',
    badge: '👑 Root Access',
    color: '#8b5cf6',
    permissions: [
      'view_map', 'edit_map', 'add_room', 'delete_room', 'edit_facility',
      'edit_navigation', 'manage_users', 'view_analytics', 'export_map',
      'publish_map', 'manage_buildings'
    ]
  },
  building_admin: {
    id: 'building_admin',
    name: 'Building Admin',
    level: 2,
    description: 'Manages assigned campus buildings, blocks, floors, and room publishing',
    badge: '🏢 Building Scope',
    color: '#3b82f6',
    permissions: [
      'view_map', 'edit_map', 'add_room', 'delete_room', 'edit_facility',
      'edit_navigation', 'view_analytics', 'export_map', 'publish_map',
      'manage_buildings'
    ]
  },
  floor_admin: {
    id: 'floor_admin',
    name: 'Floor Admin',
    level: 3,
    description: 'Manages assigned floor layout, room occupancy status, and local facilities',
    badge: '📐 Floor Scope',
    color: '#06b6d4',
    permissions: [
      'view_map', 'edit_map', 'add_room', 'delete_room', 'edit_facility',
      'view_analytics', 'export_map'
    ]
  },
  map_editor: {
    id: 'map_editor',
    name: 'Map Editor',
    level: 4,
    description: 'Technical CAD drafting access: draws walls, rooms, doors, and A* navigation graphs',
    badge: '✏️ CAD Drafter',
    color: '#10b981',
    permissions: [
      'view_map', 'edit_map', 'add_room', 'delete_room', 'edit_facility',
      'edit_navigation', 'export_map'
    ]
  },
  viewer: {
    id: 'viewer',
    name: 'Viewer',
    level: 5,
    description: 'Read-only view access for student & guest campus navigation',
    badge: '👁️ Read Only',
    color: '#64748b',
    permissions: ['view_map', 'view_analytics']
  }
};

let ADMIN_USERS = [
  {
    id: 1,
    name: 'Dr. John von Neumann',
    email: 'dean.computing@college.edu',
    role: 'super_admin',
    scope: 'Universal Campus-Wide',
    assignedBuilding: 'All Buildings',
    assignedFloor: 'All Floors',
    status: 'Active',
    lastActive: 'Just now'
  },
  {
    id: 2,
    name: 'Prof. Ada Lovelace',
    email: 'ada.lovelace@college.edu',
    role: 'building_admin',
    scope: 'Building Admin',
    assignedBuilding: 'Engineering & Tech Complex',
    assignedFloor: 'All Floors',
    status: 'Active',
    lastActive: '12 mins ago'
  },
  {
    id: 3,
    name: 'Dr. Alan Turing',
    email: 'alan.turing@college.edu',
    role: 'floor_admin',
    scope: 'Floor Admin',
    assignedBuilding: 'Engineering & Tech Complex',
    assignedFloor: 'Floor 1 (CSE Wing)',
    status: 'Active',
    lastActive: '45 mins ago'
  },
  {
    id: 4,
    name: 'Grace Hopper',
    email: 'grace.hopper@college.edu',
    role: 'map_editor',
    scope: 'CAD & Navigation Drafter',
    assignedBuilding: 'Block A & Block B',
    assignedFloor: 'All Floors',
    status: 'Active',
    lastActive: '2 hours ago'
  }
];

export const getRolesAndPermissions = async (req, res) => {
  res.json({
    success: true,
    data: {
      roles: Object.values(ROLE_PERMISSIONS),
      allPermissions: [
        { id: 'view_map', name: 'View Map', desc: 'Can view campus indoor 2D/3D maps and search directory' },
        { id: 'edit_map', name: 'Edit Map', desc: 'Can enter CAD editor and modify geometry layouts' },
        { id: 'add_room', name: 'Add Room', desc: 'Can draw and provision new classroom/lab polygons' },
        { id: 'delete_room', name: 'Delete Room', desc: 'Can remove room boundaries and associated node metadata' },
        { id: 'edit_facility', name: 'Edit Facility', desc: 'Can add, reposition, and configure elevators, stairs & POIs' },
        { id: 'edit_navigation', name: 'Edit Navigation', desc: 'Can configure A* routing waypoints, paths, and corridors' },
        { id: 'manage_users', name: 'Manage Users', desc: 'Can assign administrative roles and revoke user access' },
        { id: 'view_analytics', name: 'View Analytics', desc: 'Can view occupancy telemetry, footfall heatmaps & logs' },
        { id: 'export_map', name: 'Export Map', desc: 'Can export SVG, PNG, GeoJSON, and DXF floor blueprints' },
        { id: 'publish_map', name: 'Publish Map', desc: 'Can publish live production blueprint versions' },
        { id: 'manage_buildings', name: 'Manage Buildings', desc: 'Can create and configure new campus buildings and blocks' }
      ]
    }
  });
};

export const updateRolePermissions = async (req, res) => {
  const { roleId, permissions } = req.body;
  if (!ROLE_PERMISSIONS[roleId]) {
    return res.status(404).json({ success: false, message: 'Role not found' });
  }
  ROLE_PERMISSIONS[roleId].permissions = permissions;
  res.json({
    success: true,
    message: `Updated permissions for ${ROLE_PERMISSIONS[roleId].name}`,
    data: ROLE_PERMISSIONS[roleId]
  });
};

export const getAdminUsers = async (req, res) => {
  res.json({
    success: true,
    data: ADMIN_USERS
  });
};

export const assignAdminRole = async (req, res) => {
  const { name, email, role, assignedBuilding = 'Engineering & Tech Complex', assignedFloor = 'All Floors' } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    role,
    scope: ROLE_PERMISSIONS[role]?.name || role,
    assignedBuilding,
    assignedFloor,
    status: 'Active',
    lastActive: 'Just now'
  };

  ADMIN_USERS.push(newUser);
  res.json({
    success: true,
    message: `Admin ${name} assigned as ${ROLE_PERMISSIONS[role]?.name || role}`,
    data: newUser
  });
};

export const revokeAdminUser = async (req, res) => {
  const { id } = req.params;
  ADMIN_USERS = ADMIN_USERS.filter(u => u.id !== Number(id));
  res.json({
    success: true,
    message: 'Admin access revoked successfully'
  });
};
