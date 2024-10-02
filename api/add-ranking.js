const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

export default async function handler(req, res) {
    const { name, xp, date, userId, attempts, sequence, won } = req.body;

    try {
        const existingEntry = await User.findOne({ userId: userId });
        if (existingEntry) {
            existingEntry.name = name;
            await existingEntry.save();
        }

        const newEntry = new User({
            name,
            xp,
            date,
            userId,
            attempts,
            sequence,
            won,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await newEntry.save();
        res.status(201).json({ message: 'Ranking actualizado', entry: newEntry });
    } catch (err) {
        res.status(500).send(err);
    }
}
