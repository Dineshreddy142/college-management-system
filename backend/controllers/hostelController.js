import pool from '../db.js';

// GET /api/hostels/blocks - List all hostel blocks with occupancy metrics
export const getHostelBlocks = async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('[HOSTEL CONTROLLER ERROR - getHostelBlocks]:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving hostel blocks' });
  }
};

// POST /api/hostels/blocks - Create a new hostel block (Admin/Staff)
export const createHostelBlock = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Hostel block module is inactive', data: null });
  } catch (error) {
    console.error('[HOSTEL CONTROLLER ERROR - createHostelBlock]:', error);
    res.status(500).json({ success: false, message: 'Server error creating hostel block' });
  }
};

// POST /api/hostels/allocate - Allocate room/bed to student
export const allocateStudent = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Hostel allocation module is inactive' });
  } catch (error) {
    console.error('[HOSTEL CONTROLLER ERROR - allocateStudent]:', error);
    res.status(500).json({ success: false, message: 'Server error allocating student to hostel' });
  }
};

