const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'El nombre de empresa es requerido'],
      trim: true,
      index: true,
    },
    comercialName: {
      type: String,
      required: [true, 'El nombre comercial es requerido'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    activity: {
      type: String,
      index: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Las coordenadas son requeridas'],
        validate: {
          validator: function (v) {
            return (
              v.length === 2 &&
              v[0] >= -180 &&
              v[0] <= 180 && // longitude
              v[1] >= -90 &&
              v[1] <= 90
            ); // latitude
          },
          message: 'Coordenadas inválidas',
        },
      },
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    municipality: {
      type: String,
      index: true,
    },
    cif: {
      type: String,
      index: true,
    },
    cnae: {
      type: String,
      index: true,
    },
    contact: {
      phone: String,
      email: String,
      website: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    // Optimizar consultas
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices compuestos
locationSchema.index({
  name: 'text',
  'address.street': 'text',
  'address.city': 'text',
  'address.state': 'text',
  'address.country': 'text',
});
locationSchema.index({ coordinates: '2dsphere' });
locationSchema.index({ type: 1, isActive: 1 });
locationSchema.index({ createdAt: -1 });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
