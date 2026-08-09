import pool from '../db.js';

async function listUsers() {
    try {
        const [users] = await pool.execute('SELECT u.id, u.username, u.email, u.password, r.name as role FROM users u JOIN roles r ON u.role_id = r.id');
        console.log(users);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
listUsers();
