const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const moment = require("moment");

// Configuración segura
const DB_NAME = "Elderly";
const BACKUP_DIR = path.join(__dirname, "../backups");
const MONGO_URI = process.env.MONGODB_URI || "mongodb+srv://JoseValladares:Fornai247@cluster0.wtk4xm5.mongodb.net/Elderly?retryWrites=true&w=majority";

// Colecciones a respaldar (ajusta según tu base de datos)
const COLLECTIONS_TO_BACKUP = [
  "usuarios",
  "adultos",
  "gps",
  "medicamentos",
  "temperaturas",
  "presions",
  "ubicacions"
];

// Middleware para crear directorio de backups si no existe
const ensureBackupDir = (req, res, next) => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  next();
};

// Endpoint para generar backup
router.get("/", ensureBackupDir, async (req, res) => {
  const timestamp = moment().format("YYYYMMDD_HHmmss");
  const tempBackupDir = path.join(BACKUP_DIR, `temp_${timestamp}`);
  const zipFileName = `backup_${timestamp}.zip`;
  const zipFilePath = path.join(BACKUP_DIR, zipFileName);

  try {
    // 1. Crear directorio temporal
    fs.mkdirSync(tempBackupDir);

    // 2. Exportar cada colección
    const exportPromises = COLLECTIONS_TO_BACKUP.map(collection => 
      exportCollection(collection, tempBackupDir)
    );

    await Promise.all(exportPromises);

    // 3. Verificar que todos los archivos se crearon correctamente
    verifyExportedFiles(tempBackupDir);

    // 4. Crear archivo ZIP
    await createZipArchive(tempBackupDir, zipFilePath);

    // 5. Configurar headers para la descarga
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${zipFileName}`);

    // 6. Stream el archivo al cliente
    const fileStream = fs.createReadStream(zipFilePath);
    fileStream.pipe(res);

    // 7. Limpiar cuando termine la descarga
    fileStream.on("close", () => {
      cleanup(tempBackupDir, zipFilePath);
    });

  } catch (error) {
    console.error("Error en el proceso de backup:", error);
    cleanup(tempBackupDir, zipFilePath);
    
    res.status(500).json({
      success: false,
      message: "Error al generar el backup",
      error: error.message,
      details: error.stack
    });
  }
});

// Función para exportar una colección
function exportCollection(collectionName, outputDir) {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(outputDir, `${collectionName}.json`);
    const command = `mongoexport --uri="${MONGO_URI}" --collection=${collectionName} --out="${outputFile}" --jsonArray`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error exportando ${collectionName}:`, stderr);
        return reject(new Error(`Fallo al exportar ${collectionName}: ${stderr}`));
      }
      console.log(`Exportado correctamente: ${collectionName}`);
      resolve();
    });
  });
}

// Función para verificar archivos exportados
function verifyExportedFiles(dir) {
  COLLECTIONS_TO_BACKUP.forEach(collection => {
    const filePath = path.join(dir, `${collection}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo ${collection}.json no se creó`);
    }
    if (fs.statSync(filePath).size === 0) {
      throw new Error(`Archivo ${collection}.json está vacío`);
    }
  });
}

// Función para crear archivo ZIP
function createZipArchive(sourceDir, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { 
      zlib: { level: 9 } // Máxima compresión
    });

    output.on("close", () => {
      console.log(`Archivo ZIP creado: ${zipPath} (${archive.pointer()} bytes)`);
      resolve();
    });

    archive.on("error", (err) => {
      reject(new Error(`Error al crear el ZIP: ${err.message}`));
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

// Función para limpieza
function cleanup(tempDir, zipPath) {
  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`Directorio temporal eliminado: ${tempDir}`);
    }
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
      console.log(`Archivo ZIP temporal eliminado: ${zipPath}`);
    }
  } catch (cleanupError) {
    console.error("Error durante la limpieza:", cleanupError);
  }
}

module.exports = router;