import pool from '../db.js';

export const getClassrooms = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM classrooms ORDER BY room_number ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching classrooms:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createClassroom = async (req, res) => {
    try {
        const { room_number, building, floor, capacity, room_type, status } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO classrooms (room_number, building, floor, capacity, room_type, status) VALUES (?, ?, ?, ?, ?, ?)',
            [room_number, building, floor, capacity || 60, room_type || 'Lecture Hall', status || 'Active']
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getTimeSlots = async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM time_slots ORDER BY start_time ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createTimeSlot = async (req, res) => {
    try {
        const { period_number, start_time, end_time, is_break, title } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO time_slots (period_number, start_time, end_time, is_break, title) VALUES (?, ?, ?, ?, ?)',
            [period_number, start_time, end_time, is_break || false, title]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getMasterTimetables = async (req, res) => {
    try {
        const { sectionId } = req.query;

        if (sectionId) {
            const [entries] = await pool.execute(`
                SELECT te.id, te.day_of_week, te.section_id,
                       s.code as subject_code, s.name as subject_name,
                       ts.start_time, ts.end_time, ts.period_number, ts.title as slot_title,
                       c.room_number, c.room_number as room_name, c.building,
                       COALESCE(u.full_name, f.name, 'Faculty') as faculty_name,
                       tm.status as master_status
                FROM timetable_entries te
                JOIN timetable_master tm ON te.timetable_master_id = tm.id
                LEFT JOIN subjects s ON te.subject_id = s.id
                LEFT JOIN time_slots ts ON te.time_slot_id = ts.id
                LEFT JOIN classrooms c ON te.room_id = c.id
                LEFT JOIN faculty f ON te.faculty_id = f.id
                LEFT JOIN users u ON f.user_id = u.id
                WHERE te.section_id = ?
                ORDER BY FIELD(te.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), ts.start_time ASC
            `, [sectionId]);
            return res.json(entries);
        }

        const [rows] = await pool.execute(`
            SELECT tm.*, 
                   COALESCE(d.name, 'Computer Science & Engineering') as dept_name, 
                   COALESCE(c.name, 'B.Tech') as course_name, 
                   COALESCE(s.name, CONCAT('Semester ', COALESCE(s.semester_number, '1'))) as sem_name
            FROM timetable_master tm
            LEFT JOIN departments d ON tm.department_id = d.id
            LEFT JOIN courses c ON tm.course_id = c.id
            LEFT JOIN semesters s ON tm.semester_id = s.id
            ORDER BY tm.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching master timetables:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getTimetableTemplate = async (req, res) => {
    try {
        const [sections] = await pool.query('SELECT id, name FROM sections LIMIT 10');
        const [subjects] = await pool.query('SELECT id, code, name FROM subjects LIMIT 15');
        const [rooms] = await pool.query('SELECT id, room_number FROM classrooms LIMIT 10');
        const [facultyList] = await pool.query('SELECT f.id, COALESCE(u.full_name, f.name) as name FROM faculty f LEFT JOIN users u ON f.user_id = u.id LIMIT 10');

        const secName = sections[0]?.name || 'Section A';
        const sampleRows = [
            { day: 'Monday', section: secName, time: '09:00 - 10:00', code: subjects[0]?.code || 'CS301', subject: subjects[0]?.name || 'Data Structures', faculty: facultyList[0]?.name || 'Dr. Ramesh Rao', room: rooms[0]?.room_number || 'CS-101' },
            { day: 'Monday', section: secName, time: '10:00 - 11:00', code: subjects[1]?.code || 'CS302', subject: subjects[1]?.name || 'Database Systems', faculty: facultyList[1]?.name || 'Prof. Sunita Sharma', room: rooms[1]?.room_number || 'CS-Lab1' },
            { day: 'Monday', section: secName, time: '11:15 - 12:15', code: subjects[2]?.code || 'CS303', subject: subjects[2]?.name || 'Operating Systems', faculty: facultyList[0]?.name || 'Dr. Ramesh Rao', room: rooms[0]?.room_number || 'CS-101' },
            { day: 'Tuesday', section: secName, time: '09:00 - 10:00', code: subjects[2]?.code || 'CS303', subject: subjects[2]?.name || 'Operating Systems', faculty: facultyList[0]?.name || 'Dr. Ramesh Rao', room: rooms[0]?.room_number || 'CS-101' },
            { day: 'Tuesday', section: secName, time: '10:00 - 11:00', code: subjects[3]?.code || 'CS304', subject: subjects[3]?.name || 'Computer Networks', faculty: facultyList[1]?.name || 'Prof. Sunita Sharma', room: rooms[2]?.room_number || 'SH-201' },
            { day: 'Wednesday', section: secName, time: '09:00 - 10:00', code: subjects[0]?.code || 'CS301', subject: subjects[0]?.name || 'Data Structures', faculty: facultyList[0]?.name || 'Dr. Ramesh Rao', room: rooms[0]?.room_number || 'CS-101' },
            { day: 'Wednesday', section: secName, time: '11:15 - 12:15', code: subjects[4]?.code || 'CS305', subject: subjects[4]?.name || 'Web Technologies', faculty: facultyList[1]?.name || 'Prof. Sunita Sharma', room: rooms[1]?.room_number || 'CS-Lab1' },
            { day: 'Thursday', section: secName, time: '10:00 - 11:00', code: subjects[1]?.code || 'CS302', subject: subjects[1]?.name || 'Database Systems', faculty: facultyList[1]?.name || 'Prof. Sunita Sharma', room: rooms[1]?.room_number || 'CS-Lab1' },
            { day: 'Friday', section: secName, time: '09:00 - 10:00', code: subjects[0]?.code || 'CS301', subject: subjects[0]?.name || 'Data Structures', faculty: facultyList[0]?.name || 'Dr. Ramesh Rao', room: rooms[0]?.room_number || 'CS-101' }
        ];

        let csv = 'DayOfWeek,Section,TimeSlot,SubjectCode,SubjectName,FacultyName,RoomNumber\r\n';
        sampleRows.forEach(r => {
            csv += `"${r.day}","${r.section}","${r.time}","${r.code}","${r.subject}","${r.faculty}","${r.room}"\r\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="Timetable_Import_Template.csv"');
        return res.status(200).send(csv);
    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ error: 'Failed to generate template' });
    }
};

export const uploadTimetable = async (req, res) => {
    let { department_id, course_id, semester_id, academic_session_id, rows, autoPublish } = req.body;
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ message: 'No rows provided for timetable import' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Fallbacks for department, course, and semester if not provided
        if (!department_id) {
            const [dept] = await connection.query('SELECT id FROM departments LIMIT 1');
            department_id = dept[0]?.id || 1;
        }
        if (!course_id) {
            const [crs] = await connection.query('SELECT id FROM courses LIMIT 1');
            course_id = crs[0]?.id || 1;
        }
        if (!semester_id) {
            const [sem] = await connection.query('SELECT id FROM semesters LIMIT 1');
            semester_id = sem[0]?.id || 1;
        }

        const initialStatus = autoPublish ? 'Published' : 'Draft';
        const [masterRes] = await connection.execute(
            'INSERT INTO timetable_master (department_id, course_id, semester_id, academic_session_id, status, published_at) VALUES (?, ?, ?, ?, ?, ?)',
            [department_id, course_id, semester_id, academic_session_id || null, initialStatus, autoPublish ? new Date() : null]
        );
        const masterId = masterRes.insertId;

        // Cache reference lookup tables to resolve IDs if names/codes were passed
        const [allSections] = await connection.query('SELECT id, name FROM sections');
        const [allSubjects] = await connection.query('SELECT id, code, name FROM subjects');
        const [allRooms] = await connection.query('SELECT id, room_number FROM classrooms');
        const [allSlots] = await connection.query('SELECT id, start_time, title FROM time_slots');
        const [allFaculty] = await connection.query('SELECT f.id, COALESCE(u.full_name, f.name) as name, f.name as fac_name FROM faculty f LEFT JOIN users u ON f.user_id = u.id');

        const errors = [];
        let validRows = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            let { section_id, day_of_week, time_slot_id, subject_id, faculty_id, room_id,
                  section, day, time, code, subject, faculty, room } = row;

            day_of_week = day_of_week || day || 'Monday';

            // Resolve section
            if (!section_id && (section || row.Section)) {
                const sName = (section || row.Section || '').toString().trim().toLowerCase();
                const matchedSec = allSections.find(s => s.name.toLowerCase() === sName || sName.includes(s.name.toLowerCase()));
                section_id = matchedSec ? matchedSec.id : (allSections[0]?.id || 1);
            } else if (!section_id) {
                section_id = allSections[0]?.id || 1;
            }

            // Resolve subject
            if (!subject_id && (code || subject || row.SubjectCode || row.SubjectName)) {
                const sCode = (code || row.SubjectCode || '').toString().trim().toLowerCase();
                const sName = (subject || row.SubjectName || '').toString().trim().toLowerCase();
                const matchedSub = allSubjects.find(s => 
                    (sCode && s.code.toLowerCase() === sCode) || 
                    (sName && s.name.toLowerCase().includes(sName))
                );
                subject_id = matchedSub ? matchedSub.id : (allSubjects[0]?.id || 1);
            } else if (!subject_id) {
                subject_id = allSubjects[0]?.id || 1;
            }

            // Resolve room
            if (!room_id && (room || row.RoomNumber || row.room_number)) {
                const rNum = (room || row.RoomNumber || row.room_number || '').toString().trim().toLowerCase();
                const matchedRoom = allRooms.find(r => r.room_number.toLowerCase() === rNum);
                room_id = matchedRoom ? matchedRoom.id : (allRooms[0]?.id || 1);
            } else if (!room_id) {
                room_id = allRooms[0]?.id || 1;
            }

            // Resolve faculty
            if (!faculty_id && (faculty || row.FacultyName || row.faculty_name)) {
                const fName = (faculty || row.FacultyName || row.faculty_name || '').toString().trim().toLowerCase();
                const matchedFac = allFaculty.find(f => 
                    (f.name && f.name.toLowerCase().includes(fName)) || 
                    (f.fac_name && f.fac_name.toLowerCase().includes(fName))
                );
                faculty_id = matchedFac ? matchedFac.id : (allFaculty[0]?.id || 1);
            } else if (!faculty_id) {
                faculty_id = allFaculty[0]?.id || 1;
            }

            // Resolve time slot
            if (!time_slot_id && (time || row.TimeSlot || row.time_slot)) {
                const tStr = (time || row.TimeSlot || row.time_slot || '').toString().trim();
                const matchedSlot = allSlots.find(s => {
                    const startH = s.start_time ? String(s.start_time).substring(0, 2) : '';
                    return startH && tStr.startsWith(startH);
                });
                time_slot_id = matchedSlot ? matchedSlot.id : (allSlots[0]?.id || 1);
            } else if (!time_slot_id) {
                time_slot_id = allSlots[0]?.id || 1;
            }

            // Conflict Check: Faculty clash
            if (faculty_id && day_of_week && time_slot_id) {
                const [clashCheck] = await connection.execute(
                    `SELECT e.id FROM timetable_entries e 
                     JOIN timetable_master m ON e.timetable_master_id = m.id 
                     WHERE e.faculty_id = ? AND e.day_of_week = ? AND e.time_slot_id = ? AND m.status = 'Published'`,
                    [faculty_id, day_of_week, time_slot_id]
                );

                if (clashCheck.length > 0) {
                    errors.push({ rowNumber: i + 2, error: `Faculty Clash: Faculty already assigned to another class during ${day_of_week} slot.` });
                    continue;
                }
            }

            // Conflict Check: Room clash
            if (room_id && day_of_week && time_slot_id) {
                const [roomClashCheck] = await connection.execute(
                    `SELECT e.id FROM timetable_entries e 
                     JOIN timetable_master m ON e.timetable_master_id = m.id 
                     WHERE e.room_id = ? AND e.day_of_week = ? AND e.time_slot_id = ? AND m.status = 'Published'`,
                    [room_id, day_of_week, time_slot_id]
                );

                if (roomClashCheck.length > 0) {
                    errors.push({ rowNumber: i + 2, error: `Room Clash: Classroom already occupied during ${day_of_week} slot.` });
                    continue;
                }
            }

            await connection.execute(
                'INSERT INTO timetable_entries (timetable_master_id, section_id, day_of_week, time_slot_id, subject_id, faculty_id, room_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [masterId, section_id, day_of_week, time_slot_id, subject_id, faculty_id, room_id]
            );
            validRows++;
        }

        if (errors.length > 0 && validRows === 0) {
            await connection.rollback();
            res.status(400).json({ message: 'Validation failed: all rows had conflicts', errors });
        } else {
            await connection.commit();
            res.status(201).json({
                message: `Timetable imported successfully as ${initialStatus}`,
                masterId,
                importedRows: validRows,
                conflictWarnings: errors
            });
        }

    } catch (error) {
        await connection.rollback();
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    } finally {
        connection.release();
    }
};

export const publishTimetable = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute('UPDATE timetable_master SET status = ?, published_at = NOW() WHERE id = ?', ['Published', id]);
        res.json({ message: 'Timetable published successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
