const asyncHandler = (requestHandler) => (req, res, next) => {
    return Promise.resolve(requestHandler(req, res, next)).catch((error) => {
        console.error("Async error:", error);
        next(error);
       });
}

export default asyncHandler

