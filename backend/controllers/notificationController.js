import pool from '../db.js';

export const getUserNotifications = async (req, res) => {
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
};

export const markNotificationAsRead = async (req, res) => {
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
};
