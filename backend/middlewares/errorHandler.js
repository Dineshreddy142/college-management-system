import { errorResponse } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.url}:`, err);

    if (err.name === 'ZodError') {
        const errors = (err.errors || err.issues).map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));
        return errorResponse(res, 'Validation failed.', errors, 400);
    }

    if (err.name === 'EntityNotFoundException') {
        return errorResponse(res, err.message, [], 404);
    }

    if (err.name === 'DuplicateRecordException') {
        return errorResponse(res, err.message, [], 409);
    }

    if (err.name === 'AccessDeniedException') {
        return errorResponse(res, err.message, [], 403);
    }
    
    if (err.code === 'ER_DUP_ENTRY') {
        return errorResponse(res, 'Database error: Duplicate entry.', [], 409);
    }

    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        return errorResponse(res, 'Database error: Cannot delete record because it is referenced elsewhere.', [], 409);
    }

    if (err.type === 'entity.too.large' || err.status === 413) {
        return errorResponse(res, 'Request payload too large. Maximum size is 10 MB.', [], 413, { code: 'PAYLOAD_TOO_LARGE' });
    }

    // Fallback for general server errors
    const statusCode = err.status || err.statusCode || 500;
    return errorResponse(res, err.message || 'Internal Server Error', [err.message], statusCode, { code: err.code || 'SERVER_ERROR' });
};

// Custom error classes to throw from controllers/services
export class EntityNotFoundException extends Error {
    constructor(message) {
        super(message);
        this.name = 'EntityNotFoundException';
    }
}

export class DuplicateRecordException extends Error {
    constructor(message) {
        super(message);
        this.name = 'DuplicateRecordException';
    }
}

export class AccessDeniedException extends Error {
    constructor(message) {
        super(message);
        this.name = 'AccessDeniedException';
    }
}
