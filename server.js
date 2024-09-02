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
    userId: { type: String, required: true, unique: true }, // Asegurar unicidad
    name: String,
    xp: Number,
    date: String,
    sequence: [Number],
    attempts: Number,
    won: Boolean,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Endpoint para validar unicidad de userId
app.get('/validate-userid', async (req, res) => {
    const { userId } = req.query;
    try {
        const user = await User.findOne({ userId: userId });
        if (user) {
            res.json({ isUnique: false, name: user.name });
        } else {
            res.json({ isUnique: true });
        }
    } catch (err) {
        res.status(500).json({ isUnique: false, error: 'Error en la validación de userId' });
    }
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
    const { xp, date, userId, sequence, attempts, won, name } = req.body;
    try {
        const existingEntry = await User.findOne({ date: date, userId: userId });
        if (existingEntry) {
            existingEntry.xp = Math.max(existingEntry.xp, xp);
            existingEntry.sequence = sequence;
            existingEntry.attempts = attempts;
            existingEntry.won = won;
            existingEntry.name = name; // Asegurarse de que el nombre se actualice
            existingEntry.updatedAt = new Date();
            await existingEntry.save();
            res.json({ message: 'XP y secuencia actualizados', entry: existingEntry });
        } else {
            const newEntry = new User({ userId, xp, date, sequence, attempts, won, name });
            await newEntry.save();
            res.status(201).json({ message: 'XP y secuencia almacenados', entry: newEntry });
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
