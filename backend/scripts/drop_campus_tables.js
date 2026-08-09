import pool from '../db.js';

async function dropTables() {
    try {
        console.log("Starting Campus Navigation Tables Deletion...");
        const connection = await pool.getConnection();

        const tables = [
            'campus_rooms',
            'campus_room_types',
            'campus_floors',
            'campus_navigation_points',
            'campus_buildings',
            'campus_map_drafts'
        ];

        // Disable foreign key checks to easily drop tables that have relations
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0;');

        for (const table of tables) {
            try {
                await connection.execute(`DROP TABLE IF EXISTS ${table}`);
                console.log(`Dropped table ${table}`);
            } catch (err) {
                console.error(`Error dropping table ${table}: ${err.message}`);
            }
        }

        await connection.execute('SET FOREIGN_KEY_CHECKS = 1;');
        
        connection.release();
        console.log("Deletion completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

dropTables();
