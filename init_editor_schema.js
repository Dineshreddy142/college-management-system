import pool from './backend/db.js';

async function initEditorDB() {
    try {
        console.log("Creating Editor tables...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_map_drafts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                building_id INT NOT NULL,
                floor_id INT NOT NULL,
                draft_data LONGTEXT,
                created_by INT,
                updated_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY map_key (building_id, floor_id),
                FOREIGN KEY (building_id) REFERENCES campus_buildings(id) ON DELETE CASCADE,
                FOREIGN KEY (floor_id) REFERENCES campus_floors(id) ON DELETE CASCADE
            );
        `);
        console.log("campus_map_drafts created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_map_versions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                building_id INT NOT NULL,
                floor_id INT NOT NULL,
                version_number INT NOT NULL,
                version_data LONGTEXT,
                published_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (building_id) REFERENCES campus_buildings(id) ON DELETE CASCADE,
                FOREIGN KEY (floor_id) REFERENCES campus_floors(id) ON DELETE CASCADE
            );
        `);
        console.log("campus_map_versions created");

        console.log("Editor DB Initialized Successfully");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
initEditorDB();
