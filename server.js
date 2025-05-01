const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const moment = require("moment-timezone");
const axios = require('axios');

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
                gato TEXT,
                imagen BLOB
            )`
        );
    }
});

// Configurar multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta para recibir imágenes y registrar datos en la BD
app.post("/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No se recibió ninguna imagen" });
    }

    //const { gato } = req.body;
    //if (!gato) {
    //    return res.status(400).json({ message: "Falta el nombre del gato" });
    //}

    const fecha = moment().tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD");
    const hora = new Date().toLocaleTimeString();
    const imagen = req.file.buffer; // Imagen en binario

    let data = imagen;

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://192.168.1.53:5000/identificar',
        headers: {
            'Content-Type': 'image/png'
        },
        data: data
    };

    axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));

            if (response.data?.gato === 'luna_negra') {
                gato = 'Luna';
            }
            else if (response.data?.gato === 'artemis_blanca') {
                gato = 'Artemis';
            }

            else if (response.data?.gato === 'diana_gris') {
                gato = 'Luna';
            }

            db.run(
                `INSERT INTO registros (fecha, hora, gato, imagen) VALUES (?, ?, ?, ?)`,
                [fecha, hora, gato, imagen],
                function (err) {
                    if (err) {
                        console.error("Error al insertar en la BD:", err.message);
                        return res.status(500).json({ message: "Error al registrar el dato" });
                    }
                    console.log(`Registro guardado: ${fecha} ${hora} - ${gato}`);
                    res.json({ message: "OK", id: this.lastID, fecha, hora, gato });
                }
            );

        })
        .catch((error) => {
            console.log(error);
        });

});

// Ruta para obtener los registros de la BD
app.get("/registros", (req, res) => {
    db.all("SELECT id, fecha, hora, gato FROM registros ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Error al obtener registros" });
        }
        res.json(rows);
    });
});

// Ruta para obtener los registros del día filtrados por Buenos Aires
app.get("/registros/dia", (req, res) => {
    const fechaHoy = moment().tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD");
    console.log(fechaHoy);

    db.all(
        `SELECT gato FROM registros WHERE fecha = ?`,
        [fechaHoy],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ message: "Error al obtener registros del día" });
            }

            const resultados = [];

            rows.forEach((registro) => {
                const gatoExistente = resultados.find((item) => item.cat === registro.gato);

                if (gatoExistente) {
                    gatoExistente.eat += 1;
                } else {
                    resultados.push({ cat: registro.gato, eat: 1 });
                }
            });

            while (resultados.length < 3) {
                resultados.push({ cat: "N/A", eat: 0 });
            }

            res.json(resultados.slice(0, 3));
        }
    );
});

// Nueva ruta para descargar una imagen por ID
app.get("/imagen/:id", (req, res) => {
    const { id } = req.params;
    db.get("SELECT imagen FROM registros WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error("Error al obtener la imagen:", err.message);
            return res.status(500).json({ message: "Error al obtener la imagen" });
        }
        if (!row || !row.imagen) {
            return res.status(404).json({ message: "Imagen no encontrada" });
        }

        res.set("Content-Type", "image/jpeg"); // Suponiendo que la imagen es JPG o similar
        res.send(row.imagen);
    });
});

// Iniciar servidor
app.listen(PORT, '192.168.1.11', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
