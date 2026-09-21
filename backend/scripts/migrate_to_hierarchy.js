import pool from '../db.js';

async function migrate() {
    const db = await pool.getConnection();

    console.log("Connected to database...");

    try {
        // Find all floors
        const [floors] = await db.query("SELECT id, building_id, floor_number FROM campus_floors");
        
        for (const floor of floors) {
            console.log(`Processing Floor ${floor.floor_number} (ID: ${floor.id}) in Building ${floor.building_id}`);
            
            // Check if already migrated
            const [existingObjects] = await db.query(
                "SELECT COUNT(*) as count FROM campus_map_objects WHERE building_id = ? AND floor_id = ?",
                [floor.building_id, floor.id]
            );
            
            if (existingObjects[0].count > 0) {
                console.log(`  -> Already migrated (${existingObjects[0].count} objects). Skipping.`);
                continue;
            }

            // Create a default Floor Container Group
            const floorGroupId = `floor-${floor.id}-root`;
            await db.query(
                `INSERT INTO campus_map_objects 
                (id, building_id, floor_id, object_type, name, x, y, width, height, rotation, style_json, order_index)
                VALUES (?, ?, ?, 'group', 'Floor Container', 0, 0, 4000, 4000, 0, ?, 0)`,
                [floorGroupId, floor.building_id, floor.id, JSON.stringify({ fill_color: 'transparent', border_color: 'transparent' })]
            );

            // Fetch rooms for this floor
            const [rooms] = await db.query(
                "SELECT id, room_number, room_name, capacity, department, x, y, width, height, rotation FROM campus_rooms WHERE floor_id = ?",
                [floor.id]
            );

            console.log(`  -> Found ${rooms.length} rooms to migrate.`);
            
            for (const room of rooms) {
                const objectId = `room-${room.id}`;
                
                const x = parseFloat(room.x) || 0;
                const y = parseFloat(room.y) || 0;
                const width = parseFloat(room.width) || 100;
                const height = parseFloat(room.height) || 100;
                const rotation = parseFloat(room.rotation) || 0;

                await db.query(
                    `INSERT INTO campus_map_objects 
                    (id, parent_id, room_id, building_id, floor_id, object_type, name, x, y, width, height, rotation, style_json, metadata_json, order_index)
                    VALUES (?, ?, ?, ?, ?, 'room', ?, ?, ?, ?, ?, ?, ?, ?, 10)`,
                    [
                        objectId, 
                        floorGroupId, 
                        room.id, 
                        floor.building_id, 
                        floor.id, 
                        room.room_name || room.room_number,
                        x, y, width, height, rotation,
                        JSON.stringify({ fill_color: '#ffffff', border_color: '#000000' }),
                        JSON.stringify({ room_number: room.room_number, department: room.department, capacity: room.capacity })
                    ]
                );
            }
            console.log(`  -> Migrated successfully.`);
        }
        
        console.log("Migration Complete!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        db.release();
    }
}

migrate();
