document.addEventListener("DOMContentLoaded", function () {
    const API_BASE_URL = "/api"; // Cambiar según la configuración de Vercel
    const buttons = document.querySelectorAll(".button");
    const message = document.getElementById("message");
    const rankingList = document.getElementById("ranking-list");
    const userXPDisplay = document.getElementById("user-xp");
    const sequence = generateDailySequence();
    let userSequence = [];
    let clickCount = 0;
    let dailyXP = 0;
    let hasWonToday = false;

    buttons.forEach((button, index) => {
        button.addEventListener("click", () => {
            userSequence.push(index + 1);
            if (userSequence[clickCount] === sequence[clickCount]) {
                button.classList.add("correct");
            } else {
                button.classList.add("incorrect");
                message.textContent = "Seqüència incorrecta. Torna-ho a intentar.";
                setTimeout(resetGame, 1000);
                return;
            }
            clickCount++;

            if (clickCount === 5) {
                if (!hasWonToday) {
                    dailyXP += 50; // XP por ganar
                    hasWonToday = true;
                    message.textContent = "Felicitats! Has guanyat avui.";
                    updateRanking(prompt("Introduce tu nombre:"), dailyXP);
                }
            }
        });
    });

    function generateDailySequence() {
        const seed = new Date().toISOString().split("T")[0];
        Math.seedrandom(seed);
        return Array.from({ length: 5 }, () => Math.floor(Math.random() * 5) + 1);
    }

    function resetGame() {
        userSequence = [];
        clickCount = 0;
        buttons.forEach(button => button.classList.remove("correct", "incorrect"));
    }

    async function updateRanking(name, xp) {
        try {
            const response = await fetch(`${API_BASE_URL}/ranking`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, xp }),
            });
            if (response.ok) {
                displayRanking();
            }
        } catch (err) {
            console.error("Error updating ranking:", err);
        }
    }

    async function displayRanking() {
        try {
            const response = await fetch(`${API_BASE_URL}/ranking`);
            const ranking = await response.json();
            rankingList.innerHTML = ranking.map((entry, i) => `<li>${i + 1}. ${entry.name} - ${entry.xp} XP</li>`).join("");
        } catch (err) {
            console.error("Error fetching ranking:", err);
        }
    }

    displayRanking();
});
