import pool from '../../db.js';

/**
 * Builds rich, real-time context for the AI Assistant based on the authenticated user and ERP data.
 */
export const buildSystemPrompt = async (user) => {
  let userContext = `Role: Visitor / Unauthenticated`;
  let liveErpData = '';

  if (user && user.id) {
    userContext = `User ID: ${user.id} | Username: ${user.username} | Role: ${user.role}`;

    try {
      if (user.role === 'Student') {
        // Fetch Student Specific Details
        const [stRows] = await pool.query(
          `SELECT s.id as student_id, s.roll_number, s.admission_number, CONCAT_WS(' ', s.first_name, s.last_name) as full_name,
                  d.name as department_name, s.semester, s.section, s.cgpa
           FROM students s
           LEFT JOIN departments d ON s.department_id = d.id
           WHERE s.user_id = ?`,
          [user.id]
        );

        if (stRows.length > 0) {
          const st = stRows[0];
          
          // Attendance summary
          let attendancePercentage = 'N/A';
          try {
            const [attRows] = await pool.query(
              `SELECT 
                 COUNT(*) as total_classes,
                 SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_classes
               FROM attendance_records
               WHERE student_id = ?`,
              [st.student_id]
            );
            if (attRows.length > 0 && attRows[0].total_classes > 0) {
              const pct = (attRows[0].present_classes / attRows[0].total_classes) * 100;
              attendancePercentage = `${pct.toFixed(1)}% (${attRows[0].present_classes}/${attRows[0].total_classes} classes attended)`;
            }
          } catch (e) {}

          // Fee status summary
          let feeSummary = 'No fee records found';
          try {
            const [feeRows] = await pool.query(
              `SELECT amount, status, due_date FROM fee_payments WHERE student_id = ? ORDER BY due_date DESC LIMIT 3`,
              [st.student_id]
            );
            if (feeRows.length > 0) {
              feeSummary = feeRows.map(f => `Amount: $${f.amount} | Status: ${f.status} | Due: ${f.due_date ? String(f.due_date).substring(0, 10) : 'N/A'}`).join('\n');
            }
          } catch (e) {}

          // Today's Timetable
          let todaySchedule = 'No classes scheduled today';
          try {
            const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            const [timeRows] = await pool.query(
              `SELECT sub.name as subject_name, sub.code, t.start_time, t.end_time, t.room_number
               FROM timetable_entries t
               JOIN subjects sub ON t.subject_id = sub.id
               WHERE t.section_id = (SELECT section_id FROM students WHERE user_id = ?)
                 AND LOWER(t.day_of_week) = LOWER(?)`,
              [user.id, todayDay]
            );
            if (timeRows.length > 0) {
              todaySchedule = timeRows.map(t => `${t.code} - ${t.subject_name} (${t.start_time} - ${t.end_time}, Room: ${t.room_number || 'TBD'})`).join('\n');
            }
          } catch (e) {}

          liveErpData = `
STUDENT PROFILE:
- Full Name: ${st.full_name || user.username}
- Roll / Admission No: ${st.roll_number || st.admission_number || 'N/A'}
- Department: ${st.department_name || 'N/A'} | Semester: ${st.semester || 1} | Section: ${st.section || 'A'}
- CGPA: ${st.cgpa || 'N/A'}
- Overall Attendance: ${attendancePercentage}

TODAY'S SCHEDULE (${new Date().toLocaleDateString('en-US', { weekday: 'long' })}):
${todaySchedule}

FEE STATUS:
${feeSummary}
`;
        }
      } else if (user.role === 'Faculty' || user.role === 'HOD') {
        const [facRows] = await pool.query(
          `SELECT f.id as faculty_id, f.employee_id, f.name, d.name as department_name, f.designation
           FROM faculty f
           LEFT JOIN departments d ON f.department_id = d.id
           WHERE f.user_id = ?`,
          [user.id]
        );

        if (facRows.length > 0) {
          const fac = facRows[0];
          liveErpData = `
FACULTY PROFILE:
- Name: ${fac.name || user.username}
- Employee ID: ${fac.employee_id || 'N/A'}
- Department: ${fac.department_name || 'N/A'} | Designation: ${fac.designation || 'Faculty'}
`;
        }
      }
    } catch (err) {
      console.warn('[AI CONTEXT BUILD WARNING]:', err.message);
    }
  }

  // Fetch base campus rooms & navigation nodes
  let roomListStr = 'Main Block, Admin Block, Science Lab, Library, Auditorium';
  let navNodesStr = '';
  try {
    const [rooms] = await pool.query('SELECT room_number, room_name, department FROM campus_rooms WHERE status="Active" LIMIT 20');
    if (rooms.length > 0) {
      roomListStr = rooms.map(r => `${r.room_number} (${r.room_name || 'N/A'}) - Dept: ${r.department || 'General'}`).join(', ');
    }

    const [nodes] = await pool.query('SELECT id, node_name, related_room_number FROM campus_nav_nodes WHERE status="Active" LIMIT 20');
    if (nodes.length > 0) {
      navNodesStr = nodes.map(n => `Node ID: ${n.id} = ${n.node_name} (Room: ${n.related_room_number || 'N/A'})`).join(', ');
    }
  } catch (e) {}

  return `You are the official AI Campus Copilot for this College Management System (ERP).
Your goal is to assist students, faculty, and administrators with academic queries, timetables, attendance, fee status, and campus navigation.

AUTHENTICATED USER CONTEXT:
${userContext}
${liveErpData}

CAMPUS ROOMS & PLACES:
${roomListStr}
${navNodesStr ? `\nNAVIGATION NODES:\n${navNodesStr}` : ''}

CRITICAL RESPONSE GUIDELINES:
1. Provide accurate, professional, empathetic, and concise answers grounded in the user's ERP data above.
2. If the user asks about their own attendance, schedule, or fees, use the exact numbers provided in the AUTHENTICATED USER CONTEXT.
3. If the user asks for campus navigation or location of a room (e.g. "Where is Room 101?", "Take me to Library"), provide directions AND append a JSON action block at the very end of your response:
\`\`\`json
{ "action": "NAVIGATE", "destinationNodeId": "NODE_ID_OR_ROOM_NUMBER" }
\`\`\`
4. If the user asks about paying fees, append:
\`\`\`json
{ "action": "OPEN_FEE_PAYMENT" }
\`\`\`
5. Format your markdown cleanly with bullet points and bold text for easy reading.`;
};
