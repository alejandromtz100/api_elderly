const express = require("express");
const router = express.Router();
const { hashPassword, verifyPassword } = require("../utils/encryption");
const {generarToken} = require("../utils/token");
const User = require("../models/Musuario"); // Asegúrate de que el modelo sea correcto



// Ruta de registro
router.post("/register", async (req, res) => {
    try {
        const { usuario, correo, contra, telefono, roluser } = req.body;
        const hashedPassword = await hashPassword(contra);

        const newUser = new User({ usuario, correo, contra: hashedPassword, telefono, roluser });
        await newUser.save();

        res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta de login
router.post("/login", async (req, res) => {
    try {
        const { usuario, contra, recordarDisp } = req.body;
        const user = await User.findOne({ usuario });

        if (!user || !(await verifyPassword(contra, user.contra))) {
            return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }

        const { tempToken, tokenPermanente } = generarToken(user, recordarDisp);
        
        if (recordarDisp && tokenPermanente) {
            user.tokenPermanente = tokenPermanente;
            await user.save();
        }

        res.status(200).json({
            message: "Usuario encontrado",
            tempToken,
            tokenPermanente: tokenPermanente || null,
            rol: user.roluser,
            usuario: user.usuario
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ 
            error: error.message || "Error en el servidor al iniciar sesión" 
        });
    }
});

// Ruta para obtener información del usuario logueado
router.get("/perfil", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "Token no proporcionado" });
        }

        const decoded = await verificarToken(token);

        const user = await User.findById(decoded.id).select("usuario correo telefono roluser");

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.status(200).json({ message: "Perfil del usuario obtenido exitosamente", usuario: user });

    } catch (error) {
        res.status(500).json({ error: "Token inválido o sesión expirada" });
    }
});

// 🚀 Obtener todos los usuarios
router.get("/usuarios", async (req, res) => {
    try {
        const usuarios = await User.find().select("usuario correo telefono roluser");
        res.status(200).json({ usuarios });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los usuarios" });
    }
});

// 🚀 Obtener un usuario por ID
router.get("/usuario/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await User.findById(id).select("usuario correo telefono roluser");

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.status(200).json({ usuario });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el usuario" });
    }
});

// 🚀 Actualizar un usuario por ID
router.put("/usuario/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario, correo, telefono, roluser } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { usuario, correo, telefono, roluser },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.status(200).json({ message: "Usuario actualizado con éxito", usuario: updatedUser });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el usuario" });
    }
});

// 🚀 Eliminar un usuario por ID
router.delete("/usuario/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.status(200).json({ message: "Usuario eliminado con éxito" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el usuario" });
    }
});

// 🚀 Ruta para panel de control
router.get("/panel-control", async (req, res) => {
    try {
        const totalUsuarios = await User.countDocuments();
        const roles = await User.aggregate([
            { $group: { _id: "$roluser", count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            totalUsuarios,
            roles
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener estadísticas del panel de control" });
    }
});

module.exports = router;

