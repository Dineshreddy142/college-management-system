import pool from './backend/db.js';

async function initDigitalTwinDB() {
    try {
        console.log("Creating Digital Twin tables...");

        // Drop the old equipment table if it exists as we're moving to advanced Asset Management
        try {
            await pool.query('DROP TABLE IF EXISTS campus_equipment');
        } catch (e) {
            console.log("campus_equipment drop skipped:", e.message);
        }

        // 1. Room Bookings
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_room_bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                purpose TEXT,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') DEFAULT 'Pending',
                conflict_status BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES campus_rooms(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);
        console.log("campus_room_bookings created");

        // 2. Asset Management
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_asset_categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT
            );
        `);
        console.log("campus_asset_categories created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_assets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                asset_tag VARCHAR(50) NOT NULL UNIQUE,
                category_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                serial_number VARCHAR(100),
                model VARCHAR(100),
                brand VARCHAR(100),
                vendor VARCHAR(100),
                purchase_date DATE,
                warranty_expiry DATE,
                asset_value DECIMAL(10,2),
                current_condition ENUM('Excellent', 'Good', 'Fair', 'Poor', 'Broken') DEFAULT 'Good',
                status ENUM('Available', 'In Use', 'Under Maintenance', 'Retired', 'Lost') DEFAULT 'Available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES campus_asset_categories(id) ON DELETE RESTRICT
            );
        `);
        console.log("campus_assets created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_asset_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                asset_id INT NOT NULL,
                room_id INT,
                assigned_to_user_id INT,
                department VARCHAR(100),
                assigned_date DATE NOT NULL,
                return_date DATE,
                status ENUM('Active', 'Returned') DEFAULT 'Active',
                notes TEXT,
                FOREIGN KEY (asset_id) REFERENCES campus_assets(id) ON DELETE CASCADE,
                FOREIGN KEY (room_id) REFERENCES campus_rooms(id) ON DELETE SET NULL,
                FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        `);
        console.log("campus_asset_assignments created");

        // 3. Inspections
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_inspections (
                id INT AUTO_INCREMENT PRIMARY KEY,
                target_type ENUM('Building', 'Floor', 'Room', 'Asset') NOT NULL,
                target_id INT NOT NULL,
                inspection_type ENUM('Safety', 'Electrical', 'Fire', 'Lab', 'Infrastructure', 'General') NOT NULL,
                inspector_id INT NOT NULL,
                scheduled_date DATE,
                completed_date DATE,
                result ENUM('Pass', 'Fail', 'Conditional Pass', 'Pending') DEFAULT 'Pending',
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE RESTRICT
            );
        `);
        console.log("campus_inspections created");

        // 4. Utilities
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_utilities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                building_id INT NOT NULL,
                utility_type ENUM('Electricity', 'Water', 'Internet', 'Air Conditioning', 'Generator', 'UPS', 'Solar Power') NOT NULL,
                reading_date DATE NOT NULL,
                consumption DECIMAL(10,2) NOT NULL,
                unit VARCHAR(20) NOT NULL,
                cost DECIMAL(10,2),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (building_id) REFERENCES campus_buildings(id) ON DELETE CASCADE
            );
        `);
        console.log("campus_utilities created");

        // 5. Incidents
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_incidents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                target_type ENUM('Building', 'Floor', 'Room', 'Asset', 'Other') NOT NULL,
                target_id INT,
                incident_type ENUM('Electrical', 'Water Leakage', 'Broken Equipment', 'Network Issue', 'Furniture Damage', 'Safety Issue', 'Other') NOT NULL,
                reported_by INT NOT NULL,
                assigned_technician INT,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
                status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open',
                resolution_notes TEXT,
                resolved_at DATETIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE RESTRICT,
                FOREIGN KEY (assigned_technician) REFERENCES users(id) ON DELETE SET NULL
            );
        `);
        console.log("campus_incidents created");

        // 6. Visitors
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_visitors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(100),
                company VARCHAR(100),
                host_user_id INT NOT NULL,
                purpose TEXT NOT NULL,
                check_in_time DATETIME NOT NULL,
                check_out_time DATETIME,
                pass_status ENUM('Active', 'Expired', 'Revoked') DEFAULT 'Active',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE RESTRICT
            );
        `);
        console.log("campus_visitors created");

        // Seed Basic Asset Categories
        console.log("Seeding basic data...");
        await pool.query(`INSERT IGNORE INTO campus_asset_categories (name, description) VALUES 
            ('IT Equipment', 'Computers, laptops, servers, network devices'),
            ('AV Equipment', 'Projectors, smart boards, microphones'),
            ('Furniture', 'Desks, chairs, cabinets'),
            ('Electrical', 'Generators, UPS, AC units'),
            ('Security', 'CCTV, biometric scanners');
        `);

        console.log("Digital Twin Schema Update Successful!");
        process.exit(0);
    } catch (e) {
        console.error("Error updating schema:", e);
        process.exit(1);
    }
}
initDigitalTwinDB();
