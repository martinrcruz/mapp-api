const { validationResult } = require('express-validator');
const Location = require('../models/location.model');
const logger = require('../config/logger');

/**
 * Obtiene todas las ubicaciones
 * @route GET /locations
 */
const getLocations = async (req, res, next) => {
  try {
    logger.info('Iniciando consulta de ubicaciones');
    const { type, search, lat, lng, radius } = req.query;
    const query = { isActive: true };

    // Filtro por tipo
    if (type) {
      query.type = type;
    }

    // Búsqueda por texto
    if (search) {
      query.$text = { $search: search };
    }

    // Búsqueda geoespacial
    if (lat && lng && radius) {
      query.coordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius) * 1000, // Convertir km a metros
        },
      };
    }

    logger.debug('Ejecutando consulta de ubicaciones:', { query });

    // Optimizar la consulta
    const locations = await Location.find(query)
      .select(
        'name description type coordinates address contact createdBy isActive createdAt updatedAt'
      )
      .populate('createdBy', 'name email')
      .lean()
      .exec();

    logger.info(`Se encontraron ${locations.length} ubicaciones`);
    logger.debug('Ubicaciones encontradas:', locations);

    res.json({
      success: true,
      count: locations.length,
      data: locations,
    });
  } catch (error) {
    logger.error('Error al obtener ubicaciones:', {
      error: error.message,
      stack: error.stack,
    });

    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return res.status(504).json({
        success: false,
        error: 'Tiempo de espera agotado al consultar la base de datos',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    next(error);
  }
};

/**
 * Obtiene una ubicación por ID
 * @route GET /locations/:id
 */
const getLocation = async (req, res, next) => {
  try {
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
    next(error);
  }
};

/**
 * Crea una nueva ubicación
 * @route POST /locations
 */
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

/**
 * Actualiza una ubicación
 * @route PUT /locations/:id
 */
const updateLocation = async (req, res, next) => {
  try {
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

    // Verificar permisos
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
    next(error);
  }
};

/**
 * Elimina una ubicación
 * @route DELETE /locations/:id
 */
const deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada',
      });
    }

    // Verificar permisos
    if (location.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta ubicación',
      });
    }

    // Soft delete
    location.isActive = false;
    await location.save();

    res.json({
      success: true,
      message: 'Ubicación eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

const searchLocations = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Se requiere un término de búsqueda' });
    }

    const searchQuery = {
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { 'address.street': { $regex: q, $options: 'i' } },
            { 'address.city': { $regex: q, $options: 'i' } },
            { 'address.state': { $regex: q, $options: 'i' } },
            { 'address.country': { $regex: q, $options: 'i' } },
            { type: { $regex: q, $options: 'i' } },
          ],
        },
      ],
    };

    const locations = await Location.find(searchQuery)
      .populate('createdBy', 'name email')
      .limit(10);

    res.json(locations);
  } catch (error) {
    console.error('Error en búsqueda de ubicaciones:', error);
    res.status(500).json({ message: 'Error al buscar ubicaciones' });
  }
};

module.exports = {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  searchLocations,
};
