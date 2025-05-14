const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const logger = require('../config/logger');

/**
 * Registra un nuevo usuario
 * @route POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { email, password, name } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    // Crear nuevo usuario
    const user = new User({
      email,
      password,
      name,
    });

    await user.save();

    // Generar token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Inicia sesión de usuario
 * @route POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    logger.info('Intento de login:', { email: req.body.email });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Error de validación en login:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const user = await User.findOne({ email });
    logger.info('Búsqueda de usuario:', {
      email,
      encontrado: !!user,
      activo: user?.isActive,
      rol: user?.role,
    });

    if (!user || !user.isActive) {
      logger.warn('Usuario no encontrado o inactivo:', { email });
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    logger.info('Verificación de contraseña:', {
      email,
      contraseñaCorrecta: isMatch,
    });

    if (!isMatch) {
      logger.warn('Contraseña incorrecta:', { email });
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Generar token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    logger.info('Login exitoso:', {
      email,
      userId: user._id,
      role: user.role,
    });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    logger.error('Error en login:', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

module.exports = {
  register,
  login,
};
