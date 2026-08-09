import pool from '../db.js';
import { successResponse } from '../utils/response.js';
import { courseSchema } from '../validators/academicValidator.js';
import { DuplicateRecordException, EntityNotFoundException } from '../middlewares/errorHandler.js';

export const createCourse = async (req, res, next) => {
    try {
        const validatedData = courseSchema.parse(req.body);
        
        // Ensure department exists
        const [dep] = await pool.execute('SELECT id FROM departments WHERE id = ?', [validatedData.department_id]);
        if (dep.length === 0) throw new EntityNotFoundException('Department not found');

        const [existing] = await pool.execute(
            'SELECT id FROM courses WHERE name = ? AND department_id = ?', 
            [validatedData.name, validatedData.department_id]
        );
        if (existing.length > 0) throw new DuplicateRecordException(`Course ${validatedData.name} already exists in this department.`);

        const [result] = await pool.execute(
            'INSERT INTO courses (name, department_id, duration_years) VALUES (?, ?, ?)',
            [validatedData.name, validatedData.department_id, validatedData.duration_years]
        );
        
        return successResponse(res, 'Course created successfully', { id: result.insertId, ...validatedData }, 201);
    } catch (error) {
        next(error);
    }
};

export const getCourses = async (req, res, next) => {
    try {
        const { search, department_id, limit = 10, page = 1 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT c.*, d.name as department_name, d.code as department_code 
            FROM courses c 
            JOIN departments d ON c.department_id = d.id 
            WHERE 1=1
        `;
        let queryParams = [];

        if (search) {
            query += ' AND c.name LIKE ?';
            queryParams.push(`%${search}%`);
        }
        if (department_id) {
            query += ' AND c.department_id = ?';
            queryParams.push(department_id);
        }
        
        query += ' ORDER BY c.name ASC LIMIT ? OFFSET ?';
        queryParams.push(Number(limit), Number(offset));

        const [rows] = await pool.query(query, queryParams);
        
        let countQuery = 'SELECT COUNT(*) as total FROM courses c WHERE 1=1';
        let countParams = [];
        if (search) {
            countQuery += ' AND c.name LIKE ?';
            countParams.push(`%${search}%`);
        }
        if (department_id) {
            countQuery += ' AND c.department_id = ?';
            countParams.push(department_id);
        }
        const [countResult] = await pool.query(countQuery, countParams);

        return successResponse(res, 'Courses retrieved successfully', {
            courses: rows,
            pagination: {
                total: countResult[0].total,
                page: Number(page),
                limit: Number(limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const updateCourse = async (req, res, next) => {
    try {
        const validatedData = courseSchema.parse(req.body);
        const { id } = req.params;

        const [result] = await pool.execute(
            'UPDATE courses SET name = ?, department_id = ?, duration_years = ? WHERE id = ?',
            [validatedData.name, validatedData.department_id, validatedData.duration_years, id]
        );

        if (result.affectedRows === 0) throw new EntityNotFoundException(`Course not found with ID ${id}`);

        return successResponse(res, 'Course updated successfully', { id: Number(id), ...validatedData });
    } catch (error) {
        next(error);
    }
};

export const deleteCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) throw new EntityNotFoundException(`Course not found with ID ${id}`);
        
        return successResponse(res, 'Course deleted successfully');
    } catch (error) {
        next(error);
    }
};
