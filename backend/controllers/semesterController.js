import pool from '../db.js';
import { successResponse } from '../utils/response.js';
import { semesterSchema } from '../validators/academicValidator.js';
import { DuplicateRecordException, EntityNotFoundException } from '../middlewares/errorHandler.js';

export const createSemester = async (req, res, next) => {
    try {
        const validatedData = semesterSchema.parse(req.body);
        
        // Ensure Academic Year exists
        const [ay] = await pool.execute('SELECT id FROM academic_years WHERE id = ?', [validatedData.academic_year_id]);
        if (ay.length === 0) throw new EntityNotFoundException('Academic Year not found');

        const [existing] = await pool.execute(
            'SELECT id FROM semesters WHERE name = ? AND academic_year_id = ?', 
            [validatedData.name, validatedData.academic_year_id]
        );
        if (existing.length > 0) throw new DuplicateRecordException(`Semester ${validatedData.name} already exists in this Academic Year.`);

        const [result] = await pool.execute(
            'INSERT INTO semesters (name, academic_year_id, start_date, end_date) VALUES (?, ?, ?, ?)',
            [validatedData.name, validatedData.academic_year_id, validatedData.start_date, validatedData.end_date]
        );
        
        return successResponse(res, 'Semester created successfully', { id: result.insertId, ...validatedData }, 201);
    } catch (error) {
        next(error);
    }
};

export const getSemesters = async (req, res, next) => {
    try {
        const { search, academic_year_id, limit = 10, page = 1 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT s.*, ay.name as academic_year_name 
            FROM semesters s 
            JOIN academic_years ay ON s.academic_year_id = ay.id 
            WHERE 1=1
        `;
        let queryParams = [];

        if (search) {
            query += ' AND s.name LIKE ?';
            queryParams.push(`%${search}%`);
        }
        if (academic_year_id) {
            query += ' AND s.academic_year_id = ?';
            queryParams.push(academic_year_id);
        }
        
        query += ' ORDER BY s.start_date ASC LIMIT ? OFFSET ?';
        queryParams.push(Number(limit), Number(offset));

        const [rows] = await pool.query(query, queryParams);
        
        let countQuery = 'SELECT COUNT(*) as total FROM semesters s WHERE 1=1';
        let countParams = [];
        if (search) {
            countQuery += ' AND s.name LIKE ?';
            countParams.push(`%${search}%`);
        }
        if (academic_year_id) {
            countQuery += ' AND s.academic_year_id = ?';
            countParams.push(academic_year_id);
        }
        const [countResult] = await pool.query(countQuery, countParams);

        return successResponse(res, 'Semesters retrieved successfully', {
            semesters: rows,
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

export const updateSemester = async (req, res, next) => {
    try {
        const validatedData = semesterSchema.parse(req.body);
        const { id } = req.params;

        const [result] = await pool.execute(
            'UPDATE semesters SET name = ?, academic_year_id = ?, start_date = ?, end_date = ? WHERE id = ?',
            [validatedData.name, validatedData.academic_year_id, validatedData.start_date, validatedData.end_date, id]
        );

        if (result.affectedRows === 0) throw new EntityNotFoundException(`Semester not found with ID ${id}`);

        return successResponse(res, 'Semester updated successfully', { id: Number(id), ...validatedData });
    } catch (error) {
        next(error);
    }
};

export const deleteSemester = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM semesters WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) throw new EntityNotFoundException(`Semester not found with ID ${id}`);
        
        return successResponse(res, 'Semester deleted successfully');
    } catch (error) {
        next(error);
    }
};
