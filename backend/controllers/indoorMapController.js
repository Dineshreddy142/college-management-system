import pool from '../db.js';

// ==========================================
// BLOCKS
// ==========================================
export const getBlocks = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM indoor_blocks ORDER BY id');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createBlock = async (req, res) => {
    try {
        const { name, description } = req.body;
        const [result] = await pool.query(
            'INSERT INTO indoor_blocks (name, description) VALUES (?, ?)',
            [name, description]
        );
        res.status(201).json({ id: result.insertId, name, description });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateBlock = async (req, res) => {
    try {
        const { name, description } = req.body;
        await pool.query(
            'UPDATE indoor_blocks SET name=?, description=? WHERE id=?',
            [name, description, req.params.id]
        );
        res.json({ message: "Updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteBlock = async (req, res) => {
    try {
        await pool.query('DELETE FROM indoor_blocks WHERE id=?', [req.params.id]);
        res.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================================
// FLOORS
// ==========================================
export const getFloors = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM indoor_floors WHERE block_id = ? ORDER BY level', [req.params.blockId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createFloor = async (req, res) => {
    try {
        const { block_id, name, level, background_image } = req.body;
        const [result] = await pool.query(
            'INSERT INTO indoor_floors (block_id, name, level, background_image) VALUES (?, ?, ?, ?)',
            [block_id, name, level, background_image || null]
        );
        res.status(201).json({ id: result.insertId, block_id, name, level });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateFloor = async (req, res) => {
    try {
        const { name, level, background_image } = req.body;
        await pool.query(
            'UPDATE indoor_floors SET name=?, level=?, background_image=? WHERE id=?',
            [name, level, background_image, req.params.id]
        );
        res.json({ message: "Updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteFloor = async (req, res) => {
    try {
        await pool.query('DELETE FROM indoor_floors WHERE id=?', [req.params.id]);
        res.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================================
// ROOMS
// ==========================================
export const getRooms = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM indoor_rooms WHERE floor_id = ?', [req.params.floorId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createRoom = async (req, res) => {
    try {
        const { 
            floor_id, room_number, room_name, department, room_type, capacity, faculty, description,
            x, y, width, height, color 
        } = req.body;
        const [result] = await pool.query(
            `INSERT INTO indoor_rooms 
            (floor_id, room_number, room_name, department, room_type, capacity, faculty, description, x, y, width, height, color) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [floor_id, room_number, room_name, department, room_type, capacity, faculty, description, x||0, y||0, width||100, height||100, color||'#ffffff']
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateRoom = async (req, res) => {
    try {
        const fields = Object.keys(req.body);
        if(fields.length === 0) return res.json({message: "No fields to update"});
        
        const setClause = fields.map(f => `${f}=?`).join(', ');
        const values = Object.values(req.body);
        values.push(req.params.id);

        await pool.query(`UPDATE indoor_rooms SET ${setClause} WHERE id=?`, values);
        res.json({ message: "Updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteRoom = async (req, res) => {
    try {
        await pool.query('DELETE FROM indoor_rooms WHERE id=?', [req.params.id]);
        res.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// ==========================================
// CANVAS STATE (Walls, Doors, Windows, Objects)
// ==========================================
export const getFurniture = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM indoor_furniture');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getFloorState = async (floorId) => {
    const [walls] = await pool.query('SELECT * FROM indoor_walls WHERE floor_id = ?', [floorId]);
    const [doors] = await pool.query('SELECT * FROM indoor_doors WHERE floor_id = ?', [floorId]);
    const [windows] = await pool.query('SELECT * FROM indoor_windows WHERE floor_id = ?', [floorId]);
    const [rooms] = await pool.query('SELECT * FROM indoor_rooms WHERE floor_id = ?', [floorId]);
    const [objects] = await pool.query('SELECT * FROM indoor_objects WHERE floor_id = ?', [floorId]);
    return { walls, doors, windows, rooms, objects };
};

export const getFloorObjects = async (req, res) => {
    try {
        const state = await getFloorState(req.params.floorId);
        res.json(state);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const saveFloorState = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const floorId = req.params.floorId;
        const { walls, doors, windows, rooms, objects } = req.body;

        // Clear existing drawing elements
        await connection.query('DELETE FROM indoor_walls WHERE floor_id=?', [floorId]);
        await connection.query('DELETE FROM indoor_doors WHERE floor_id=?', [floorId]);
        await connection.query('DELETE FROM indoor_windows WHERE floor_id=?', [floorId]);
        await connection.query('DELETE FROM indoor_objects WHERE floor_id=?', [floorId]);

        // Insert new elements
        if (walls && walls.length > 0) {
            const wallValues = walls.map(w => [floorId, w.x1, w.y1, w.x2, w.y2, w.thickness, w.color]);
            await connection.query('INSERT INTO indoor_walls (floor_id, x1, y1, x2, y2, thickness, color) VALUES ?', [wallValues]);
        }
        if (doors && doors.length > 0) {
            const doorValues = doors.map(d => [floorId, d.x, d.y, d.width, d.rotation, d.is_open ? 1 : 0]);
            await connection.query('INSERT INTO indoor_doors (floor_id, x, y, width, rotation, is_open) VALUES ?', [doorValues]);
        }
        if (windows && windows.length > 0) {
            const windowValues = windows.map(w => [floorId, w.x, w.y, w.width, w.rotation]);
            await connection.query('INSERT INTO indoor_windows (floor_id, x, y, width, rotation) VALUES ?', [windowValues]);
        }
        if (objects && objects.length > 0) {
            const objValues = objects.map(o => [floorId, o.furniture_id, o.room_id || null, o.x, o.y, o.width, o.height, o.rotation, o.opacity]);
            await connection.query('INSERT INTO indoor_objects (floor_id, furniture_id, room_id, x, y, width, height, rotation, opacity) VALUES ?', [objValues]);
        }

        // Rooms are handled individually via create/update, but if sent in state, we could update coords
        if (rooms && rooms.length > 0) {
            for(const r of rooms) {
                if(r.id) {
                    await connection.query('UPDATE indoor_rooms SET x=?, y=?, width=?, height=?, rotation=?, color=?, border_color=? WHERE id=?', 
                        [r.x, r.y, r.width, r.height, r.rotation, r.color, r.border_color, r.id]);
                }
            }
        }

        await connection.commit();
        res.json({ message: "Floor state saved successfully" });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: "Server error saving floor state" });
    } finally {
        connection.release();
    }
};
