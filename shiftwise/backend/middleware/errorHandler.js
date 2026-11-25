const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid resource identifier" });
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    return res.status(409).json({ message: `Duplicate value for ${field}` });
  }

  const status = error.status || (error.name === "ValidationError" ? 422 : 500);
  res.status(status).json({
    message: status === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message,
  });
};

module.exports = { notFound, errorHandler };
