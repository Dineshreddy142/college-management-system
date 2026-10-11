import pool from '../db.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getSections = async (req, res, next) => {
  try {
    const { department_id, course_id, semester_id, search, limit = 100, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT sec.*, 
             d.name as department_name, 
             c.name as course_name, 
             sem.name as semester_name
      FROM sections sec
      LEFT JOIN departments d ON sec.department_id = d.id
      LEFT JOIN courses c ON sec.course_id = c.id
      LEFT JOIN semesters sem ON sec.semester_id = sem.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (sec.name LIKE ? OR d.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (department_id && department_id !== 'all') {
      query += ' AND sec.department_id = ?';
      params.push(department_id);
    }
    if (course_id && course_id !== 'all') {
      query += ' AND sec.course_id = ?';
      params.push(course_id);
    }
    if (semester_id && semester_id !== 'all') {
      query += ' AND sec.semester_id = ?';
      params.push(semester_id);
    }

    query += ' ORDER BY sec.name ASC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: 'Sections retrieved successfully',
      data: rows,
      sections: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    next(error);
  }
};

export const getSectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM sections WHERE id = ?', [id]);
    if (rows.length === 0) {
      return errorResponse(res, 'Section not found', [], 404);
    }
    return successResponse(res, 'Section retrieved successfully', rows[0]);
  } catch (error) {
    next(error);
  }
};

export const createSection = async (req, res, next) => {
  try {
    const { name, department_id, course_id, academic_year_id, semester_id, capacity = 60 } = req.body;
    if (!name) {
      return errorResponse(res, 'Section name is required', [], 400);
    }

    const [result] = await pool.query(
      'INSERT INTO sections (name, department_id, course_id, academic_year_id, semester_id, capacity) VALUES (?, ?, ?, ?, ?, ?)',
      [name, department_id || null, course_id || null, academic_year_id || null, semester_id || null, capacity]
    );

    return successResponse(res, 'Section created successfully', { id: result.insertId, name, capacity }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, department_id, course_id, academic_year_id, semester_id, capacity } = req.body;

    await pool.query(
      'UPDATE sections SET name = COALESCE(?, name), department_id = COALESCE(?, department_id), course_id = COALESCE(?, course_id), academic_year_id = COALESCE(?, academic_year_id), semester_id = COALESCE(?, semester_id), capacity = COALESCE(?, capacity) WHERE id = ?',
      [name, department_id, course_id, academic_year_id, semester_id, capacity, id]
    );

    return successResponse(res, 'Section updated successfully', { id, name });
  } catch (error) {
    next(error);
  }
};

export const deleteSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sections WHERE id = ?', [id]);
    return successResponse(res, 'Section deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};
