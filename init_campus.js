import pool from './backend/db.js';
import fs from 'fs';

async function initCampusDB() {
    try {
        console.log("Creating tables...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_buildings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(20) NOT NULL UNIQUE,
                description TEXT,
                status ENUM('Active', 'Maintenance', 'Inactive') DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);
        console.log("campus_buildings created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_floors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                building_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                floor_number INT NOT NULL,
                description TEXT,
                status ENUM('Active', 'Maintenance', 'Inactive') DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (building_id) REFERENCES campus_buildings(id) ON DELETE CASCADE
            );
        `);
        console.log("campus_floors created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_room_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                color VARCHAR(20) NOT NULL,
                icon VARCHAR(50) NOT NULL
            );
        `);
        console.log("campus_room_types created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                building_id INT NOT NULL,
                floor_id INT NOT NULL,
                room_type_id INT NOT NULL,
                room_number VARCHAR(20) NOT NULL,
                room_name VARCHAR(100),
                department VARCHAR(100),
                capacity INT DEFAULT 0,
                description TEXT,
                status ENUM('Active', 'Maintenance', 'Inactive') DEFAULT 'Active',
                x FLOAT NOT NULL DEFAULT 0,
                y FLOAT NOT NULL DEFAULT 0,
                width FLOAT NOT NULL DEFAULT 0,
                height FLOAT NOT NULL DEFAULT 0,
                rotation FLOAT NOT NULL DEFAULT 0,
                fill_color VARCHAR(20),
                border_color VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (building_id) REFERENCES campus_buildings(id) ON DELETE CASCADE,
                FOREIGN KEY (floor_id) REFERENCES campus_floors(id) ON DELETE CASCADE,
                FOREIGN KEY (room_type_id) REFERENCES campus_room_types(id) ON DELETE RESTRICT
            );
        `);
        console.log("campus_rooms created");

        console.log("Seeding data...");
        // Seed buildings
        await pool.query(`INSERT IGNORE INTO campus_buildings (id, name, code, description) VALUES 
            (1, 'Computer Science & Engineering Block', 'CSE', 'Main building for CS department');`);
            
        // Seed floors
        await pool.query(`INSERT IGNORE INTO campus_floors (id, building_id, name, floor_number) VALUES 
            (1, 1, 'Ground Floor', 0);`);
            
        // Seed room types
        await pool.query(`INSERT IGNORE INTO campus_room_types (id, name, color, icon) VALUES 
            (1, 'Classroom', '#e0f2fe', 'BookOpen'),
            (2, 'Laboratory', '#fce7f3', 'FlaskConical'),
            (3, 'Faculty Cabin', '#fef3c7', 'User'),
            (4, 'Seminar Hall', '#dcfce7', 'Users'),
            (5, 'Washroom', '#f3f4f6', 'Droplets'),
            (6, 'Staircase', '#e5e7eb', 'StepForward'),
            (7, 'Corridor', '#f8fafc', 'Navigation');`);

        // Seed rooms
        await pool.query(`INSERT IGNORE INTO campus_rooms (building_id, floor_id, room_type_id, room_number, room_name, department, x, y, width, height) VALUES 
            (1, 1, 1, 'CSE-G01', 'First Year CS', 'CSE', 100, 100, 150, 100),
            (1, 1, 1, 'CSE-G02', 'Second Year CS', 'CSE', 260, 100, 150, 100),
            (1, 1, 2, 'LAB-1', 'Programming Lab', 'CSE', 100, 210, 310, 150),
            (1, 1, 3, 'CAB-101', 'HOD Office', 'CSE', 420, 100, 100, 80),
            (1, 1, 3, 'CAB-102', 'Faculty Room', 'CSE', 530, 100, 150, 80),
            (1, 1, 4, 'SEM-1', 'Main Seminar Hall', 'CSE', 420, 190, 260, 170),
            (1, 1, 7, 'COR-1', 'Main Corridor', 'CSE', 50, 50, 680, 40),
            (1, 1, 5, 'W-M1', 'Mens Washroom', 'CSE', 700, 100, 80, 80),
            (1, 1, 5, 'W-F1', 'Womens Washroom', 'CSE', 700, 190, 80, 80),
            (1, 1, 6, 'ST-1', 'Main Stairs', 'CSE', 700, 280, 80, 80);`);

        console.log("Campus Data Seeded Successfully");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
initCampusDB();
