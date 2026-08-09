import { z } from 'zod';

export const departmentSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
    code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code must not exceed 20 characters'),
});

export const courseSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
    department_id: z.number().int().positive('Department ID must be a positive integer'),
    duration_years: z.number().int().positive('Duration must be a positive integer'),
});

export const semesterSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    academic_year_id: z.number().int().positive('Academic Year ID must be a positive integer'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
});
