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
    userId: { type: String, unique: true, required: true }, // Campo único y requerido para el `userId`
    internalId: { type: mongoose.Schema.Types.ObjectId, auto: true }, // `internalId` único generado por MongoDB
    name: String, // Campo para almacenar el nombre del usuario
    xp: Number,
    date: String,
    sequence: [Number],
    attempts: Number,
    won: Boolean,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Endpoint para validar unicidad de userId y obtener nombre
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
        res.status(500).send(err);
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

// Endpoint para obtener los puntos acumulados hasta la fecha para un usuario
app.get('/total-xp', async (req, res) => {
    const { userId } = req.query;
    try {
        const totalXP = await User.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: null, totalXP: { $sum: "$xp" } } }
        ]);
        res.json({ totalXP: totalXP[0] ? totalXP[0].totalXP : 0 });
    } catch (err) {
        res.status(500).send(err);
    }
});

// Endpoint para agregar o actualizar puntos XP y secuencia del usuario
app.post('/xp', async (req, res) => {
    const { xp, date, userId, attempts, sequence, won, name } = req.body;
    console.log(`Received XP data: ${JSON.stringify(req.body)}`);
    try {
        const existingEntry = await User.findOne({ date: date, userId: userId });
        if (existingEntry) {
            existingEntry.xp += xp;  // Sumar XP a los XP existentes
            existingEntry.sequence = sequence;  // Actualizar la secuencia
            existingEntry.attempts = attempts;  // Actualizar el número de intentos
            existingEntry.won = won;  // Actualizar el estado de victoria
            if (name && existingEntry.name !== name) {
                existingEntry.name = name; // Actualizar nombre si se proporciona uno nuevo
            }
            existingEntry.updatedAt = new Date();  // Actualizar la fecha de modificación
            await existingEntry.save();
            res.json({ message: 'XP y secuencia actualizados', entry: existingEntry });
        } else {
            const newEntry = new User({ userId, name, xp, date, sequence, attempts, won, createdAt: new Date(), updatedAt: new Date() });
            await newEntry.save();
            res.status(201).json({ message: 'XP y secuencia almacenados', entry: newEntry });
        }
    } catch (err) {
        if (err.code === 11000) { // Error de duplicado
            res.status(400).json({ message: 'User ID ya existe, generar uno nuevo' });
        } else {
            res.status(500).send(err);
        }
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
        const existingEntry = await User.findOne({ userId: userId });
        if (existingEntry) {
            // Actualizar nombre si ya existe el `userId` pero se proporciona un nuevo nombre
            existingEntry.name = name;
            await existingEntry.save();
        }
        const newEntry = new User({ name, xp, date, userId, attempts, sequence, won, createdAt: new Date(), updatedAt: new Date() });
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
