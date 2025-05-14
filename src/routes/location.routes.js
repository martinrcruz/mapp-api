const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth.middleware');
const {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  searchLocations,
} = require('../controllers/location.controller');

const router = express.Router();

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: Obtiene todas las ubicaciones
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [restaurant, hotel, shop, other]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           description: Radio en kilómetros
 */
router.get('/', getLocations);

/**
 * @swagger
 * /locations/{id}:
 *   get:
 *     summary: Obtiene una ubicación por ID
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', getLocation);

/**
 * @swagger
 * /locations/search:
 *   get:
 *     summary: Busca ubicaciones
 *     tags: [Locations]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           description: Radio en kilómetros
 */
router.get('/search', searchLocations);

// Rutas protegidas que requieren autenticación
router.use(authenticateToken);

/**
 * @swagger
 * /locations:
 *   post:
 *     summary: Crea una nueva ubicación
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - coordinates
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [restaurant, hotel, shop, other]
 *               coordinates:
 *                 type: object
 *                 required:
 *                   - coordinates
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     minItems: 2
 *                     maxItems: 2
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *               contact:
 *                 type: object
 *                 properties:
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                   website:
 *                     type: string
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('description').optional().trim(),
    body('type')
      .optional()
      .isIn(['restaurant', 'hotel', 'shop', 'other'])
      .withMessage('Tipo inválido'),
    body('coordinates.coordinates')
      .isArray()
      .withMessage('Las coordenadas deben ser un array')
      .custom((value) => {
        if (value.length !== 2) {
          throw new Error('Las coordenadas deben ser [longitud, latitud]');
        }
        const [lng, lat] = value;
        if (
          typeof lng !== 'number' ||
          typeof lat !== 'number' ||
          lng < -180 ||
          lng > 180 ||
          lat < -90 ||
          lat > 90
        ) {
          throw new Error('Coordenadas inválidas');
        }
        return true;
      }),
    body('address.street').optional().trim(),
    body('address.city').optional().trim(),
    body('address.state').optional().trim(),
    body('address.country').optional().trim(),
    body('address.postalCode').optional().trim(),
    body('contact.phone').optional().trim(),
    body('contact.email')
      .optional()
      .isEmail()
      .withMessage('Email de contacto inválido')
      .normalizeEmail(),
    body('contact.website').optional().trim().isURL().withMessage('URL de sitio web inválida'),
  ],
  createLocation
);

/**
 * @swagger
 * /locations/{id}:
 *   put:
 *     summary: Actualiza una ubicación
 *     tags: [Locations]
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
 *             $ref: '#/components/schemas/Location'
 */
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('description').optional().trim(),
    body('type')
      .optional()
      .isIn(['restaurant', 'hotel', 'shop', 'other'])
      .withMessage('Tipo inválido'),
    body('coordinates.coordinates')
      .optional()
      .isArray()
      .withMessage('Las coordenadas deben ser un array')
      .custom((value) => {
        if (value.length !== 2) {
          throw new Error('Las coordenadas deben ser [longitud, latitud]');
        }
        const [lng, lat] = value;
        if (
          typeof lng !== 'number' ||
          typeof lat !== 'number' ||
          lng < -180 ||
          lng > 180 ||
          lat < -90 ||
          lat > 90
        ) {
          throw new Error('Coordenadas inválidas');
        }
        return true;
      }),
    body('address.street').optional().trim(),
    body('address.city').optional().trim(),
    body('address.state').optional().trim(),
    body('address.country').optional().trim(),
    body('address.postalCode').optional().trim(),
    body('contact.phone').optional().trim(),
    body('contact.email')
      .optional()
      .isEmail()
      .withMessage('Email de contacto inválido')
      .normalizeEmail(),
    body('contact.website').optional().trim().isURL().withMessage('URL de sitio web inválida'),
  ],
  updateLocation
);

/**
 * @swagger
 * /locations/{id}:
 *   delete:
 *     summary: Elimina una ubicación
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', deleteLocation);

module.exports = router;
