const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

export default async function handler(req, res) {
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
}
