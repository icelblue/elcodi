require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Conectar a MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado a MongoDB Atlas');
}).catch(err => {
    console.error('Error al conectar a MongoDB Atlas:', err);
});

// Esquema de Mongoose para el ranking y datos del usuario
const userSchema = new mongoose.Schema({
    userId: String,       // Identificador único del usuario
    name: String,         // Nombre del usuario
    xp: Number,           // Puntos de experiencia del usuario
    date: String,         // Fecha del registro
    attempts: Number,     // Número de intentos
    sequence: [Number],   // Secuencia de juego del usuario
    won: Boolean          // Estado de la partida (ganó o no)
});

const User = mongoose.model('User', userSchema);

// Endpoint para la ruta raíz
app.get('/', (req, res) => {
    res.send('Bienvenido a El Codi Game API. Utiliza los endpoints /ranking y /xp para obtener información.');
});

// Endpoint para obtener puntos XP del usuario específico
app.get('/xp', async (req, res) => {
    const { date, userId } = req.query;
    try {
        const entry = await User.findOne({ date: date, userId: userId });
        if (entry) {
            res.json({ xp: entry.xp });
        } else {
            res.json({ xp: 0 });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

// Endpoint para agregar o actualizar puntos XP
app.post('/xp', async (req, res) => {
    const { xp, date, userId } = req.body;
    try {
        const existingEntry = await User.findOne({ date: date, userId: userId });
        if (existingEntry) {
            existingEntry.xp = Math.max(existingEntry.xp, xp);
            await existingEntry.save();
            res.json({ message: 'XP actualizado', entry: existingEntry });
        } else {
            const newEntry = new User({ userId, xp, date, attempts: 0, sequence: [], won: false });
            await newEntry.save();
            res.status(201).json({ message: 'XP almacenado', entry: newEntry });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

// Endpoint para obtener el ranking del día
app.get('/ranking', async (req, res) => {
    const date = req.query.date;
    try {
        const rankings = await User.find({ date: date }).sort({ xp: -1 });
        res.json(rankings);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Endpoint para agregar una nueva entrada al ranking
app.post('/ranking', async (req, res) => {
    const { name, xp, date, userId, attempts, sequence, won } = req.body;
    try {
        const newEntry = new User({ name, xp, date, userId, attempts, sequence, won });
        await newEntry.save();
        res.status(201).json({ message: 'Ranking actualizado', entry: newEntry });
    } catch (err) {
        res.status(500).send(err);
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
