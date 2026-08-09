import pool from '../db.js';

async function migrate() {
    try {
        console.log("Starting Campus Map Migration...");
        const connection = await pool.getConnection();

        // 1. Add columns to campus_buildings
        const columnsToAdd = [
            "image VARCHAR(255)",
            "latitude DECIMAL(10, 8)",
            "longitude DECIMAL(11, 8)",
            "map_x FLOAT",
            "map_y FLOAT",
            "map_width FLOAT",
            "map_height FLOAT",
            "total_floors INT DEFAULT 1"
        ];

        for (const col of columnsToAdd) {
            try {
                const colName = col.split(' ')[0];
                await connection.execute(`ALTER TABLE campus_buildings ADD COLUMN ${col}`);
                console.log(`Added column ${colName}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column ${col.split(' ')[0]} already exists.`);
                } else {
                    throw err;
                }
            }
        }

        // 2. Create campus_navigation_points table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS campus_navigation_points (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                target_id INT,
                x FLOAT NOT NULL,
                y FLOAT NOT NULL,
                name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Created campus_navigation_points table.");

        connection.release();
        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
