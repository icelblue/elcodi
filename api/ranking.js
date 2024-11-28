import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export default async function handler(req, res) {
    const { method } = req;

    if (!cachedClient || !cachedDb) {
        try {
            const client = await MongoClient.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            cachedClient = client;
            cachedDb = client.db("RankingGameCluster");
        } catch (err) {
            console.error("Failed to connect to MongoDB", err);
            return res.status(500).json({ error: "Database connection failed" });
        }
    }

    const db = cachedDb;
    const collection = db.collection("ranking");

    if (method === "GET") {
        // Obtener el ranking del día
        try {
            const today = new Date().toISOString().split("T")[0];
            const rankings = await collection
                .find({ date: today })
                .sort({ xp: -1 })
                .limit(10)
                .toArray();
            return res.status(200).json(rankings);
        } catch (err) {
            console.error("Failed to fetch rankings:", err);
            return res.status(500).json({ error: "Failed to fetch rankings" });
        }
    } else if (method === "POST") {
        // Agregar un nuevo registro al ranking
        const { name, xp } = req.body;
        if (!name || !xp) {
            return res.status(400).json({ error: "Name and XP are required" });
        }
        try {
            const today = new Date().toISOString().split("T")[0];
            await collection.insertOne({ name, xp, date: today });
            return res.status(201).json({ message: "Ranking entry added successfully" });
        } catch (err) {
            console.error("Failed to add ranking entry:", err);
            return res.status(500).json({ error: "Failed to add ranking entry" });
        }
    } else {
        return res.status(405).json({ error: "Method not allowed" });
    }
}
