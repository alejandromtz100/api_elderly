const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

// Configuración segura
const DB_NAME = "Elderly";
const BACKUP_DIR = path.join(__dirname, "../backups");
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://JoseValladares:Fornai247@cluster0.wtk4xm5.mongodb.net/Elderly?retryWrites=true&w=majority";

// Lista de colecciones a respaldar (MODIFICA ESTO CON TUS COLECCIONES REALES)
const COLLECTIONS_TO_BACKUP = [
  "usuarios",
  "adultos",
  "gps",
  "medicamentos",
  "temperaturas",
  "presions",
  "ubicacions"
];

router.get("/backup", async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const tempBackupDir = path.join(BACKUP_DIR, `temp_backup_${timestamp}`);
    
    // Crear directorio temporal
    if (!fs.existsSync(tempBackupDir)) {
      fs.mkdirSync(tempBackupDir, { recursive: true });
    }

    // Función para exportar una colección
    const exportCollection = (collectionName) => {
      return new Promise((resolve, reject) => {
        const outputFile = path.join(tempBackupDir, `${collectionName}.json`);
        const command = `mongoexport --uri="${MONGO_URI}" --collection=${collectionName} --out="${outputFile}" --jsonArray`;
        
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error exporting ${collectionName}:`, stderr);
            return reject(new Error(`Failed to export ${collectionName}: ${stderr}`));
          }
          console.log(`Successfully exported ${collectionName}`);
          resolve();
        });
      });
    };

    // Exportar todas las colecciones en paralelo
    await Promise.all(COLLECTIONS_TO_BACKUP.map(exportCollection));

    // Crear archivo ZIP con todas las colecciones
    const zipFileName = `backup_${timestamp}.zip`;
    const zipFilePath = path.join(BACKUP_DIR, zipFileName);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Manejar eventos del archivo ZIP
    output.on('close', () => {
      console.log(`Backup completo creado: ${zipFilePath} (${archive.pointer()} bytes)`);
      
      // Enviar el ZIP al cliente
      res.download(zipFilePath, zipFileName, (err) => {
        // Limpiar archivos temporales
        fs.rmSync(tempBackupDir, { recursive: true, force: true });
        fs.unlinkSync(zipFilePath);
        if (err) {
          console.error("Error al enviar el backup:", err);
        }
      });
    });

    archive.on('error', (err) => {
      throw new Error(`Error al crear el ZIP: ${err.message}`);
    });

    archive.pipe(output);
    archive.directory(tempBackupDir, false);
    await archive.finalize();

  } catch (error) {
    console.error("Error en el proceso de backup:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar el backup",
      error: error.message
    });
  }
});

module.exports = router;