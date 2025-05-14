const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  getUsers,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');

const router = express.Router();

// Rutas protegidas que requieren autenticación
router.use(authenticateToken);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', getProfile);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Actualiza el perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 */
router.put(
  '/me',
  [
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('email').optional().isEmail().withMessage('Ingrese un email válido').normalizeEmail(),
  ],
  updateProfile
);

// Rutas que requieren rol de administrador
router.use(isAdmin);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtiene todos los usuarios (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getUsers);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualiza un usuario (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               isActive:
 *                 type: boolean
 */
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('email').optional().isEmail().withMessage('Ingrese un email válido').normalizeEmail(),
    body('role').optional().isIn(['user', 'admin']).withMessage('Rol inválido'),
    body('isActive').optional().isBoolean().withMessage('isActive debe ser un booleano'),
  ],
  updateUser
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Elimina un usuario (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', deleteUser);

module.exports = router;
