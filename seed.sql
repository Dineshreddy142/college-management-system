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

-- Campus Navigation Seed Data
INSERT IGNORE INTO campus_buildings (name, code, description) VALUES
('Computer Science Block', 'CSE', 'Main building for Computer Science & Engineering department.');

INSERT IGNORE INTO campus_floors (building_id, name, floor_number, description) VALUES
((SELECT id FROM campus_buildings WHERE code = 'CSE'), 'Ground Floor', 0, 'Main reception and labs.');

INSERT IGNORE INTO campus_room_types (name, color, icon) VALUES
('Classroom', 'blue', 'users'),
('Laboratory', 'green', 'flask-conical'),
('Office', 'orange', 'briefcase'),
('Washroom', 'purple', 'droplet'),
('Learning Space', 'yellow', 'book-open'),
('Library', 'darkgreen', 'library'),
('Emergency', 'red', 'alert-triangle'),
('Open Space', 'gray', 'square'),
('Reception', 'orange', 'users'),
('Lift', 'gray', 'arrow-up-down'),
('Staircase', 'gray', 'stairs');

INSERT IGNORE INTO campus_rooms (building_id, floor_id, room_type_id, room_number, room_name, department, capacity, description, x, y, width, height, fill_color, border_color) VALUES
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE name = 'Ground Floor'), (SELECT id FROM campus_room_types WHERE name = 'Reception'), 'G-01', 'Main Reception', 'Admin', 20, 'Front desk and waiting area.', 400, 700, 200, 100, '#f97316', '#c2410c'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE name = 'Ground Floor'), (SELECT id FROM campus_room_types WHERE name = 'Laboratory'), 'G-02', 'Mega Lab', 'CSE', 120, 'Main computer laboratory with 120 workstations.', 50, 100, 300, 400, '#22c55e', '#15803d'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE name = 'Ground Floor'), (SELECT id FROM campus_room_types WHERE name = 'Laboratory'), 'G-03', 'MAC Lab', 'CSE', 60, 'Apple Mac laboratory.', 50, 520, 300, 150, '#22c55e', '#15803d'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE name = 'Ground Floor'), (SELECT id FROM campus_room_types WHERE name = 'Office'), 'G-04', 'HOD Office', 'CSE', 10, 'Head of Department Office.', 400, 100, 150, 150, '#f97316', '#c2410c'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE name = 'Ground Floor'), (SELECT id FROM campus_room_types WHERE name = 'Classroom'), 'G-05', 'Seminar Hall', 'CSE', 200, 'Large seminar hall.', 650, 100, 300, 400, '#3b82f6', '#1d4ed8'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE name = 'Ground Floor'), (SELECT id FROM campus_room_types WHERE name = 'Washroom'), 'G-06', 'Gents Washroom', 'General', 5, 'Male Washroom.', 400, 300, 75, 100, '#a855f7', '#7e22ce'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE name = 'Ground Floor'), (SELECT id FROM campus_room_types WHERE name = 'Washroom'), 'G-07', 'Ladies Washroom', 'General', 5, 'Female Washroom.', 475, 300, 75, 100, '#a855f7', '#7e22ce'),
((SELECT id FROM campus_buildings WHERE code = 'CSE'), (SELECT id FROM campus_floors WHERE name = 'Ground Floor'), (SELECT id FROM campus_room_types WHERE name = 'Open Space'), 'G-08', 'Central Courtyard', 'General', 500, 'Open gathering area.', 400, 420, 200, 250, '#9ca3af', '#4b5563');
