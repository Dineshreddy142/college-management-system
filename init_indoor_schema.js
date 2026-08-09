import pool from './backend/db.js';

async function initIndoorDB() {
    try {
        console.log("Creating Indoor Map tables...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS indoor_blocks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);
        console.log("indoor_blocks created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS indoor_floors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                block_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                level INT NOT NULL,
                background_image LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (block_id) REFERENCES indoor_blocks(id) ON DELETE CASCADE
            );
        `);
        console.log("indoor_floors created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS indoor_rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                floor_id INT NOT NULL,
                room_number VARCHAR(50) NOT NULL,
                room_name VARCHAR(100) NOT NULL,
                department VARCHAR(100),
                room_type VARCHAR(100),
                capacity INT DEFAULT 0,
                faculty VARCHAR(100),
                description TEXT,
                status VARCHAR(50) DEFAULT 'Active',
                accessibility BOOLEAN DEFAULT true,
                x FLOAT NOT NULL,
                y FLOAT NOT NULL,
                width FLOAT NOT NULL,
                height FLOAT NOT NULL,
                rotation FLOAT DEFAULT 0,
                color VARCHAR(20) DEFAULT '#ffffff',
                border_color VARCHAR(20) DEFAULT '#000000',
                opacity FLOAT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (floor_id) REFERENCES indoor_floors(id) ON DELETE CASCADE
            );
        `);
        console.log("indoor_rooms created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS indoor_walls (
                id INT AUTO_INCREMENT PRIMARY KEY,
                floor_id INT NOT NULL,
                x1 FLOAT NOT NULL,
                y1 FLOAT NOT NULL,
                x2 FLOAT NOT NULL,
                y2 FLOAT NOT NULL,
                thickness FLOAT DEFAULT 5,
                color VARCHAR(20) DEFAULT '#333333',
                FOREIGN KEY (floor_id) REFERENCES indoor_floors(id) ON DELETE CASCADE
            );
        `);
        console.log("indoor_walls created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS indoor_doors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                floor_id INT NOT NULL,
                x FLOAT NOT NULL,
                y FLOAT NOT NULL,
                width FLOAT NOT NULL,
                rotation FLOAT DEFAULT 0,
                is_open BOOLEAN DEFAULT false,
                FOREIGN KEY (floor_id) REFERENCES indoor_floors(id) ON DELETE CASCADE
            );
        `);
        console.log("indoor_doors created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS indoor_windows (
                id INT AUTO_INCREMENT PRIMARY KEY,
                floor_id INT NOT NULL,
                x FLOAT NOT NULL,
                y FLOAT NOT NULL,
                width FLOAT NOT NULL,
                rotation FLOAT DEFAULT 0,
                FOREIGN KEY (floor_id) REFERENCES indoor_floors(id) ON DELETE CASCADE
            );
        `);
        console.log("indoor_windows created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS indoor_furniture (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                svg_data LONGTEXT
            );
        `);
        console.log("indoor_furniture created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS indoor_objects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                floor_id INT NOT NULL,
                furniture_id INT,
                room_id INT,
                x FLOAT NOT NULL,
                y FLOAT NOT NULL,
                width FLOAT NOT NULL,
                height FLOAT NOT NULL,
                rotation FLOAT DEFAULT 0,
                opacity FLOAT DEFAULT 1,
                FOREIGN KEY (floor_id) REFERENCES indoor_floors(id) ON DELETE CASCADE,
                FOREIGN KEY (furniture_id) REFERENCES indoor_furniture(id) ON DELETE SET NULL,
                FOREIGN KEY (room_id) REFERENCES indoor_rooms(id) ON DELETE CASCADE
            );
        `);
        console.log("indoor_objects created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS indoor_nav_nodes (
                id VARCHAR(50) PRIMARY KEY,
                floor_id INT NOT NULL,
                node_name VARCHAR(100),
                node_type VARCHAR(50) DEFAULT 'waypoint',
                related_room_id INT,
                x FLOAT NOT NULL,
                y FLOAT NOT NULL,
                status VARCHAR(20) DEFAULT 'Active',
                FOREIGN KEY (floor_id) REFERENCES indoor_floors(id) ON DELETE CASCADE,
                FOREIGN KEY (related_room_id) REFERENCES indoor_rooms(id) ON DELETE SET NULL
            );
        `);
        console.log("indoor_nav_nodes created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS indoor_nav_edges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                from_node VARCHAR(50) NOT NULL,
                to_node VARCHAR(50) NOT NULL,
                distance FLOAT NOT NULL,
                walking_time FLOAT NOT NULL,
                is_bidirectional BOOLEAN DEFAULT TRUE,
                is_accessible BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (from_node) REFERENCES indoor_nav_nodes(id) ON DELETE CASCADE,
                FOREIGN KEY (to_node) REFERENCES indoor_nav_nodes(id) ON DELETE CASCADE
            );
        `);
        console.log("indoor_nav_edges created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS indoor_versions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                floor_id INT NOT NULL,
                version_number INT NOT NULL,
                version_data LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (floor_id) REFERENCES indoor_floors(id) ON DELETE CASCADE
            );
        `);
        console.log("indoor_versions created");

        // Seed initial block and floor
        await pool.query(`
            INSERT IGNORE INTO indoor_blocks (id, name, description) 
            VALUES (1, 'Block A', 'Main academic block');
        `);
        await pool.query(`
            INSERT IGNORE INTO indoor_floors (id, block_id, name, level) 
            VALUES (1, 1, 'Ground Floor', 0);
        `);

        // Seed some basic furniture
        await pool.query(`
            INSERT IGNORE INTO indoor_furniture (id, name, type, svg_data) 
            VALUES (1, 'Desk', 'desk', '<rect width="40" height="20" fill="#8B4513" rx="2" />');
        `);
        await pool.query(`
            INSERT IGNORE INTO indoor_furniture (id, name, type, svg_data) 
            VALUES (2, 'Chair', 'chair', '<circle cx="10" cy="10" r="10" fill="#444444" />');
        `);

        console.log("Indoor Map DB Initialized Successfully");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
initIndoorDB();
