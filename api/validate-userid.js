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
        const user = await User.findOne({ userId: userId });
        if (user) {
            res.json({ isUnique: false, name: user.name });
        } else {
            res.json({ isUnique: true });
        }
    } catch (err) {
        res.status(500).send(err);
    }
}
