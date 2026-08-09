import express from 'express';
import pool from './db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Notifications Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id/read', async (req, res) => {
    try {
        await pool.execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Notifications Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
