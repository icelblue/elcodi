document.addEventListener("DOMContentLoaded", async function () {
    const buttons = document.querySelectorAll(".button");
    const message = document.getElementById("message");
    const rankingList = document.getElementById("ranking-list");
    const userXPDisplay = document.getElementById("user-xp");
    const sequence = generateDailySequence();
    let userSequence = [];
    let clickCount = 0;
    let attempts = 0;
    let dailyXP = 0;

    // Cargar el userId de localStorage o generar uno nuevo si no existe
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = await generateUniqueUserId();
        localStorage.setItem('userId', userId);
    } else {
        const { isUnique, name } = await validateUserIdUniqueness(userId);
        if (!isUnique) {
            const confirmName = confirm(`¿Eres ${name}?`);
            if (!confirmName) {
                userId = await generateUniqueUserId();
                localStorage.setItem('userId', userId);
            }
        }
    }

    console.log("User ID:", userId);

    async function generateUniqueUserId() {
        let newUserId;
        let isUnique = false;
        while (!isUnique) {
            newUserId = 'user_' + Math.random().toString(36).substr(2, 9);
            const validation = await validateUserIdUniqueness(newUserId);
            isUnique = validation.isUnique;
        }
        return newUserId;
    }

    async function validateUserIdUniqueness(userId) {
        try {
            const response = await fetch(`../api/validate-userid?userId=${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Error validating userId uniqueness:', error);
            return { isUnique: false };
        }
    }

    let hasWonToday = localStorage.getItem(`hasWonToday_${userId}`) === 'true';
    loadTotalXP();
    loadDailyXP();

    buttons.forEach((button, index) => {
        button.addEventListener("click", () => {
            userSequence.push(index + 1);
            if (userSequence[clickCount] === sequence[clickCount]) {
                button.classList.add("correct");
            } else {
                button.classList.add("incorrect");
                attempts++;
                message.textContent = "Seqüència incorrecta. Torna-ho a intentar.";
                setTimeout(resetGame, 1000);
                return;
            }
            clickCount++;

            if (clickCount === 5) {
                attempts++;
                if (!hasWonToday) {
                    message.textContent = "Felicitats! Ho has fet.";
                    calculateXP(attempts);

                    setTimeout(() => {
                        const userName = prompt("Introduce tu nombre para el ranking:");
                        if (userName) {
                            storeDailyXP(dailyXP, userName);
                        }
                        hasWonToday = true;
                        localStorage.setItem(`hasWonToday_${userId}`, 'true');
                    }, 500);
                } else {
                    message.textContent = "Ja has guanyat avui. Intenta-ho demà per més punts.";
                }
                setTimeout(resetGame, 2000);
            }
        });
    });

    function storeDailyXP(xp, name) {
        const date = new Date().toISOString().split('T')[0];
        fetch('../api/xp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ xp, date, userId, sequence: userSequence, attempts, won: true, name })
        })
        .then(response => response.json())
        .then(data => {
            console.log('XP stored:', data);
            loadTotalXP();
        })
        .catch(error => {
            console.error('Error storing XP:', error);
        });
    }

    function loadTotalXP() {
        fetch(`../api/total-xp?userId=${userId}`)
            .then(response => response.json())
            .then(data => {
                const totalXP = data.totalXP || 0;
                userXPDisplay.textContent = `Els teus XP: ${totalXP}`;
            })
            .catch(error => {
                console.error('Error loading total XP:', error);
            });
    }

    function loadDailyXP() {
        const date = new Date().toISOString().split('T')[0];
        fetch(`../api/xp?date=${date}&userId=${userId}`)
            .then(response => response.json())
            .then(data => {
                dailyXP = data.xp || 0;
                hasWonToday = dailyXP > 0;
                message.textContent = `Punts XP acumulats avui: ${dailyXP}`;
            })
            .catch(error => {
                console.error('Error loading daily XP:', error);
            });
    }

    function resetGame() {
        userSequence = [];
        clickCount = 0;
        message.textContent = "";
        buttons.forEach(button => {
            button.classList.remove("correct");
            button.classList.remove("incorrect");
        });
    }

    function generateDailySequence() {
        const date = new Date();
        const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
        Math.seedrandom(seed);

        let sequence = [];
        for (let i = 0; i < 5; i++) {
            sequence.push(Math.floor(Math.random() * 5) + 1);
        }
        return sequence;
    }
});
