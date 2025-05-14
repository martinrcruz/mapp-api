const mongoose = require('mongoose');
const config = require('./config/env.config');

console.log('Intentando conectar a MongoDB...');
console.log('URI:', config.database.uri);
console.log('Opciones:', JSON.stringify(config.database.options, null, 2));

mongoose
  .connect(config.database.uri, {
    ...config.database.options,
    serverSelectionTimeoutMS: 30000, // Aumentado a 30 segundos para la prueba
  })
  .then(() => {
    console.log('¡Conexión exitosa a MongoDB!');
    console.log('Estado de la conexión:', mongoose.connection.readyState);
    return mongoose.connection.db.admin().ping();
  })
  .then(() => {
    console.log('Ping a la base de datos exitoso');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error de conexión:', err);
    process.exit(1);
  }); 