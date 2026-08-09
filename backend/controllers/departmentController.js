import pool from '../db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { departmentSchema } from '../validators/academicValidator.js';
import { DuplicateRecordException, EntityNotFoundException } from '../middlewares/errorHandler.js';

export const createDepartment = async (req, res, next) => {
    try {
        const validatedData = departmentSchema.parse(req.body);
        
        // Check duplicate
        const [existing] = await pool.execute('SELECT id FROM departments WHERE code = ?', [validatedData.code]);
        if (existing.length > 0) throw new DuplicateRecordException(`Department with code ${validatedData.code} already exists.`);

        const [result] = await pool.execute(
            'INSERT INTO departments (name, code) VALUES (?, ?)',
            [validatedData.name, validatedData.code]
        );
        
        return successResponse(res, 'Department created successfully', { id: result.insertId, ...validatedData }, 201);
    } catch (error) {
        next(error);
    }
};

export const getDepartments = async (req, res, next) => {
    try {
        const { search, limit = 10, page = 1, sort = 'name', order = 'ASC' } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM departments';
        let queryParams = [];

        if (search) {
            query += ' WHERE name LIKE ? OR code LIKE ?';
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        // Ordering (safely parameterized)
        const allowedSort = ['id', 'name', 'code'];
        const validSort = allowedSort.includes(sort) ? sort : 'name';
        const validOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        
        query += ` ORDER BY ${validSort} ${validOrder} LIMIT ? OFFSET ?`;
        
        // pool.execute expects all params in array, for LIMIT/OFFSET we can use cast strings if connection configured, 
        // but pool.query handles string interpolation better for LIMIT when mixed. Better to cast to numbers.
        queryParams.push(Number(limit), Number(offset));

        const [rows] = await pool.query(query, queryParams);
        
        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM departments';
        let countParams = [];
        if (search) {
            countQuery += ' WHERE name LIKE ? OR code LIKE ?';
            countParams.push(`%${search}%`, `%${search}%`);
        }
        const [countResult] = await pool.query(countQuery, countParams);

        return successResponse(res, 'Departments retrieved successfully', {
            departments: rows,
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

export const getDepartmentById = async (req, res, next) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM departments WHERE id = ?', [req.params.id]);
        if (rows.length === 0) throw new EntityNotFoundException(`Department not found with ID ${req.params.id}`);
        return successResponse(res, 'Department retrieved successfully', rows[0]);
    } catch (error) {
        next(error);
    }
};

export const updateDepartment = async (req, res, next) => {
    try {
        const validatedData = departmentSchema.parse(req.body);
        const { id } = req.params;

        const [existing] = await pool.execute('SELECT id FROM departments WHERE code = ? AND id != ?', [validatedData.code, id]);
        if (existing.length > 0) throw new DuplicateRecordException(`Another department with code ${validatedData.code} already exists.`);

        const [result] = await pool.execute(
            'UPDATE departments SET name = ?, code = ? WHERE id = ?',
            [validatedData.name, validatedData.code, id]
        );

        if (result.affectedRows === 0) throw new EntityNotFoundException(`Department not found with ID ${id}`);

        return successResponse(res, 'Department updated successfully', { id: Number(id), ...validatedData });
    } catch (error) {
        next(error);
    }
};

export const deleteDepartment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM departments WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) throw new EntityNotFoundException(`Department not found with ID ${id}`);
        
        return successResponse(res, 'Department deleted successfully');
    } catch (error) {
        next(error);
    }
};
