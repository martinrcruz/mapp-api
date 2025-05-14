const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const logger = require('./config/logger');
const loggerMiddleware = require('./middleware/logger.middleware');
const config = require('./config/env.config');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const locationRoutes = require('./routes/location.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// Log de configuración inicial
logger.info('Iniciando servidor con configuración:', {
  port: config.server.port,
  nodeEnv: config.server.nodeEnv,
  apiPrefix: config.api.prefix,
  allowedOrigins: config.cors.allowedOrigins
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: function(origin, callback) {
      // Permitir solicitudes sin origen (como las herramientas de API)
      if (!origin) return callback(null, true);
      
      if (config.cors.allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(loggerMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de middleware montado
logger.info('Middleware básico montado');

// Documentación API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
logger.info('Swagger UI montado en /api-docs');

// Rutas
const apiPrefix = config.api.prefix;
logger.info(`Montando rutas con prefijo: ${apiPrefix}`);

app.use(`${apiPrefix}/auth`, authRoutes);
logger.info(`Rutas de autenticación montadas en ${apiPrefix}/auth`);

app.use(`${apiPrefix}/locations`, locationRoutes);
logger.info(`Rutas de ubicaciones montadas en ${apiPrefix}/locations`);

app.use(`${apiPrefix}/users`, userRoutes);
logger.info(`Rutas de usuarios montadas en ${apiPrefix}/users`);

// Ruta de prueba
app.get(`${apiPrefix}/test`, (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});
logger.info(`Ruta de prueba montada en ${apiPrefix}/test`);

// Manejo de errores
app.use((err, req, res, _next) => {
  logger.error({
    message: 'Error interno del servidor',
    error: err.message,
    stack: config.server.nodeEnv === 'development' ? err.stack : undefined,
  });
  res.status(500).json({
    error: 'Error interno del servidor',
    details: config.server.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Conexión a MongoDB
async function connectDB() {
  try {
    await mongoose.connect(config.database.uri, config.database.options);
    logger.info('Conectado a MongoDB Atlas');

    mongoose.connection.on('error', err => {
      logger.error('Error en la conexión de MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Desconectado de MongoDB - Intentando reconectar...');
      setTimeout(connectDB, 5000);
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('Reconectado a MongoDB');
    });
  } catch (err) {
    logger.error('Error conectando a MongoDB:', err);
    setTimeout(connectDB, 5000);
  }
}

// Iniciar conexión a MongoDB
connectDB();

// Manejo de señales para cierre graceful
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('Conexión a MongoDB cerrada por terminación de la aplicación');
    process.exit(0);
  } catch (err) {
    logger.error('Error al cerrar la conexión de MongoDB:', err);
    process.exit(1);
  }
});

// Iniciar servidor
if (config.server.nodeEnv !== 'test') {
  app.listen(config.server.port, () => {
    logger.info(`Servidor corriendo en puerto ${config.server.port}`);
  });
}

module.exports = app;
