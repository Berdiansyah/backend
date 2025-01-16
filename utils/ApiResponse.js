class ApiResponse {
    constructor(success, message, statusCode, data = null) {
        this.success = success;
        this.message = message;
        this.status_code = statusCode;
        if (data) this.data = data;
    }

    static success(message, statusCode = 200, data = null) {
        return new ApiResponse(true, message, statusCode, data);
    }

    static error(message, statusCode = 400, data = null) {
        return new ApiResponse(false, message, statusCode, data);
    }
}
module.exports = ApiResponse