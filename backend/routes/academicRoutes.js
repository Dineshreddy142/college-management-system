import express from 'express';
import pool from '../db.js';
import {
  getSubjects, createSubject, updateSubject
} from '../controllers/subjectController.js';
import { getSubjectOfferings, createSubjectOffering } from '../controllers/offeringRegistrationController.js';
import { getRegulations } from '../controllers/academicRuleController.js';
import { getSections } from '../controllers/sectionController.js';

const router = express.Router();

// Subject Management Routes (Delegated to primary subjectController)
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);

// Subject Allocations / Offerings (Delegated to primary offeringRegistrationController)
router.get('/allocations', getSubjectOfferings);
router.post('/allocations', createSubjectOffering);

// Academic Regulations (Delegated to primary academicRuleController)
router.get('/regulations', getRegulations);

// Sections
router.get('/sections', getSections);

// Available Faculty (for faculty management dropdowns)
router.get('/available-faculty', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT f.id, f.employee_id, f.name, f.email, f.department_id, f.designation, f.status,
             d.name as department_name
      FROM faculty f
      LEFT JOIN departments d ON f.department_id = d.id
      ORDER BY f.name ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching available faculty:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch faculty', error: error.message });
  }
});

export default router;
