const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  correo: { type: String, required: true, unique: true },
  contra: { type: String, required: true },
  telefono: { type: String, required: true },
  roluser: { type: String, required: true },
  tokenPermanente: [{ type: String }],
  adultos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Adulto' }],

  // 🔹 Nuevos campos para notificaciones
  suscrito: { type: Boolean, default: false },
  subscriptionToken: { type: Object, default: null }, // token del navegador para push notifications
  puedeRecibir: { type: Boolean, default: false } // admin decide si puede recibir notificaciones
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
