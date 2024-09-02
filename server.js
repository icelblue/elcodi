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

// Esquema de Mongoose para el usuario con timestamps
const userSchema = new mongoose.Schema({
    userId: String,       // Identificador único del usuario
    name: String,         // Nombre del usuario
    xp: Number,           // Puntos de experiencia del usuario
    date: String,         // Fecha del registro en formato YYYY-MM-DD
    attempts: Number,     // Número de intentos
    sequence: [Number],   // Secuencia de juego del usuario
    won: Boolean          // Estado de la partida (ganó o no)
}, { timestamps: true });  // Agrega createdAt y updatedAt automáticamente

const User = mongoose.model('User', userSchema);

// Esquema para registro de usuarios
const registeredUserSchema = new mongoose.Schema({
    userId: String,       // Identificador único del usuario
    name: String,         // Nombre del usuario
    email: String         // Correo electrónico del usuario (opcional)
}, { timestamps: true });

const RegisteredUser = mongoose.model('RegisteredUser', registeredUserSchema);

// Endpoint para la ruta raíz
app.get('/', (req, res) => {
    res.send('Bienvenido a El Codi Game API. Utiliza los endpoints /usuarios, /ranking, /xp, y /total-xp para obtener información.');
});

// Endpoint para registrar nuevos usuarios
app.post('/usuarios', async (req, res) => {
    const { userId, name, email } = req.body;
    try {
        const existingUser = await RegisteredUser.findOne({ userId });
        if (existingUser) {
            res.status(400).json({ message: 'El usuario ya está registrado.' });
        } else {
            const newUser = new RegisteredUser({ userId, name, email });
            await newUser.save();
            res.status(201).json({ message: 'Usuario registrado con éxito', user: newUser });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar usuario', details: err });
    }
});

// Endpoint para obtener puntos XP ganados hoy
app.get('/xp', async (req, res) => {
    const { date, userId } = req.query;
    try {
        const entry = await User.findOne({ date: date, userId: userId });
        res.json({ xp: entry ? entry.xp : 0 });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener puntos XP de hoy', details: err });
    }
});

// Nuevo Endpoint para obtener puntos XP acumulados hasta hoy
app.get('/total-xp', async (req, res) => {
    const { userId } = req.query;
    try {
        // Obtener la fecha de hoy en formato YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];

        // Consulta para sumar XP acumulados hasta la fecha de hoy
        const accumulatedXP = await User.aggregate([
            { $match: { userId: userId, date: { $lte: today } } },
            { $group: { _id: "$userId", totalXP: { $sum: "$xp" } } }
        ]);

        const totalXP = accumulatedXP.length > 0 ? accumulatedXP[0].totalXP : 0;
        res.json({ totalXP: totalXP });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener puntos XP acumulados', details: err });
    }
});

// Endpoint para agregar o actualizar puntos XP del día actual
app.post('/xp', async (req, res) => {
    const { xp, date, userId, attempts, sequence, won } = req.body;
    try {
        const existingEntry = await User.findOne({ date: date, userId: userId });
        if (existingEntry) {
            existingEntry.xp = Math.max(existingEntry.xp, xp);
            existingEntry.attempts = attempts;
            existingEntry.sequence = sequence;
            existingEntry.won = won;
            await existingEntry.save();
            res.json({ message: 'XP actualizado', entry: existingEntry });
        } else {
            const newEntry = new User({ userId, xp, date, attempts, sequence, won });
            await newEntry.save();
            res.status(201).json({ message: 'XP almacenado', entry: newEntry });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error al almacenar o actualizar puntos XP', details: err });
    }
});

// Endpoint para obtener el ranking del día
app.get('/ranking', async (req, res) => {
    const { date } = req.query;
    try {
        const rankings = await User.find({ date: date }).sort({ xp: -1 });
        res.json(rankings);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener ranking', details: err });
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
        res.status(500).json({ error: 'Error al actualizar el ranking', details: err });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
