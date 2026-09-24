import pool from '../db.js';

export const getVehicles = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT v.*, u.username, u.full_name, u.email 
      FROM vehicles v 
      LEFT JOIN users u ON v.user_id = u.id 
      ORDER BY v.id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addVehicle = async (req, res) => {
  try {
    const { car_name, license_plate, vehicle_type, color, user_id } = req.body;
    if (!car_name) {
      return res.status(400).json({ error: 'Car name is required' });
    }
    const targetUserId = user_id || req.user.id;
    const [result] = await pool.execute(
      'INSERT INTO vehicles (user_id, car_name, license_plate, vehicle_type, color) VALUES (?, ?, ?, ?, ?)',
      [targetUserId, car_name, license_plate || null, vehicle_type || 'Car', color || null]
    );
    res.status(201).json({ success: true, id: result.insertId, message: 'Vehicle added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM vehicles WHERE id = ?', [id]);
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
