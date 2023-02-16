let msg = {
    error: (message) => {
        return {
            code: 0,
            message: message || "unKnown error",
            data: null
        }

    },
    success: (data = {}, message = '') => {
        return {
            code: 200,
            message: message || "success",
            data: data
        }
    }
};
module.exports = msg;