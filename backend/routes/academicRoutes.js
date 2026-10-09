import express from 'express';
import { getSubjects, createSubject, updateSubject } from '../controllers/subjectController.js';
import { getSubjectOfferings, createSubjectOffering } from '../controllers/offeringRegistrationController.js';
import { getRegulations } from '../controllers/academicRuleController.js';

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

export default router;
