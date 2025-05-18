const { validationResult } = require('express-validator');
const User = require('../models/user.model');

/**
 * Obtiene el perfil del usuario autenticado
 * @route GET /users/me
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza el perfil del usuario autenticado
 * @route PUT /users/me
 */
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene todos los usuarios (solo admin)
 * @route GET /users
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea un nuevo usuario (solo admin)
 * @route POST /users
 */
const createUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const user = new User(req.body);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza un usuario (solo admin)
 * @route PUT /users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const { name, email, role, isActive } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina un usuario (solo admin)
 * @route DELETE /users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

// controllers/user.controller.js  ➜ nuevo endpoint cambio de contraseña
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Contraseña actual incorrecta' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
};
