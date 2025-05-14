const mongoose = require('mongoose');
const config = require('./config/env.config');
const Location = require('./models/location.model');

async function testLocationsQuery() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('Conexión exitosa');

    console.log('Ejecutando consulta de ubicaciones...');
    const locations = await Location.find({ isActive: true })
      .select('name description type coordinates address contact createdBy isActive createdAt updatedAt')
      .lean()
      .exec();

    console.log('Número de ubicaciones encontradas:', locations.length);
    console.log('Ubicaciones:', JSON.stringify(locations, null, 2));

    await mongoose.disconnect();
    console.log('Desconexión exitosa');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLocationsQuery(); 