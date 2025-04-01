const express = require("express");
const router = express.Router();
const Adulto = require("../models/Madulto");
const User = require("../models/Musuario"); 


// Ruta de registro
router.post('/registrar-adulto', async (req, res) => {
    try {
        // Extraer los datos del cuerpo de la solicitud
        const { nombre, edad, lim_presion, lim_tiempo_cuarto, usuario } = req.body;

        // Validar que todos los campos requeridos estén presentes
        if (!nombre || !edad || !lim_presion || !lim_tiempo_cuarto || !usuario) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: nombre, edad, lim_presion, lim_tiempo_cuarto, usuario'
            });
        }

        // Verificar si ya existe un adulto con el mismo nombre (debido al índice único)
        const adultoExistente = await Adulto.findOne({ nombre });
        if (adultoExistente) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un adulto registrado con este nombre'
            });
        }

        // Crear un nuevo adulto
        const nuevoAdulto = new Adulto({
            nombre,
            edad,
            lim_presion: lim_presion,
            lim_tiempo_cuarto,
            usuario
        });

        // Guardar en la base de datos
        await nuevoAdulto.save();

        // Responder con éxito
        res.status(201).json({
            success: true,
            message: 'Adulto registrado exitosamente',
            data: nuevoAdulto
        });

    } catch (error) {
        console.error('Error al registrar adulto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al registrar adulto',
            error: error.message
        });
    }
});


//ruta para obtener adultos
router.get('/adultos', async (req, res) => {
    try {
        // Buscar todos los registros de adultos en la base de datos
        const adultos = await Adulto.find();
        res.status(200).json({
            success: true,
            data: adultos
        });
    } catch (error) {
        console.error('Error al obtener adultos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al obtener adultos',
            error: error.message
        });
    }
});


module.exports = router;