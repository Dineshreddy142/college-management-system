import express from 'express';
import {
    getClassrooms,
    createClassroom,
    getTimeSlots,
    createTimeSlot,
    getMasterTimetables,
    uploadTimetable,
    publishTimetable,
    getTimetableTemplate,
    getPredefinedSubjects,
    createSemesterTimetable,
    getFacultyTimetable
} from '../controllers/timetableController.js';
import { authenticateToken } from '../middleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/template', getTimetableTemplate);
router.get('/predefined-subjects', getPredefinedSubjects);
router.get('/classrooms', getClassrooms);
router.post('/classrooms', createClassroom);
router.get('/timeslots', getTimeSlots);
router.post('/timeslots', createTimeSlot);
router.get('/master', getMasterTimetables);
router.get('/faculty', getFacultyTimetable);
router.post('/create-semester', createSemesterTimetable);
router.post('/upload', uploadTimetable);
router.post('/publish/:id', publishTimetable);

export default router;
