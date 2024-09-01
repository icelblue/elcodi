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

// Esquema de Mongoose para el ranking
const rankingSchema = new mongoose.Schema({
    name: String,
    xp: Number,
    date: String
});

const Ranking = mongoose.model('Ranking', rankingSchema);

// Endpoint para la ruta raíz
app.get('/', (req, res) => {
    res.send('Bienvenido a El Codi Game API. Utiliza los endpoints /ranking y /xp para obtener información.');
});

// Endpoint para obtener puntos XP
app.get('/xp', async (req, res) => {
    const date = req.query.date;
    try {
        const entry = await Ranking.findOne({ date: date });
        if (entry) {
            res.json({ xp: entry.xp });
        } else {
            res.json({ xp: 0 });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

// Endpoint para agregar puntos XP
app.post('/xp', async (req, res) => {
    const { xp, date } = req.body;
    try {
        const existingEntry = await Ranking.findOne({ date: date });
        if (existingEntry) {
            existingEntry.xp = Math.max(existingEntry.xp, xp);
            await existingEntry.save();
            res.json({ message: 'XP actualizado', entry: existingEntry });
        } else {
            const newEntry = new Ranking({ name: 'Anónimo', xp, date });
            await newEntry.save();
            res.status(201).json({ message: 'XP almacenado', entry: newEntry });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

// Endpoint para obtener el ranking del día
app.get('/ranking', async (req, res) => {
    const date = new Date().toISOString().split('T')[0];
    try {
        const rankings = await Ranking.find({ date: date }).sort({ xp: -1 });
        res.json(rankings);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Endpoint para agregar una nueva entrada al ranking
app.post('/ranking', async (req, res) => {
    const { name, xp, date } = req.body;
    try {
        const newEntry = new Ranking({ name, xp, date });
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
