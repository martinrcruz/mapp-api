/* controllers/location.controller.js */
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Location = require('../models/location.model');
const logger = require('../config/logger');

/* ────────────────────────────────────────────────────────── */
/* Utilidades comunes                                        */
/* ────────────────────────────────────────────────────────── */

/**
 * Envía una respuesta 400 si el ID de Mongo no es válido
 */
function abortIfInvalidObjectId(id, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({
      success: false,
      message: 'ID inválido',
    });
    return true; // ← indica que ya se respondió
  }
  return false;
}

/**
 * Maneja CastError (_id) de Mongoose y lo transforma en 400
 */
function handleCastError(error, res, next) {
  if (error instanceof mongoose.Error.CastError && error.path === '_id') {
    return res.status(400).json({
      success: false,
      message: 'ID inválido',
    });
  }
  next(error); // ← deja que el middleware global lo maneje
}

/* ────────────────────────────────────────────────────────── */
/* GET /locations                                            */
/* ────────────────────────────────────────────────────────── */
const getLocations = async (req, res, next) => {
  try {
    logger.info('Iniciando consulta de ubicaciones');
    const { type, search, lat, lng, radius } = req.query;

    const query = { isActive: true };

    /* Filtro por tipo */
    if (type) query.type = type;

    /* Búsqueda por texto */
    if (search) query.$text = { $search: search };

    /* Búsqueda geoespacial */
    if (lat && lng && radius) {
      query.coordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius, 10) * 1000, // km → m
        },
      };
    }

    logger.debug('Consulta construida:', { query });

    const locations = await Location.find(query)
      .select(
        'name description type coordinates address contact createdBy isActive createdAt updatedAt'
      )
      .populate('createdBy', 'name email')
      .lean()
      .exec();

    logger.info(`Se encontraron ${locations.length} ubicaciones`);

    res.json({
      success: true,
      count: locations.length,
      data: locations,
    });
  } catch (error) {
    handleCastError(error, res, next);
  }
};

/* ────────────────────────────────────────────────────────── */
/* GET /locations/:id                                        */
/* ────────────────────────────────────────────────────────── */
const getLocation = async (req, res, next) => {
  try {
    if (abortIfInvalidObjectId(req.params.id, res)) return;

    const location = await Location.findById(req.params.id).populate('createdBy', 'name email');

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada',
      });
    }

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    handleCastError(error, res, next);
  }
};

/* ────────────────────────────────────────────────────────── */
/* POST /locations                                           */
/* ────────────────────────────────────────────────────────── */
const createLocation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const location = new Location({
      ...req.body,
      createdBy: req.user._id,
    });

    await location.save();

    res.status(201).json({
      success: true,
      message: 'Ubicación creada exitosamente',
      data: location,
    });
  } catch (error) {
    next(error);
  }
};

/* ────────────────────────────────────────────────────────── */
/* PUT /locations/:id                                        */
/* ────────────────────────────────────────────────────────── */
const updateLocation = async (req, res, next) => {
  try {
    if (abortIfInvalidObjectId(req.params.id, res)) return;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array(),
      });
    }

    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada',
      });
    }

    /* Verificación de permisos */
    if (location.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta ubicación',
      });
    }

    Object.assign(location, req.body);
    await location.save();

    res.json({
      success: true,
      message: 'Ubicación actualizada exitosamente',
      data: location,
    });
  } catch (error) {
    handleCastError(error, res, next);
  }
};

/* ────────────────────────────────────────────────────────── */
/* DELETE /locations/:id                                     */
/* ────────────────────────────────────────────────────────── */
const deleteLocation = async (req, res, next) => {
  try {
    if (abortIfInvalidObjectId(req.params.id, res)) return;

    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada',
      });
    }

    /* Verificación de permisos */
    if (location.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta ubicación',
      });
    }

    /* Soft delete */
    location.isActive = false;
    await location.save();

    res.json({
      success: true,
      message: 'Ubicación eliminada exitosamente',
    });
  } catch (error) {
    handleCastError(error, res, next);
  }
};

/* ────────────────────────────────────────────────────────── */
/* GET /locations/buscar                                     */
/* ────────────────────────────────────────────────────────── */
const searchLocations = async (req, res) => {
  try {
    const { texto } = req.query;
    logger.info('Iniciando búsqueda de ubicaciones:', texto);

    const query = {
      isActive: true,
      $or: [
        { name: { $regex: texto, $options: 'i' } },
        { 'address.street': { $regex: texto, $options: 'i' } },
        { 'address.city': { $regex: texto, $options: 'i' } },
        { 'address.state': { $regex: texto, $options: 'i' } },
        { 'address.country': { $regex: texto, $options: 'i' } }
      ]
    };

    const locations = await Location.find(query)
      .select('name description type coordinates address contact')
      .limit(10)
      .lean();

    logger.info(`Se encontraron ${locations.length} ubicaciones`);

    res.json({
      success: true,
      count: locations.length,
      data: locations
    });

  } catch (error) {
    logger.error('Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      error: 'Error al realizar la búsqueda'
    });
  }
};

/* ────────────────────────────────────────────────────────── */
/* Exporta todos los controladores                           */
/* ────────────────────────────────────────────────────────── */
module.exports = {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  searchLocations,
};
