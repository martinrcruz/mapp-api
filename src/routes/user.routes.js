const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, isAdmin } = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  getUsers,
  updateUser,
  deleteUser,
  changePassword,
  createUser,
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
 */
router.put(
  '/me',
  [body('name').optional().trim().notEmpty(), body('email').optional().isEmail().normalizeEmail()],
  updateProfile
);

/**
 * @swagger
 * /users/me/password:
 *   put:
 *     summary: Cambia la contraseña del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/me/password',
  [
    body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
  ],
  changePassword
);

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
 * /users:
 *   post:
 *     summary: Crea un nuevo usuario (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  isAdmin,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty(),
    body('role').optional().isIn(['user', 'admin']),
  ],
  createUser
);

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
 */
router.put(
  '/:id',
  isAdmin,
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['user', 'admin']),
    body('isActive').optional().isBoolean(),
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
