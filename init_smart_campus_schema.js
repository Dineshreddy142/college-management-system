import pool from './backend/db.js';

async function initSmartCampusDB() {
    try {
        console.log("Updating existing tables...");
        
        // Update campus_buildings
        try {
            await pool.query(`ALTER TABLE campus_buildings ADD COLUMN opening_hours VARCHAR(255)`);
            await pool.query(`ALTER TABLE campus_buildings ADD COLUMN contact_information VARCHAR(255)`);
        } catch (e) {
            console.log("Columns opening_hours/contact_information already exist or error:", e.message);
        }

        // Update campus_rooms
        try {
            await pool.query(`ALTER TABLE campus_rooms MODIFY COLUMN status ENUM('Active', 'Maintenance', 'Inactive', 'Available', 'Occupied', 'Under Maintenance', 'Closed', 'Reserved', 'Cleaning', 'Renovation') DEFAULT 'Available'`);
            await pool.query(`ALTER TABLE campus_rooms ADD COLUMN accessibility_features TEXT`);
        } catch (e) {
            console.log("campus_rooms status/accessibility error:", e.message);
        }

        console.log("Creating new tables...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_facilities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                icon VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("campus_facilities created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_room_facilities (
                room_id INT NOT NULL,
                facility_id INT NOT NULL,
                PRIMARY KEY (room_id, facility_id),
                FOREIGN KEY (room_id) REFERENCES campus_rooms(id) ON DELETE CASCADE,
                FOREIGN KEY (facility_id) REFERENCES campus_facilities(id) ON DELETE CASCADE
            );
        `);
        console.log("campus_room_facilities created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_equipment (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                serial_number VARCHAR(100),
                model VARCHAR(100),
                purchase_date DATE,
                warranty_expires DATE,
                equipment_condition VARCHAR(50),
                status ENUM('Active', 'Under Maintenance', 'Broken', 'Retired') DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES campus_rooms(id) ON DELETE CASCADE
            );
        `);
        console.log("campus_equipment created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_maintenance_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                target_type ENUM('Building', 'Floor', 'Room', 'Equipment') NOT NULL,
                target_id INT NOT NULL,
                priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
                status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
                description TEXT NOT NULL,
                remarks TEXT,
                completion_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);
        console.log("campus_maintenance_requests created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                target_type ENUM('Building', 'Floor', 'Room') NOT NULL,
                target_id INT NOT NULL,
                image_url TEXT NOT NULL,
                caption VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("campus_images created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                target_type ENUM('Building', 'Floor', 'Room') NOT NULL,
                target_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                document_url TEXT NOT NULL,
                document_type VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("campus_documents created");

        console.log("Seeding basic facilities...");
        await pool.query(`INSERT IGNORE INTO campus_facilities (name, icon, description) VALUES 
            ('Wi-Fi', 'Wifi', 'High-speed wireless internet access'),
            ('Projector', 'Projector', 'Ceiling-mounted digital projector'),
            ('Smart Board', 'Monitor', 'Interactive smart whiteboard'),
            ('Air Conditioner', 'Wind', 'AC for temperature control'),
            ('Printer', 'Printer', 'Network-connected printer'),
            ('UPS', 'Battery', 'Uninterruptible power supply'),
            ('CCTV', 'Video', 'Security camera surveillance');
        `);

        console.log("Smart Campus Schema Update Successful!");
        process.exit(0);
    } catch (e) {
        console.error("Error updating schema:", e);
        process.exit(1);
    }
}
initSmartCampusDB();
