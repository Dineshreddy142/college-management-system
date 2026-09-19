import pool from './db.js';

export async function initBlockTables() {
  try {
    console.log('[BlockSystem] Verifying and initializing database tables...');
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Buildings Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS buildings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        description TEXT NULL,
        building_type VARCHAR(100) DEFAULT 'Academic',
        department VARCHAR(100) DEFAULT 'General',
        status ENUM('Active', 'Inactive', 'Under Construction', 'Maintenance') DEFAULT 'Active',
        total_floors INT DEFAULT 1,
        geometry_type VARCHAR(50) DEFAULT 'RECTANGLE',
        x FLOAT DEFAULT 40,
        y FLOAT DEFAULT 40,
        width FLOAT DEFAULT 300,
        height FLOAT DEFAULT 200,
        rotation FLOAT DEFAULT 0,
        boundary_points JSON NULL,
        metadata JSON NULL,
        created_by VARCHAR(100) DEFAULT 'Admin',
        updated_by VARCHAR(100) DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Floors Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS floors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        building_id INT NOT NULL,
        floor_number INT NOT NULL DEFAULT 0,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) NULL,
        description TEXT NULL,
        status ENUM('Active', 'Inactive', 'Draft', 'Maintenance') DEFAULT 'Active',
        width FLOAT DEFAULT 1200,
        height FLOAT DEFAULT 800,
        boundary_points JSON NULL,
        current_version_id INT NULL,
        published_version_id INT NULL,
        publish_status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
        created_by VARCHAR(100) DEFAULT 'Admin',
        updated_by VARCHAR(100) DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Floor Layers Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS floor_layers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        floor_id INT NOT NULL,
        layer_key VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        z_index INT DEFAULT 0,
        visible BOOLEAN DEFAULT TRUE,
        locked BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Floor Objects Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS floor_objects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        floor_id INT NOT NULL,
        layer_id INT NULL,
        object_type VARCHAR(50) NOT NULL,
        geometry_type VARCHAR(50) NOT NULL DEFAULT 'RECTANGLE',
        x FLOAT NOT NULL DEFAULT 40,
        y FLOAT NOT NULL DEFAULT 40,
        width FLOAT NOT NULL DEFAULT 150,
        height FLOAT NOT NULL DEFAULT 100,
        rotation FLOAT NOT NULL DEFAULT 0,
        points JSON NULL,
        label VARCHAR(150) NULL,
        z_index INT DEFAULT 0,
        locked BOOLEAN DEFAULT FALSE,
        visible BOOLEAN DEFAULT TRUE,
        fill_color VARCHAR(30) DEFAULT '#3B82F6',
        stroke_color VARCHAR(30) DEFAULT '#1E40AF',
        stroke_width FLOAT DEFAULT 2,
        properties JSON NULL,
        version_status ENUM('DRAFT', 'PUBLISHED') DEFAULT 'DRAFT',
        created_by VARCHAR(100) DEFAULT 'Admin',
        updated_by VARCHAR(100) DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE,
        FOREIGN KEY (layer_id) REFERENCES floor_layers(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Floor Connections Table (Stairs, Elevators, Escalators)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS floor_connections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_floor_id INT NOT NULL,
        target_floor_id INT NOT NULL,
        connection_type ENUM('STAIR', 'EMERGENCY_STAIR', 'ELEVATOR', 'ESCALATOR') NOT NULL,
        source_object_id INT NOT NULL,
        target_object_id INT NULL,
        name VARCHAR(100) NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_floor_id) REFERENCES floors(id) ON DELETE CASCADE,
        FOREIGN KEY (target_floor_id) REFERENCES floors(id) ON DELETE CASCADE,
        FOREIGN KEY (source_object_id) REFERENCES floor_objects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Floor Versions Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS floor_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        floor_id INT NOT NULL,
        version_number VARCHAR(50) NOT NULL,
        description TEXT NULL,
        snapshot_data LONGTEXT NOT NULL,
        status ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') DEFAULT 'DRAFT',
        published_at TIMESTAMP NULL,
        created_by VARCHAR(100) DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Block Audit Logs Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS block_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        username VARCHAR(100) NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50) NULL,
        target_id VARCHAR(50) NULL,
        details JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('[BlockSystem] Database tables initialized successfully.');

    // Seed default building if empty
    const [existingBuildings] = await pool.execute('SELECT COUNT(*) as count FROM buildings');
    if (existingBuildings[0].count === 0) {
      console.log('[BlockSystem] Seeding initial CSE Block building...');
      const [res] = await pool.execute(`
        INSERT INTO buildings (code, name, description, building_type, department, total_floors, geometry_type, x, y, width, height, rotation, boundary_points)
        VALUES ('CSE-BLK-01', 'CSE Main Block', 'Computer Science & Engineering Main Academic Building', 'Academic', 'Computer Science', 4, 'POLYGON', 50, 50, 600, 400, 0,
        '[{"x":50,"y":50},{"x":650,"y":50},{"x":650,"y":250},{"x":450,"y":250},{"x":450,"y":450},{"x":50,"y":450}]')
      `);
      const bId = res.insertId;

      const floorsSeed = [
        { num: 0, name: 'Ground Floor', code: 'G-FLOOR' },
        { num: 1, name: 'First Floor', code: '1ST-FLOOR' },
        { num: 2, name: 'Second Floor', code: '2ND-FLOOR' },
        { num: 3, name: 'Third Floor', code: '3RD-FLOOR' }
      ];

      for (const fl of floorsSeed) {
        await pool.execute(`
          INSERT INTO floors (building_id, floor_number, name, code, description, status)
          VALUES (?, ?, ?, ?, ?, 'Active')
        `, [bId, fl.num, fl.name, fl.code, `Academic & Laboratory level ${fl.num}`]);
      }
      console.log('[BlockSystem] Initial CSE Block and floors seeded successfully.');
    }
  } catch (err) {
    console.error('[BlockSystem] Database initialization error:', err);
  }
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].includes('init_block_tables.js')) {
  initBlockTables().then(() => process.exit(0));
}
