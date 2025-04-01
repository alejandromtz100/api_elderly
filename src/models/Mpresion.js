const mongoose = require('mongoose');

const PresionSchema = new mongoose.Schema({
    adulto: { type: mongoose.Schema.Types.ObjectId, ref: 'Adulto', required: true },
    fecha: { type: Date, default: Date.now },
    nivel_pres: { type: Number, required: true }
});

PresionSchema.index({ adulto: 1, nivel_pres: 1 });

module.exports = mongoose.model('Presion', PresionSchema);
