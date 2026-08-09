import express from 'express';
import pool from './db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);
        
        const searchTerm = `%${query}%`;
        const [users] = await pool.execute(
            'SELECT id, name, role FROM users WHERE name LIKE ? LIMIT 5',
            [searchTerm]
        );
        const [departments] = await pool.execute(
            'SELECT id, name, "Department" as role FROM departments WHERE name LIKE ? LIMIT 5',
            [searchTerm]
        );
        const [courses] = await pool.execute(
            'SELECT id, name, "Course" as role FROM courses WHERE name LIKE ? LIMIT 5',
            [searchTerm]
        );
        
        res.json([...users, ...departments, ...courses]);
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
