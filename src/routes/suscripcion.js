const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const Usuario = require('../models/Musuario');

// --------------------------------------------------
// 🔐 Claves VAPID actualizadas
// --------------------------------------------------
const publicVapidKey = "BGhTY0qmw7TjHShJlTZqLHe1kXDqdzYibbLbcPPFoViLaWLjQCWE8TyPIlZnBQGr4QlHuyxtELD3iuMmJ1iisHo";
const privateVapidKey = "O4qAsKlaRYOF1WavriLxigCItqqnJ8jxFB2TCGU6LBc";

// Configurar Web Push con las nuevas claves
webpush.setVapidDetails(
  'alejandro.martinez.22s@utzmg.edu.mx',
  publicVapidKey,
  privateVapidKey
);

// --------------------------------------------------
// 🔹 Guardar la suscripción del usuario
// --------------------------------------------------
router.post('/suscribir', async (req, res) => {
  const { usuario, subscription } = req.body;

  try {
    const user = await Usuario.findOneAndUpdate(
      { usuario },
      { suscrito: true, subscriptionToken: subscription },
      { new: true }
    );
    res.status(200).json({ ok: true, msg: 'Usuario suscrito correctamente', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, msg: 'Error al suscribirse' });
  }
});

// --------------------------------------------------
// 🔹 Mostrar todos los usuarios suscritos
// --------------------------------------------------
router.get('/suscripciones', async (req, res) => {
  try {
    const suscripciones = await Usuario.find({ suscrito: true });
    res.json(suscripciones);
  } catch (err) {
    res.status(500).json({ msg: 'Error al obtener suscripciones' });
  }
});

// --------------------------------------------------
// 🔹 Permitir o denegar notificaciones
// --------------------------------------------------
router.put('/suscripciones/:id/permitir', async (req, res) => {
  const { permitir } = req.body;
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { puedeRecibir: permitir },
      { new: true }
    );
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ msg: 'Error al actualizar permiso' });
  }
});

// --------------------------------------------------
// 🔹 Enviar notificación a un usuario específico
// --------------------------------------------------
router.post('/notificar/:id', async (req, res) => {
  const { titulo, mensaje } = req.body;

  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario || !usuario.puedeRecibir || !usuario.subscriptionToken) {
      return res.status(400).json({ msg: 'El usuario no puede recibir notificaciones' });
    }

    const payload = JSON.stringify({ title: titulo, body: mensaje });

    await webpush.sendNotification(usuario.subscriptionToken, payload);
    res.json({ ok: true, msg: 'Notificación enviada correctamente' });
  } catch (err) {
    console.error('❌ Error al enviar la notificación:', err);
    res.status(500).json({ msg: 'Error al enviar la notificación' });
  }
});

module.exports = router;
