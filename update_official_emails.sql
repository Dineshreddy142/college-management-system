-- update_official_emails.sql
-- Safe, idempotent migration script to update official ERP account emails
-- Preserves existing user IDs, foreign keys, profile relationships, and password hashes

USE college_management_system;

-- 1. Update Admin account
UPDATE users 
SET email = 'nuthanakalvadineshreddy@gmail.com', status = 'active', updated_at = NOW() 
WHERE (id = 1 OR username = 'admin' OR role_id = (SELECT id FROM roles WHERE name = 'Admin'))
  AND email != 'nuthanakalvadineshreddy@gmail.com'
LIMIT 1;

-- 2. Update Faculty account
UPDATE users 
SET email = 'nreddydinesh1428@gmail.com', status = 'active', updated_at = NOW() 
WHERE (id = 3 OR username = 'faculty' OR role_id = (SELECT id FROM roles WHERE name = 'Faculty'))
  AND email != 'nreddydinesh1428@gmail.com'
LIMIT 1;

-- 3. Update HOD account
UPDATE users 
SET email = 'nreddydinesh@gmail.com', status = 'active', updated_at = NOW() 
WHERE (id = 6 OR username = 'hod' OR role_id = (SELECT id FROM roles WHERE name = 'HOD'))
  AND email != 'nreddydinesh@gmail.com'
LIMIT 1;

-- 4. Update Student account
UPDATE users 
SET email = 'as1428dinesh@gmail.com', status = 'active', updated_at = NOW() 
WHERE (id = 2 OR username = 'student' OR role_id = (SELECT id FROM roles WHERE name = 'Student'))
  AND email != 'as1428dinesh@gmail.com'
LIMIT 1;
