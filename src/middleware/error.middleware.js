/**
 * Middleware para manejo centralizado de errores
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors,
    });
  }

  // Error de duplicado de Mongoose
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'El registro ya existe',
      field: Object.keys(err.keyPattern)[0],
    });
  }

  // Error de validación de express-validator
  if (err.array) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.array().map((error) => error.msg),
    });
  }

  // Error personalizado con status
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  // Error por defecto
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};

module.exports = {
  errorHandler,
};
