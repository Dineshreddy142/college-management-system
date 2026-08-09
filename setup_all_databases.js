import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS || 'WJ28@krhps';
const dbName = process.env.DB_NAME || 'college_management_system';

async function setupAllDatabases() {
  console.log('====================================================');
  console.log(' Starting Full Project Database Recreation / Setup');
  console.log('====================================================');
  console.log(`Connecting to MySQL host: ${dbHost} as user: ${dbUser}...`);

  // Step 1: Connect without selecting DB and create database
  const rootConn = await mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPass,
    multipleStatements: true
  });

  console.log(`[1/16] Ensuring database '${dbName}' exists...`);
  await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await rootConn.end();

  // Connect to target database
  const conn = await mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPass,
    database: dbName,
    multipleStatements: true
  });

  try {
    // Step 2: Execute schema.sql
    console.log('[2/16] Running schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await conn.query(schemaSql);
    console.log('       schema.sql executed successfully.');

    // Step 3: Execute seed.sql
    console.log('[3/16] Running seed.sql...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await conn.query(seedSql);
    console.log('       seed.sql executed successfully.');

    // Step 4: Execute face_migrations.sql
    console.log('[4/16] Running face_migrations.sql...');
    const faceSql = fs.readFileSync(path.join(__dirname, 'face_migrations.sql'), 'utf8');
    await conn.query(faceSql);
    console.log('       face_migrations.sql executed successfully.');

    // Step 5: Notifications table from init_db.js
    console.log('[5/16] Ensuring notifications table...');
    await conn.query(`CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Step 6: AI Schema
    console.log('[6/16] Creating AI Database tables...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id VARCHAR(50) PRIMARY KEY,
        user_id INT NOT NULL,
        user_role VARCHAR(20) NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id VARCHAR(50) NOT NULL,
        role VARCHAR(10) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
      );
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ai_user_preferences (
        user_id INT PRIMARY KEY,
        preferred_language VARCHAR(10) DEFAULT 'en',
        voice_enabled BOOLEAN DEFAULT FALSE,
        voice_speed FLOAT DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Step 7: Campus Schema & Data
    console.log('[7/16] Creating Campus tables and seeding data...');
    await conn.query(`
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
    await conn.query(`
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
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_room_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        color VARCHAR(20) NOT NULL,
        icon VARCHAR(50) NOT NULL
      );
    `);
    await conn.query(`
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
        status ENUM('Active', 'Maintenance', 'Inactive', 'Available', 'Occupied', 'Under Maintenance', 'Closed', 'Reserved', 'Cleaning', 'Renovation') DEFAULT 'Available',
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

    // Step 8: Digital Twin Schema
    console.log('[8/16] Creating Digital Twin tables...');
    await conn.query(`
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
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_asset_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT
      );
    `);
    await conn.query(`
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
    await conn.query(`
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
    await conn.query(`
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
    await conn.query(`
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
    await conn.query(`
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
    await conn.query(`
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
    await conn.query(`INSERT IGNORE INTO campus_asset_categories (name, description) VALUES 
      ('IT Equipment', 'Computers, laptops, servers, network devices'),
      ('AV Equipment', 'Projectors, smart boards, microphones'),
      ('Furniture', 'Desks, chairs, cabinets'),
      ('Electrical', 'Generators, UPS, AC units'),
      ('Security', 'CCTV, biometric scanners');
    `);

    // Step 9: Editor Schema
    console.log('[9/16] Creating Map Editor tables...');
    await conn.query(`
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
    await conn.query(`
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

    // Step 10: Indoor Schema
    console.log('[10/16] Creating Indoor Map tables...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS indoor_blocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    await conn.query(`
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
    await conn.query(`
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
    await conn.query(`
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
    await conn.query(`
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
    await conn.query(`
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
    await conn.query(`
      CREATE TABLE IF NOT EXISTS indoor_furniture (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        svg_data LONGTEXT
      );
    `);
    await conn.query(`
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
    await conn.query(`
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
    await conn.query(`
      CREATE TABLE IF NOT EXISTS indoor_nav_edges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_node VARCHAR(50) NOT NULL,
        to_node VARCHAR(50) NOT NULL,
        distance FLOAT NOT NULL,
        walking_time FLOAT NOT NULL,
        is_bidirectional BOOLEAN DEFAULT TRUE,
        is_accessible BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (from_node) REFERENCES indoor_nav_nodes(id) ON DELETE CASCADE,
        FOREIGN KEY (to_node) REFERENCES indoor_nav_edges(id) ON DELETE CASCADE
      );
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS indoor_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        floor_id INT NOT NULL,
        version_number INT NOT NULL,
        version_data LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (floor_id) REFERENCES indoor_floors(id) ON DELETE CASCADE
      );
    `);
    await conn.query(`
      INSERT IGNORE INTO indoor_blocks (id, name, description) VALUES (1, 'Block A', 'Main academic block');
    `);
    await conn.query(`
      INSERT IGNORE INTO indoor_floors (id, block_id, name, level) VALUES (1, 1, 'Ground Floor', 0);
    `);
    await conn.query(`
      INSERT IGNORE INTO indoor_furniture (id, name, type, svg_data) 
      VALUES (1, 'Desk', 'desk', '<rect width="40" height="20" fill="#8B4513" rx="2" />');
    `);
    await conn.query(`
      INSERT IGNORE INTO indoor_furniture (id, name, type, svg_data) 
      VALUES (2, 'Chair', 'chair', '<circle cx="10" cy="10" r="10" fill="#444444" />');
    `);

    // Step 11: Navigation Schema & Seed
    console.log('[11/16] Creating Navigation tables and seeding nodes/edges...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_nav_nodes (
        id VARCHAR(50) PRIMARY KEY,
        building_id INT NOT NULL,
        floor_id INT NOT NULL,
        node_name VARCHAR(100),
        node_type VARCHAR(50) DEFAULT 'waypoint',
        related_room_number VARCHAR(50),
        x FLOAT NOT NULL,
        y FLOAT NOT NULL,
        status VARCHAR(20) DEFAULT 'Active',
        FOREIGN KEY (building_id) REFERENCES campus_buildings(id) ON DELETE CASCADE,
        FOREIGN KEY (floor_id) REFERENCES campus_floors(id) ON DELETE CASCADE
      );
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_nav_edges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_node VARCHAR(50) NOT NULL,
        to_node VARCHAR(50) NOT NULL,
        distance FLOAT NOT NULL,
        walking_time FLOAT NOT NULL,
        is_bidirectional BOOLEAN DEFAULT TRUE,
        is_accessible BOOLEAN DEFAULT TRUE,
        status VARCHAR(20) DEFAULT 'Active',
        FOREIGN KEY (from_node) REFERENCES campus_nav_nodes(id) ON DELETE CASCADE,
        FOREIGN KEY (to_node) REFERENCES campus_nav_nodes(id) ON DELETE CASCADE
      );
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_nav_routes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_name VARCHAR(100),
        start_node VARCHAR(50) NOT NULL,
        end_node VARCHAR(50) NOT NULL,
        distance FLOAT NOT NULL,
        estimated_time FLOAT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const nodes = [
      { id: 'n_ent', name: 'Main Entrance', type: 'entrance', room: null, x: 60, y: 70 },
      { id: 'n_c1', name: 'Corridor A', type: 'corridor', room: null, x: 175, y: 70 },
      { id: 'n_c2', name: 'Corridor C', type: 'corridor', room: null, x: 255, y: 70 },
      { id: 'n_c3', name: 'Corridor B', type: 'corridor', room: null, x: 335, y: 70 },
      { id: 'n_g01', name: 'First Year CS', type: 'room', room: 'CSE-G01', x: 175, y: 150 },
      { id: 'n_g02', name: 'Second Year CS', type: 'room', room: 'CSE-G02', x: 335, y: 150 },
      { id: 'n_c_vert', name: 'Vertical Corridor', type: 'corridor', room: null, x: 255, y: 205 },
      { id: 'n_lab1', name: 'Programming Lab', type: 'room', room: 'LAB-1', x: 255, y: 285 },
      { id: 'n_st1', name: 'Stairs', type: 'stairs', room: 'ST-1', x: 740, y: 320 },
      { id: 'n_c4', name: 'Corridor East', type: 'corridor', room: null, x: 740, y: 70 }
    ];

    for (const n of nodes) {
      await conn.query(
        `INSERT IGNORE INTO campus_nav_nodes (id, building_id, floor_id, node_name, node_type, related_room_number, x, y) 
         VALUES (?, 1, 1, ?, ?, ?, ?, ?)`,
        [n.id, n.name, n.type, n.room, n.x, n.y]
      );
    }

    const calcDist = (n1, n2) => Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
    const calcTime = (dist) => dist / 50;

    const edgePairs = [
      ['n_ent', 'n_c1'],
      ['n_c1', 'n_c2'],
      ['n_c2', 'n_c3'],
      ['n_c1', 'n_g01'],
      ['n_c3', 'n_g02'],
      ['n_c2', 'n_c_vert'],
      ['n_c_vert', 'n_lab1'],
      ['n_c3', 'n_c4'],
      ['n_c4', 'n_st1']
    ];

    for (const pair of edgePairs) {
      const n1 = nodes.find(n => n.id === pair[0]);
      const n2 = nodes.find(n => n.id === pair[1]);
      const dist = calcDist(n1, n2);
      const time = calcTime(dist);
      await conn.query(
        `INSERT IGNORE INTO campus_nav_edges (from_node, to_node, distance, walking_time, is_bidirectional, is_accessible) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [n1.id, n2.id, dist, time, true, true]
      );
    }

    // Step 12: Smart Campus Tables & Facilities
    console.log('[12/16] Creating Smart Campus tables...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_facilities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_room_facilities (
        room_id INT NOT NULL,
        facility_id INT NOT NULL,
        PRIMARY KEY (room_id, facility_id),
        FOREIGN KEY (room_id) REFERENCES campus_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (facility_id) REFERENCES campus_facilities(id) ON DELETE CASCADE
      );
    `);
    await conn.query(`
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
    await conn.query(`
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
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_type ENUM('Building', 'Floor', 'Room') NOT NULL,
        target_id INT NOT NULL,
        image_url TEXT NOT NULL,
        caption VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await conn.query(`
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
    await conn.query(`INSERT IGNORE INTO campus_facilities (name, icon, description) VALUES 
      ('Wi-Fi', 'Wifi', 'High-speed wireless internet access'),
      ('Projector', 'Projector', 'Ceiling-mounted digital projector'),
      ('Smart Board', 'Monitor', 'Interactive smart whiteboard'),
      ('Air Conditioner', 'Wind', 'AC for temperature control'),
      ('Printer', 'Printer', 'Network-connected printer'),
      ('UPS', 'Battery', 'Uninterruptible power supply'),
      ('CCTV', 'Video', 'Security camera surveillance');
    `);

    // Step 13: Visual Editor Schema
    console.log('[13/16] Creating Visual Editor Schema...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_map_layers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        floor_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        visible BOOLEAN DEFAULT TRUE,
        locked BOOLEAN DEFAULT FALSE,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (floor_id) REFERENCES campus_floors(id) ON DELETE CASCADE
      );
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_map_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        building_id INT,
        floor_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_map_objects (
        id VARCHAR(100) PRIMARY KEY,
        parent_id VARCHAR(100),
        group_id INT,
        object_type VARCHAR(50) NOT NULL,
        room_id INT,
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
      );
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_map_relationships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_object_id VARCHAR(100) NOT NULL,
        target_object_id VARCHAR(100) NOT NULL,
        relationship_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_object_id) REFERENCES campus_map_objects(id) ON DELETE CASCADE,
        FOREIGN KEY (target_object_id) REFERENCES campus_map_objects(id) ON DELETE CASCADE
      );
    `);

    // Step 14: Campus Map Migration (Columns & Navigation Points)
    console.log('[14/16] Migrating Campus Map columns & navigation points...');
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
        await conn.query(`ALTER TABLE campus_buildings ADD COLUMN ${col}`);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.log(`Note on building col '${col}':`, err.message);
        }
      }
    }
    await conn.query(`
      CREATE TABLE IF NOT EXISTS campus_navigation_points (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        target_id INT,
        x FLOAT NOT NULL,
        y FLOAT NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Step 15: System Settings & User Table Alterations
    console.log('[15/16] Configuring System Settings & User table alterations...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value VARCHAR(255)
      )
    `);
    await conn.query(`
      INSERT IGNORE INTO system_settings (setting_key, setting_value) 
      VALUES ('MANDATORY_FACE_ENROLLMENT', 'true')
    `);

    try {
      await conn.query(`ALTER TABLE users ADD COLUMN face_registered BOOLEAN DEFAULT FALSE`);
    } catch (e) {}
    try {
      await conn.query(`ALTER TABLE users ADD COLUMN face_attendance_enabled BOOLEAN DEFAULT TRUE`);
    } catch (e) {}

    // Step 16: Hierarchy Migration (map objects)
    console.log('[16/16] Migrating campus room objects to hierarchy...');
    const [floors] = await conn.query("SELECT id, building_id, floor_number FROM campus_floors");
    for (const floor of floors) {
      const [existingObjects] = await conn.query(
        "SELECT COUNT(*) as count FROM campus_map_objects WHERE building_id = ? AND floor_id = ?",
        [floor.building_id, floor.id]
      );
      if (existingObjects[0].count === 0) {
        const floorGroupId = `floor-${floor.id}-root`;
        await conn.query(
          `INSERT IGNORE INTO campus_map_objects 
          (id, building_id, floor_id, object_type, name, x, y, width, height, rotation, style_json, order_index)
          VALUES (?, ?, ?, 'group', 'Floor Container', 0, 0, 4000, 4000, 0, ?, 0)`,
          [floorGroupId, floor.building_id, floor.id, JSON.stringify({ fill_color: 'transparent', border_color: 'transparent' })]
        );

        const [rooms] = await conn.query(
          "SELECT id, room_number, room_name, capacity, department, x, y, width, height, rotation FROM campus_rooms WHERE floor_id = ?",
          [floor.id]
        );
        for (const room of rooms) {
          const objectId = `room-${room.id}`;
          await conn.query(
            `INSERT IGNORE INTO campus_map_objects 
            (id, parent_id, room_id, building_id, floor_id, object_type, name, x, y, width, height, rotation, style_json, metadata_json, order_index)
            VALUES (?, ?, ?, ?, ?, 'room', ?, ?, ?, ?, ?, ?, ?, ?, 10)`,
            [
              objectId, 
              floorGroupId, 
              room.id, 
              floor.building_id, 
              floor.id, 
              room.room_name || room.room_number,
              parseFloat(room.x) || 0,
              parseFloat(room.y) || 0,
              parseFloat(room.width) || 100,
              parseFloat(room.height) || 100,
              parseFloat(room.rotation) || 0,
              JSON.stringify({ fill_color: '#ffffff', border_color: '#000000' }),
              JSON.stringify({ room_number: room.room_number, department: room.department, capacity: room.capacity })
            ]
          );
        }
      }
    }

    console.log('====================================================');
    console.log(' Database Recreation Completed Successfully!');
    console.log(' All databases, tables, and seed data are ready.');
    console.log('====================================================');
  } catch (error) {
    console.error('Database setup failed with error:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

setupAllDatabases();
