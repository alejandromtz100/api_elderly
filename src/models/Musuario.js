const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    usuario: { type: String, required: true, unique: true }, // Asegúrate de que sea único
    correo: { type: String, required: true, unique: true },
    contra: { type: String, required: true },
    telefono: { type: String, required: true },
    roluser: {type: String, required: true},
    tokenPermanente: [{ type: String }],
    adultos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Adulto' }]
});

module.exports = mongoose.model('Usuario', UsuarioSchema);