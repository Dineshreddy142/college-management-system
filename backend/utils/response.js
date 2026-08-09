export const successResponse = (res, message, data = {}, status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
        status
    });
};

export const errorResponse = (res, message, errors = [], status = 400, extra = {}) => {
    return res.status(status).json({
        success: false,
        message,
        errors,
        ...extra,
        data: extra,
        timestamp: new Date().toISOString(),
        status
    });
};

