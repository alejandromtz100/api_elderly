require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const app = express();

// Rutas
const usuarios = require("./src/routes/usuario");  
const backup = require("./src/routes/backup"); 
const adulto = require("./src/routes/adulto");
const suscripcion = require("./src/routes/suscripcion"); 

// Conectar a MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Usar rutas
app.use("/api", usuarios);
app.use("/api", backup);
app.use("/api", adulto);
app.use("/api/notificaciones", suscripcion);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
