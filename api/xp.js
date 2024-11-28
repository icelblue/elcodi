// /api/xp.js
module.exports = async (req, res) => {
    if (req.method === "POST") {
        const { userId, xp } = req.body;
        // Lógica para almacenar los XP (simulada aquí)
        res.status(200).json({ message: "XP guardado correctamente" });
    } else {
        res.status(405).json({ error: "Método no permitido" });
    }
};
