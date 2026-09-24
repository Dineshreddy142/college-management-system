import pool from '../db.js';

export const getSettings = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM system_settings');
    const settings = {};
    rows.forEach(row => settings[row.setting_key] = row.setting_value);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.execute(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)]
      );
    }
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
