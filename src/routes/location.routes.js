/* routes/location.routes.js */
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  searchLocations,
} = require('../controllers/location.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

/* ─────────── Helpers ─────────── */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array(),
    });
  }
  next();
};

const validateMongoId = param('id')
  .custom((value) => mongoose.Types.ObjectId.isValid(value))
  .withMessage('ID inválido');

/* ─────────── Rutas ─────────── */

// Rutas principales sin parámetros
router.get('/', getLocations);

// Ruta de búsqueda (con patrón específico para evitar conflictos)
router.get(
  '/buscar',
  [
    query('texto').trim().notEmpty().withMessage('El término de búsqueda es requerido'),
    handleValidationErrors,
  ],
  searchLocations
);

router.post(
  '/',
  authenticateToken,
  [
    body('companyName').trim().notEmpty().withMessage('El nombre de empresa es requerido'),
    body('comercialName').trim().notEmpty().withMessage('El nombre comercial es requerido'),
    body('activity').trim().notEmpty().withMessage('La actividad es requerida'),
    body('coordinates')
      .isObject()
      .withMessage('Las coordenadas son requeridas')
      .custom((coords) => {
        if (!coords || !coords.coordinates || !Array.isArray(coords.coordinates)) {
          throw new Error('Coordenadas inválidas');
        }
        const [lng, lat] = coords.coordinates;
        if (
          typeof lng !== 'number' ||
          typeof lat !== 'number' ||
          lng < -180 ||
          lng > 180 ||
          lat < -90 ||
          lat > 90
        )
          throw new Error('Coordenadas inválidas');
        return true;
      }),
    body('address.*').optional().trim(),
    body('municipality').trim().notEmpty().withMessage('La municipio es requerida'),
    body('contact.email')
      .optional()
      .isEmail()
      .withMessage('Email de contacto inválido')
      .normalizeEmail(),
    handleValidationErrors,
  ],
  createLocation
);

// Rutas que requieren ID
router.get('/:id([0-9a-fA-F]{24})', [validateMongoId, handleValidationErrors], getLocation);
router.put(
  '/:id([0-9a-fA-F]{24})',
  [validateMongoId, handleValidationErrors, authenticateToken],
  updateLocation
);
router.delete(
  '/:id([0-9a-fA-F]{24})',
  [validateMongoId, handleValidationErrors, authenticateToken],
  deleteLocation
);

module.exports = router;
