import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'college_erp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initVisualEditorSchema() {
    try {
        console.log("Initializing Visual Editor Schema...");

        // 1. Layers
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_map_layers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                floor_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                visible BOOLEAN DEFAULT TRUE,
                locked BOOLEAN DEFAULT FALSE,
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (floor_id) REFERENCES campus_floors(id) ON DELETE CASCADE
            )
        `);
        console.log("campus_map_layers created");

        // 2. Groups
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_map_groups (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                building_id INT,
                floor_id INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("campus_map_groups created");

        // 3. Map Objects (Visual representation)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_map_objects (
                id VARCHAR(100) PRIMARY KEY,
                parent_id VARCHAR(100),
                group_id INT,
                object_type VARCHAR(50) NOT NULL,
                room_id INT, -- Link to business entity if applicable
                name VARCHAR(100),
                building_id INT NOT NULL,
                floor_id INT NOT NULL,
                layer_id INT,
                order_index INT DEFAULT 0,
                x FLOAT NOT NULL,
                y FLOAT NOT NULL,
                width FLOAT NOT NULL,
                height FLOAT NOT NULL,
                rotation FLOAT DEFAULT 0,
                style_json JSON,
                metadata_json JSON,
                visible BOOLEAN DEFAULT TRUE,
                locked BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (building_id) REFERENCES campus_buildings(id) ON DELETE CASCADE,
                FOREIGN KEY (floor_id) REFERENCES campus_floors(id) ON DELETE CASCADE,
                FOREIGN KEY (room_id) REFERENCES campus_rooms(id) ON DELETE SET NULL,
                FOREIGN KEY (layer_id) REFERENCES campus_map_layers(id) ON DELETE SET NULL,
                FOREIGN KEY (group_id) REFERENCES campus_map_groups(id) ON DELETE SET NULL
            )
        `);
        console.log("campus_map_objects created");

        // 4. Relationships
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_map_relationships (
                id INT AUTO_INCREMENT PRIMARY KEY,
                source_object_id VARCHAR(100) NOT NULL,
                target_object_id VARCHAR(100) NOT NULL,
                relationship_type VARCHAR(50) NOT NULL, -- e.g., 'beside', 'opposite', 'connected_to'
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (source_object_id) REFERENCES campus_map_objects(id) ON DELETE CASCADE,
                FOREIGN KEY (target_object_id) REFERENCES campus_map_objects(id) ON DELETE CASCADE
            )
        `);
        console.log("campus_map_relationships created");

        // 5. Map Versions (for publishing and rollback)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_map_versions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                floor_id INT NOT NULL,
                version_name VARCHAR(100) NOT NULL,
                snapshot_data JSON NOT NULL,
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (floor_id) REFERENCES campus_floors(id) ON DELETE CASCADE
            )
        `);
        console.log("campus_map_versions created");

        console.log("Visual Editor Schema initialization complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error initializing schema:", error);
        process.exit(1);
    }
}

initVisualEditorSchema();
