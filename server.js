const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const moment = require("moment-timezone");

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

    const fecha = moment().tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD");
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

// Ruta para obtener los registros del día filtrados por Buenos Aires
app.get("/registros/dia", (req, res) => {
    // Obtener la fecha de Buenos Aires (Argentina)
    const fechaHoy = moment().tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD");
    console.log(fechaHoy);

    // Filtrar registros de la base de datos por la fecha de hoy
    db.all(
        `SELECT * FROM registros WHERE fecha = ?`,
        [fechaHoy],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ message: "Error al obtener registros del día" });
            }

            // Agrupar registros por nombre de gato y contar cuántas veces aparece cada gato
            const resultados = [];

            rows.forEach((registro) => {
                const gatoExistente = resultados.find((item) => item.cat === registro.gato);

                // Si el gato ya está en el resultado, aumentamos el contador
                if (gatoExistente) {
                    gatoExistente.eat += 1;
                } else {
                    // Si el gato no existe, lo agregamos con la cuenta inicial
                    resultados.push({ cat: registro.gato, eat: 1 });
                }
            });

            // Asegurarse de que la respuesta siempre tenga al menos 3 gatos
            while (resultados.length < 3) {
                resultados.push({ cat: "N/A", eat: 0 });
            }

            // Limitar la respuesta a solo 3 gatos, como lo indicaste
            res.json(resultados.slice(0, 3));
        }
    );
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
