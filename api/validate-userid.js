// /api/validate-userid.js
module.exports = async (req, res) => {
    if (req.method === "GET") {
        const { userId } = req.query;
        // Lógica para validar unicidad del usuario (simulada aquí)
        const isUnique = userId !== "existing_user";
        res.status(200).json({ isUnique });
    } else {
        res.status(405).json({ error: "Método no permitido" });
    }
};
