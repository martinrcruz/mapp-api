const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env.config');
const User = require('../models/user.model');
const Location = require('../models/location.model');
const logger = require('../config/logger');

const adminUser = {
  email: 'admin@mapp.com',
  password: 'Admin123!',
  name: 'Administrador',
  role: 'admin',
  isActive: true,
};

const sampleLocations = [
  {
    name: 'Sky Costanera',
    description: 'El mirador más alto de Sudamérica, ubicado en el Gran Torre Santiago',
    type: 'other',
    coordinates: {
      type: 'Point',
      coordinates: [-70.6082, -33.4169]
    },
    address: {
      street: 'Av. Andrés Bello 2425',
      city: 'Santiago',
      state: 'Región Metropolitana',
      country: 'Chile',
      postalCode: '7510689'
    },
    contact: {
      phone: '+56 2 2916 9200',
      email: 'info@skycostanera.cl',
      website: 'https://www.skycostanera.cl'
    }
  },
  {
    name: 'Restaurant Giratorio',
    description: 'Restaurante con vista panorámica de 360° en el piso 16',
    type: 'restaurant',
    coordinates: {
      type: 'Point',
      coordinates: [-70.6475, -33.4189]
    },
    address: {
      street: 'Av. Libertador Bernardo O\'Higgins 3490',
      city: 'Santiago',
      state: 'Región Metropolitana',
      country: 'Chile',
      postalCode: '8320000'
    },
    contact: {
      phone: '+56 2 2573 8740',
      email: 'reservas@restaurantgiratorio.cl',
      website: 'https://www.restaurantgiratorio.cl'
    }
  },
  {
    name: 'Hotel W Santiago',
    description: 'Hotel de lujo con spa y restaurantes de primera clase',
    type: 'hotel',
    coordinates: {
      type: 'Point',
      coordinates: [-70.6076, -33.4169]
    },
    address: {
      street: 'Isidora Goyenechea 3000',
      city: 'Santiago',
      state: 'Región Metropolitana',
      country: 'Chile',
      postalCode: '7550653'
    },
    contact: {
      phone: '+56 2 2770 0000',
      email: 'reservations.santiago@whotels.com',
      website: 'https://www.marriott.com/hotels/travel/sclwh-w-santiago'
    }
  },
  {
    name: 'Patio Bellavista',
    description: 'Centro gastronómico y cultural con tiendas y restaurantes',
    type: 'shop',
    coordinates: {
      type: 'Point',
      coordinates: [-70.6352, -33.4336]
    },
    address: {
      street: 'Pío Nono 73',
      city: 'Santiago',
      state: 'Región Metropolitana',
      country: 'Chile',
      postalCode: '7500000'
    },
    contact: {
      phone: '+56 2 2236 0000',
      email: 'contacto@patiobellavista.cl',
      website: 'https://www.patiobellavista.cl'
    }
  },
  {
    name: 'Mercado Central',
    description: 'Mercado histórico con los mejores mariscos y pescados de Santiago',
    type: 'restaurant',
    coordinates: {
      type: 'Point',
      coordinates: [-70.6503, -33.4338]
    },
    address: {
      street: 'San Pablo 967',
      city: 'Santiago',
      state: 'Región Metropolitana',
      country: 'Chile',
      postalCode: '8320000'
    },
    contact: {
      phone: '+56 2 2428 1522',
      email: 'info@mercadocentral.cl',
      website: 'https://www.mercadocentral.cl'
    }
  },
  {
    name: 'Mall Parque Arauco',
    description: 'Centro comercial de lujo con las mejores marcas internacionales',
    type: 'shop',
    coordinates: {
      type: 'Point',
      coordinates: [-70.5514, -33.4022]
    },
    address: {
      street: 'Av. Presidente Kennedy 5413',
      city: 'Santiago',
      state: 'Región Metropolitana',
      country: 'Chile',
      postalCode: '7560994'
    },
    contact: {
      phone: '+56 2 2299 0000',
      email: 'contacto@parquearauco.cl',
      website: 'https://www.parquearauco.cl'
    }
  },
  {
    name: 'Hotel Ritz-Carlton Santiago',
    description: 'Hotel de lujo en el corazón del distrito financiero',
    type: 'hotel',
    coordinates: {
      type: 'Point',
      coordinates: [-70.6007, -33.4141]
    },
    address: {
      street: 'Calle El Alcalde 15',
      city: 'Santiago',
      state: 'Región Metropolitana',
      country: 'Chile',
      postalCode: '7550130'
    },
    contact: {
      phone: '+56 2 2470 8500',
      email: 'santiago@ritzcarlton.com',
      website: 'https://www.ritzcarlton.com/santiago'
    }
  },
  {
    name: 'Restaurante Boragó',
    description: 'Restaurante de alta cocina chilena contemporánea',
    type: 'restaurant',
    coordinates: {
      type: 'Point',
      coordinates: [-70.5980, -33.3839]
    },
    address: {
      street: 'Av. San Josemaría Escrivá de Balaguer 5970',
      city: 'Santiago',
      state: 'Región Metropolitana',
      country: 'Chile',
      postalCode: '7580384'
    },
    contact: {
      phone: '+56 2 2953 8893',
      email: 'reservas@borago.cl',
      website: 'https://www.borago.cl'
    }
  },
  {
    name: 'Costanera Center',
    description: 'El centro comercial más grande de Sudamérica',
    type: 'shop',
    coordinates: {
      type: 'Point',
      coordinates: [-70.6067, -33.4172]
    },
    address: {
      street: 'Av. Andrés Bello 2425',
      city: 'Santiago',
      state: 'Región Metropolitana',
      country: 'Chile',
      postalCode: '7510689'
    },
    contact: {
      phone: '+56 2 2916 9200',
      email: 'info@costaneracenter.cl',
      website: 'https://www.costaneracenter.cl'
    }
  },
  {
    name: 'Hotel Boutique Castillo Rojo',
    description: 'Hotel boutique en un edificio histórico de Bellavista',
    type: 'hotel',
    coordinates: {
      type: 'Point',
      coordinates: [-70.6352, -33.4327]
    },
    address: {
      street: 'Constitución 195',
      city: 'Santiago',
      state: 'Región Metropolitana',
      country: 'Chile',
      postalCode: '7500000'
    },
    contact: {
      phone: '+56 2 2352 4000',
      email: 'reservas@castillorojohotel.com',
      website: 'https://www.castillorojohotel.com'
    }
  }
];

async function seed() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(config.database.uri, config.database.options);
    logger.info('Conectado a MongoDB');

    // Crear usuario admin
    const existingAdmin = await User.findOne({ email: adminUser.email });
    logger.info('Buscando usuario admin existente:', { exists: !!existingAdmin });
    
    if (!existingAdmin) {
      logger.info('Creando nuevo usuario admin');
      // Crear una nueva instancia del modelo User para aprovechar el middleware de hash
      const newAdmin = new User(adminUser);
      await newAdmin.save();
      logger.info('Usuario administrador creado exitosamente');
    } else {
      logger.info('Actualizando contraseña del usuario admin existente');
      existingAdmin.password = adminUser.password; // Esto activará el middleware de hash
      await existingAdmin.save();
      logger.info('Contraseña del usuario admin actualizada exitosamente');
    }

    // Obtener el ID del admin para las ubicaciones
    const admin = await User.findOne({ email: adminUser.email });
    if (!admin) {
      throw new Error('No se pudo encontrar el usuario admin después de crearlo/actualizarlo');
    }

    logger.info('Usuario admin verificado:', {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive
    });

    // Crear ubicaciones
    for (const location of sampleLocations) {
      const existingLocation = await Location.findOne({
        name: location.name,
        'coordinates.coordinates': location.coordinates.coordinates,
      });

      if (!existingLocation) {
        const newLocation = new Location({
          ...location,
          createdBy: admin._id,
          isActive: true,
        });
        await newLocation.save();
        logger.info('Ubicación creada:', { name: location.name });
      }
    }

    logger.info('Proceso de seed completado exitosamente');
    process.exit(0);
  } catch (error) {
    logger.error('Error durante el proceso de seed:', error);
    process.exit(1);
  }
}

seed(); 