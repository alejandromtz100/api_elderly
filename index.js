require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const app = express();
const usuarios = require('./src/routes/usuario'); // Rutas para usuarios
const backupRoutes = require("./src/routes/backup");
const adulto = require('./src/routes/adulto'); // Rutas para adultos
const suscripcionRoutes = require("./src/routes/suscripcion");



// Conectar a MongoDB
connectDB();

app.use(cors());
app.use(express.json());


// Rutas
app.use('/api', usuarios);
app.use("/api", backupRoutes);
app.use('/api', adulto);
app.use("/api", suscripcionRoutes);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
