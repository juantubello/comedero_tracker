const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

// Configurar base de datos SQLite
const db = new sqlite3.Database(path.join(__dirname, "gatos.db"), (err) => {
  if (err) {
    console.error("Error al conectar con la BD:", err.message);
  } else {
    console.log("Conectado a SQLite");
    db.run(
      `CREATE TABLE IF NOT EXISTS registros (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT,
        hora TEXT,
        gato TEXT
      )`
    );
  }
});

// Configurar multer para manejar archivos en memoria (NO se guardan en disco)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta para recibir imágenes y registrar datos en la BD
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se recibió ninguna imagen" });
  }

  const { gato } = req.body;
  if (!gato) {
    return res.status(400).json({ message: "Falta el nombre del gato" });
  }

  const fecha = new Date().toISOString().split("T")[0];
  const hora = new Date().toLocaleTimeString();

  db.run(
    `INSERT INTO registros (fecha, hora, gato) VALUES (?, ?, ?)`,
    [fecha, hora, gato],
    (err) => {
      if (err) {
        console.error("Error al insertar en la BD:", err.message);
        return res.status(500).json({ message: "Error al registrar el dato" });
      }
      console.log(`Registro guardado: ${fecha} ${hora} - ${gato}`);
      res.json({ message: "OK", fecha, hora, gato });
    }
  );
});

// Ruta para obtener los registros de la BD
app.get("/registros", (req, res) => {
  db.all("SELECT * FROM registros ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Error al obtener registros" });
    }
    res.json(rows);
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
