USE college_management_system;

-- Insert Roles
INSERT IGNORE INTO roles (name) VALUES 
('Admin'),
('Student'),
('Faculty'),
('Parent'),
('Principal'),
('HOD'),
('Accountant'),
('Librarian'),
('Placement Officer');

-- Insert Users
INSERT IGNORE INTO users (username, password, email, role_id) VALUES 
('admin', 'Admin@123', 'admin@collegeerp.com', (SELECT id FROM roles WHERE name = 'Admin')),
('student', 'Student@123', 'student@collegeerp.com', (SELECT id FROM roles WHERE name = 'Student')),
('faculty', 'Faculty@123', 'faculty@collegeerp.com', (SELECT id FROM roles WHERE name = 'Faculty')),
('parent', 'Parent@123', 'parent@collegeerp.com', (SELECT id FROM roles WHERE name = 'Parent')),
('principal', 'Principal@123', 'principal@collegeerp.com', (SELECT id FROM roles WHERE name = 'Principal')),
('hod', 'Hod@123', 'hod@collegeerp.com', (SELECT id FROM roles WHERE name = 'HOD')),
('accounts', 'Accounts@123', 'accounts@collegeerp.com', (SELECT id FROM roles WHERE name = 'Accountant')),
('librarian', 'Library@123', 'librarian@collegeerp.com', (SELECT id FROM roles WHERE name = 'Librarian')),
('placement', 'Placement@123', 'placement@collegeerp.com', (SELECT id FROM roles WHERE name = 'Placement Officer'));

-- ============================================================
-- CAMPUS MASTER INFRASTRUCTURE SEED DATA (MySQL)
-- ============================================================

-- 1. Insert Buildings
INSERT INTO campus_buildings (name, code, description, total_floors, map_x, map_y, map_width, map_height, opening_hours, contact_information) VALUES
('Administrative & Main Block', 'ADM', 'Central administration, Dean & Principal offices, Admissions, Accounts and Boardroom.', 3, 380, 460, 240, 140, '8:30 AM - 5:30 PM', '+1 (555) 019-2831'),
('Computer Science & AI Block', 'CSE', 'Premier engineering block for Computer Science, Artificial Intelligence, Data Science & Cloud Datacenter.', 4, 100, 150, 220, 190, '7:30 AM - 9:00 PM', '+1 (555) 019-2832'),
('Electronics & Electrical Block', 'ECE', 'State-of-the-art laboratories for ECE, EEE, VLSI Design, Robotics and Embedded Systems.', 4, 380, 140, 240, 180, '8:00 AM - 8:00 PM', '+1 (555) 019-2833'),
('Mechanical & Civil Engineering Block', 'MEC', 'Heavy engineering workshops, CAD/CAM studios, Materials Testing and Fluid Dynamics labs.', 3, 680, 150, 220, 190, '8:00 AM - 6:00 PM', '+1 (555) 019-2834'),
('Central Knowledge Hub & Library', 'LIB', 'Multi-level library with 100k+ volumes, digital archives, silent study pods and research commons.', 3, 100, 430, 210, 170, '7:00 AM - 11:00 PM', '+1 (555) 019-2835'),
('Auditorium & Student Activity Center', 'SAC', '1500-seat grand auditorium, indoor sports arena, cultural studios and campus food court.', 2, 690, 430, 210, 170, '8:00 AM - 10:00 PM', '+1 (555) 019-2836')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), map_x=VALUES(map_x), map_y=VALUES(map_y), map_width=VALUES(map_width), map_height=VALUES(map_height);

-- 2. Insert Room Types
INSERT IGNORE INTO campus_room_types (name, color, icon) VALUES
('Classroom', '#3b82f6', 'users'),
('Laboratory', '#10b981', 'flask-conical'),
('Office', '#f97316', 'briefcase'),
('Washroom', '#a855f7', 'droplet'),
('Library', '#06b6d4', 'book-open'),
('Auditorium', '#ec4899', 'volume-2'),
('Cafeteria', '#eab308', 'coffee'),
('Reception', '#6366f1', 'info'),
('Open Space', '#64748b', 'maximize-2'),
('Staircase', '#475569', 'arrow-up-right'),
('Lift', '#334155', 'arrow-up-down');

-- 3. Insert Floors for Buildings
INSERT INTO campus_floors (building_id, name, floor_number, description) VALUES
((SELECT id FROM campus_buildings WHERE code = 'CSE'), 'Ground Floor', 0, 'Computing labs, Mega Lab, and HOD suite.'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), 'First Floor', 1, 'AI/ML GPU research labs and lecture halls.'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), 'Second Floor', 2, 'Software Engineering & Cloud Computing labs.'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), 'Third Floor', 3, 'Postgraduate research suites & faculty cabins.'),
((SELECT id FROM campus_buildings WHERE code = 'ADM'), 'Ground Floor', 0, 'Admissions helpdesk, Accounts, and Main Lobby.'),
((SELECT id FROM campus_buildings WHERE code = 'ADM'), 'First Floor', 1, 'Dean, Principal, and Vice-Chancellor chambers.'),
((SELECT id FROM campus_buildings WHERE code = 'ADM'), 'Second Floor', 2, 'Executive Boardroom & Conference Suites.'),
((SELECT id FROM campus_buildings WHERE code = 'ECE'), 'Ground Floor', 0, 'Circuit simulation & Basic Electronics labs.'),
((SELECT id FROM campus_buildings WHERE code = 'ECE'), 'First Floor', 1, 'VLSI Design & Embedded Systems studios.'),
((SELECT id FROM campus_buildings WHERE code = 'MEC'), 'Ground Floor', 0, 'Manufacturing workshops & Heavy Machinery.'),
((SELECT id FROM campus_buildings WHERE code = 'LIB'), 'Ground Floor', 0, 'Circulation desk, new arrivals & digital kiosks.'),
((SELECT id FROM campus_buildings WHERE code = 'LIB'), 'First Floor', 1, 'Silent study commons and periodical archives.'),
((SELECT id FROM campus_buildings WHERE code = 'SAC'), 'Ground Floor', 0, 'Campus food court, cafeteria and indoor arena.')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);

-- 4. Insert Detailed Mapped Rooms for CSE Block (Ground Floor)
INSERT INTO campus_rooms (building_id, floor_id, room_type_id, room_number, room_name, department, capacity, description, x, y, width, height, fill_color, border_color, status) VALUES
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE building_id = (SELECT id FROM campus_buildings WHERE code = 'CSE') AND floor_number = 0 LIMIT 1), (SELECT id FROM campus_room_types WHERE name = 'Reception'), 'CSE-G01', 'CSE Department Helpdesk', 'CSE', 20, 'Student reception and information kiosk.', 50, 50, 160, 100, '#6366f1', '#4f46e5', 'Available'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE building_id = (SELECT id FROM campus_buildings WHERE code = 'CSE') AND floor_number = 0 LIMIT 1), (SELECT id FROM campus_room_types WHERE name = 'Laboratory'), 'CSE-G02', 'Mega Computing Lab', 'CSE', 120, '120 Dell Optiplex workstations with Gigabit LAN.', 240, 50, 320, 220, '#10b981', '#059669', 'Occupied'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE building_id = (SELECT id FROM campus_buildings WHERE code = 'CSE') AND floor_number = 0 LIMIT 1), (SELECT id FROM campus_room_types WHERE name = 'Laboratory'), 'CSE-G03', 'Apple MAC Design Studio', 'CSE', 60, '60 M3 iMac stations for iOS & Graphics engineering.', 590, 50, 280, 220, '#10b981', '#059669', 'Available'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE building_id = (SELECT id FROM campus_buildings WHERE code = 'CSE') AND floor_number = 0 LIMIT 1), (SELECT id FROM campus_room_types WHERE name = 'Office'), 'CSE-G04', 'HOD Executive Office', 'CSE', 12, 'Head of Department office and meeting chamber.', 50, 180, 160, 140, '#f97316', '#ea580c', 'Available'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE building_id = (SELECT id FROM campus_buildings WHERE code = 'CSE') AND floor_number = 0 LIMIT 1), (SELECT id FROM campus_room_types WHERE name = 'Classroom'), 'CSE-G05', 'Smart Lecture Hall 1', 'CSE', 90, 'Interactive 4K Smart Board & Dolby Surround.', 50, 350, 280, 180, '#3b82f6', '#2563eb', 'Occupied'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE building_id = (SELECT id FROM campus_buildings WHERE code = 'CSE') AND floor_number = 0 LIMIT 1), (SELECT id FROM campus_room_types WHERE name = 'Classroom'), 'CSE-G06', 'Smart Lecture Hall 2', 'CSE', 90, 'Acoustically tuned tiered lecture classroom.', 360, 350, 280, 180, '#3b82f6', '#2563eb', 'Available'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE building_id = (SELECT id FROM campus_buildings WHERE code = 'CSE') AND floor_number = 0 LIMIT 1), (SELECT id FROM campus_room_types WHERE name = 'Washroom'), 'CSE-G07', 'Restrooms & Utilities', 'General', 15, 'Male & Female executive restrooms.', 670, 350, 200, 180, '#a855f7', '#9333ea', 'Available'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE building_id = (SELECT id FROM campus_buildings WHERE code = 'CSE') AND floor_number = 0 LIMIT 1), (SELECT id FROM campus_room_types WHERE name = 'Staircase'), 'CSE-ST1', 'Main Central Stairs & Lift', 'General', 30, 'Access to Floors 1, 2, and 3.', 50, 560, 820, 60, '#475569', '#334155', 'Available')
ON DUPLICATE KEY UPDATE room_name=VALUES(room_name), department=VALUES(department), capacity=VALUES(capacity), x=VALUES(x), y=VALUES(y), width=VALUES(width), height=VALUES(height), fill_color=VALUES(fill_color);

-- 5. Insert Mapped Rooms for CSE Block (Floor 1: AI / Research)
INSERT INTO campus_rooms (building_id, floor_id, room_type_id, room_number, room_name, department, capacity, description, x, y, width, height, fill_color, border_color, status) VALUES
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE building_id = (SELECT id FROM campus_buildings WHERE code = 'CSE') AND floor_number = 1 LIMIT 1), (SELECT id FROM campus_room_types WHERE name = 'Laboratory'), 'CSE-101', 'AI & Deep Learning GPU Supercluster', 'AI', 50, 'NVIDIA H100 GPU server workstations for deep learning.', 50, 50, 380, 240, '#10b981', '#059669', 'Occupied'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE building_id = (SELECT id FROM campus_buildings WHERE code = 'CSE') AND floor_number = 1 LIMIT 1), (SELECT id FROM campus_room_types WHERE name = 'Laboratory'), 'CSE-102', 'Robotics & Computer Vision Lab', 'AI', 45, 'Robotic arms, drone testbeds, and LiDAR vision rigs.', 460, 50, 410, 240, '#10b981', '#059669', 'Available'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE building_id = (SELECT id FROM campus_buildings WHERE code = 'CSE') AND floor_number = 1 LIMIT 1), (SELECT id FROM campus_room_types WHERE name = 'Classroom'), 'CSE-103', 'AI Seminar & Conference Hall', 'AI', 150, 'Tiered auditorium for technical keynotes.', 50, 320, 480, 220, '#3b82f6', '#2563eb', 'Available'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE building_id = (SELECT id FROM campus_buildings WHERE code = 'CSE') AND floor_number = 1 LIMIT 1), (SELECT id FROM campus_room_types WHERE name = 'Office'), 'CSE-104', 'Senior Faculty Research Suites', 'CSE', 25, 'Cabins for professors and PhD research scholars.', 560, 320, 310, 220, '#f97316', '#ea580c', 'Available')
ON DUPLICATE KEY UPDATE room_name=VALUES(room_name), department=VALUES(department), capacity=VALUES(capacity), x=VALUES(x), y=VALUES(y), width=VALUES(width), height=VALUES(height);
-- ============================================================
-- STRUCTURED INDOOR FLOOR MAP SEED DATA (MySQL)
-- ============================================================

INSERT IGNORE INTO indoor_blocks (id, name, description) VALUES 
(1, 'Block A', 'Main Engineering & Computer Science Academic Block');

INSERT IGNORE INTO indoor_floors (id, block_id, name, level) VALUES 
(1, 1, 'Floor 1', 1);

-- Seed Exact Reference Floor Layout Rooms (Block A, Floor 1)
INSERT INTO indoor_rooms (id, floor_id, room_number, room_name, department, room_type, capacity, faculty, description, status, accessibility, x, y, width, height, color, border_color) VALUES
(1, 1, 'ATRIUM', 'Central Atrium', 'General', 'Open Space', 200, 'Campus Facilities', 'Landscaped central courtyard with green garden and seating.', 'Active', true, 240, 200, 480, 260, '#dcfce7', '#166534'),
(2, 1, 'A101', 'Classroom A101', 'CSE', 'Classroom', 60, 'Prof. S. R. Dixit', 'Interactive smart classroom with 4K projection.', 'Active', true, 95, 55, 145, 120, '#fef08a', '#ca8a04'),
(3, 1, 'A102', 'Classroom A102', 'CSE', 'Classroom', 60, 'Dr. Anand Verma', 'Tiered lecture classroom with acoustic panelling.', 'Active', true, 240, 55, 145, 120, '#fef08a', '#ca8a04'),
(4, 1, 'REST-01', 'Executive Restrooms', 'General', 'Restroom', 15, 'Housekeeping Staff', 'Male and female executive restrooms.', 'Active', true, 385, 55, 110, 120, '#bfdbfe', '#2563eb'),
(5, 1, 'STAIR-N', 'Staircase North', 'General', 'Staircase', 25, 'Facilities', 'Access to Floor 2 and Ground Level.', 'Active', false, 495, 55, 95, 120, '#dcfce7', '#16a34a'),
(6, 1, 'A103', 'Classroom A103', 'AI/DS', 'Classroom', 60, 'Dr. Kavita Nair', 'Air-conditioned digital smart classroom.', 'Active', true, 640, 55, 140, 120, '#fef08a', '#ca8a04'),
(7, 1, 'A104', 'Classroom A104', 'AI/DS', 'Classroom', 60, 'Prof. Priya Sharma', 'High-tech lecture room with touch screen display.', 'Active', true, 780, 55, 130, 120, '#fef08a', '#ca8a04'),
(8, 1, 'LIB-01', 'Department Library', 'CSE', 'Library', 120, 'Chief Librarian', 'Digital archives, silent study pods and research journals.', 'Active', true, 30, 200, 155, 140, '#f3e8ff', '#9333ea'),
(9, 1, 'A109', 'Computer Lab A109', 'CSE', 'Laboratory', 80, 'Dr. Sandeep Jha', '80 high-speed Dell workstations with Gigabit LAN.', 'Active', true, 30, 340, 155, 150, '#bae6fd', '#0284c7'),
(10, 1, 'FAC-01', 'Faculty Room', 'Staff', 'Faculty Room', 30, 'Professors Suite', 'Workstation cabins and discussion lounge for professors.', 'Active', true, 780, 200, 185, 140, '#f3e8ff', '#9333ea'),
(11, 1, 'A105', 'Seminar Hall A105', 'CSE/AI', 'Seminar Hall', 150, 'Dr. Ramesh Kumar (HOD)', 'Tiered presentation auditorium with surround PA system.', 'Active', true, 780, 340, 185, 150, '#bae6fd', '#0284c7'),
(12, 1, 'A108', 'Classroom A108', 'IT', 'Classroom', 60, 'Prof. Vikram Das', 'Smart lecture room with active recording cameras.', 'Active', true, 95, 530, 145, 130, '#fef08a', '#ca8a04'),
(13, 1, 'ADM-01', 'Admin Office', 'Admin', 'Office', 25, 'Academic Office', 'Student records, admissions desk and coordinator chambers.', 'Active', true, 240, 530, 150, 130, '#fce7f3', '#db2777'),
(14, 1, 'STAIR-S', 'Staircase South', 'General', 'Staircase', 25, 'Facilities', 'Main staircase to Ground floor foyer and Level 2.', 'Active', false, 425, 545, 110, 115, '#dcfce7', '#16a34a'),
(15, 1, 'ELEV-01', 'Smart Glass Elevator', 'General', 'Elevator', 16, 'Building Services', 'ADA-accessible high-speed smart elevator.', 'Active', true, 535, 545, 45, 115, '#99f6e4', '#0d9488'),
(16, 1, 'A107', 'Classroom A107', 'IT', 'Classroom', 60, 'Prof. Sneha Reddy', 'Modern lecture classroom with Wi-Fi 6 coverage.', 'Active', true, 605, 530, 145, 130, '#fef08a', '#ca8a04'),
(17, 1, 'A106', 'Classroom A106', 'CSE', 'Classroom', 60, 'Dr. M. S. Rao', 'Lecture hall with interactive whiteboard.', 'Active', true, 750, 530, 160, 130, '#fef08a', '#ca8a04')
ON DUPLICATE KEY UPDATE room_name=VALUES(room_name), department=VALUES(department), capacity=VALUES(capacity), x=VALUES(x), y=VALUES(y), width=VALUES(width), height=VALUES(height), color=VALUES(color);

-- Seed Navigation Nodes (Corridor Graph for A* Shortest Path Engine)
INSERT INTO indoor_nav_nodes (id, floor_id, node_name, node_type, x, y, status) VALUES
('N_ENTRANCE', 1, 'Main Floor Entrance', 'entrance', 405, 645, 'Active'),
('N_CORR_SW', 1, 'Corridor South-West', 'corridor', 215, 505, 'Active'),
('N_CORR_SE', 1, 'Corridor South-East', 'corridor', 745, 505, 'Active'),
('N_CORR_NW', 1, 'Corridor North-West', 'corridor', 215, 190, 'Active'),
('N_CORR_NE', 1, 'Corridor North-East', 'corridor', 745, 190, 'Active'),
('N_CORR_N', 1, 'Corridor North Center', 'corridor', 495, 190, 'Active'),
('N_CORR_S', 1, 'Corridor South Center', 'corridor', 405, 505, 'Active'),
('N_CORR_W', 1, 'Corridor West Center', 'corridor', 215, 340, 'Active'),
('N_CORR_E', 1, 'Corridor East Center', 'corridor', 745, 340, 'Active'),
('N_A101', 1, 'A101 Doorway', 'door', 215, 175, 'Active'),
('N_A102', 1, 'A102 Doorway', 'door', 270, 175, 'Active'),
('N_REST', 1, 'Restroom Entrance', 'door', 435, 175, 'Active'),
('N_STAIR_N', 1, 'North Staircase Entry', 'stairs', 545, 175, 'Active'),
('N_A103', 1, 'A103 Doorway', 'door', 670, 175, 'Active'),
('N_A104', 1, 'A104 Doorway', 'door', 810, 175, 'Active'),
('N_LIB', 1, 'Library Main Door', 'door', 185, 270, 'Active'),
('N_A109', 1, 'Computer Lab A109 Door', 'door', 185, 415, 'Active'),
('N_FAC', 1, 'Faculty Room Door', 'door', 780, 270, 'Active'),
('N_A105', 1, 'Seminar Hall A105 Door', 'door', 780, 415, 'Active'),
('N_A108', 1, 'A108 Doorway', 'door', 195, 530, 'Active'),
('N_ADM', 1, 'Admin Office Door', 'door', 315, 530, 'Active'),
('N_ELEV', 1, 'Elevator Entrance', 'elevator', 555, 545, 'Active'),
('N_A107', 1, 'A107 Doorway', 'door', 675, 530, 'Active'),
('N_A106', 1, 'A106 Doorway', 'door', 805, 530, 'Active')
ON DUPLICATE KEY UPDATE x=VALUES(x), y=VALUES(y), node_type=VALUES(node_type);

-- Seed Navigation Edges (Graph Connections)
INSERT IGNORE INTO indoor_nav_edges (from_node, to_node, distance, walking_time, is_bidirectional, is_accessible) VALUES
('N_ENTRANCE', 'N_CORR_S', 140, 2.0, true, true),
('N_CORR_S', 'N_CORR_SW', 190, 2.7, true, true),
('N_CORR_S', 'N_CORR_SE', 340, 4.8, true, true),
('N_CORR_SW', 'N_CORR_W', 165, 2.3, true, true),
('N_CORR_W', 'N_CORR_NW', 150, 2.1, true, true),
('N_CORR_NW', 'N_CORR_N', 280, 4.0, true, true),
('N_CORR_N', 'N_CORR_NE', 250, 3.5, true, true),
('N_CORR_NE', 'N_CORR_E', 150, 2.1, true, true),
('N_CORR_E', 'N_CORR_SE', 165, 2.3, true, true),
('N_CORR_NW', 'N_A101', 15, 0.2, true, true),
('N_CORR_NW', 'N_A102', 55, 0.8, true, true),
('N_CORR_N', 'N_REST', 60, 0.9, true, true),
('N_CORR_N', 'N_STAIR_N', 50, 0.7, true, false),
('N_CORR_NE', 'N_A103', 75, 1.0, true, true),
('N_CORR_NE', 'N_A104', 65, 0.9, true, true),
('N_CORR_W', 'N_LIB', 30, 0.4, true, true),
('N_CORR_W', 'N_A109', 30, 0.4, true, true),
('N_CORR_E', 'N_FAC', 35, 0.5, true, true),
('N_CORR_E', 'N_A105', 35, 0.5, true, true),
('N_CORR_SW', 'N_A108', 25, 0.3, true, true),
('N_CORR_SW', 'N_ADM', 100, 1.4, true, true),
('N_CORR_S', 'N_ELEV', 150, 2.1, true, true),
('N_CORR_SE', 'N_A107', 70, 1.0, true, true),
('N_CORR_SE', 'N_A106', 60, 0.8, true, true);


