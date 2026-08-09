import pool from './backend/db.js';

async function initNavigationDB() {
    try {
        console.log("Creating Navigation tables...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_nav_nodes (
                id VARCHAR(50) PRIMARY KEY,
                building_id INT NOT NULL,
                floor_id INT NOT NULL,
                node_name VARCHAR(100),
                node_type VARCHAR(50) DEFAULT 'waypoint', -- room, door, corridor, stairs, lift, entrance, exit
                related_room_number VARCHAR(50), -- Link to campus_rooms
                x FLOAT NOT NULL,
                y FLOAT NOT NULL,
                status VARCHAR(20) DEFAULT 'Active',
                FOREIGN KEY (building_id) REFERENCES campus_buildings(id) ON DELETE CASCADE,
                FOREIGN KEY (floor_id) REFERENCES campus_floors(id) ON DELETE CASCADE
            );
        `);
        console.log("campus_nav_nodes created");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS campus_nav_edges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                from_node VARCHAR(50) NOT NULL,
                to_node VARCHAR(50) NOT NULL,
                distance FLOAT NOT NULL, -- in pixels or meters
                walking_time FLOAT NOT NULL, -- in seconds
                is_bidirectional BOOLEAN DEFAULT TRUE,
                is_accessible BOOLEAN DEFAULT TRUE, -- false for stairs if wheelchair
                status VARCHAR(20) DEFAULT 'Active',
                FOREIGN KEY (from_node) REFERENCES campus_nav_nodes(id) ON DELETE CASCADE,
                FOREIGN KEY (to_node) REFERENCES campus_nav_nodes(id) ON DELETE CASCADE
            );
        `);
        console.log("campus_nav_edges created");

        await pool.query(`
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
        console.log("campus_nav_routes created");

        console.log("Seeding Navigation Data...");
        
        // building=1, floor=1 (CSE Ground Floor)
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
            await pool.query(
                `INSERT IGNORE INTO campus_nav_nodes (id, building_id, floor_id, node_name, node_type, related_room_number, x, y) 
                 VALUES (?, 1, 1, ?, ?, ?, ?, ?)`,
                [n.id, n.name, n.type, n.room, n.x, n.y]
            );
        }

        const calcDist = (n1, n2) => Math.sqrt(Math.pow(n1.x - n2.x, 2) + Math.pow(n1.y - n2.y, 2));
        const calcTime = (dist) => dist / 50; // Assume 50 pixels per second

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
            
            await pool.query(
                `INSERT INTO campus_nav_edges (from_node, to_node, distance, walking_time, is_bidirectional, is_accessible) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [n1.id, n2.id, dist, time, true, true]
            );
        }

        console.log("Navigation Data Seeded Successfully");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
initNavigationDB();
