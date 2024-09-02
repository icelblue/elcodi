document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".button");
    const message = document.getElementById("message");
    const rankingList = document.getElementById("ranking-list");
    const userXPDisplay = document.getElementById("user-xp");
    const sequence = generateDailySequence();
    let userSequence = [];
    let clickCount = 0;
    let attempts = 0;
    let dailyXP = 0;

    // Generar un identificador de sesión único para el usuario al cargar la página
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }

    // Mostrar el ID de usuario (opcional para depuración)
    console.log("User ID:", userId);

    // Cargar el estado de los intentos desde localStorage
    let hasWonToday = localStorage.getItem(`hasWonToday_${userId}`) === 'true';

    // Cargar los puntos acumulados y los puntos de hoy
    loadTotalXP(); // Cargar puntos acumulados hasta hoy
    loadDailyXP(); // Cargar puntos ganados hoy

    buttons.forEach((button, index) => {
        button.addEventListener("click", () => {
            userSequence.push(index + 1); // Añadir el botón clicado a la secuencia del usuario
            if (userSequence[clickCount] === sequence[clickCount]) {
                button.classList.add("correct");
            } else {
                button.classList.add("incorrect");
                attempts++;
                message.textContent = "Seqüència incorrecta. Torna-ho a intentar.";
                setTimeout(resetGame, 1000); // Espera 1 segundo antes de resetear en caso de error
                return;
            }
            clickCount++;

            if (clickCount === 5) { // Secuencia completa
                attempts++;
                if (!hasWonToday) { // Solo permitir registrar puntos si no ha ganado hoy
                    message.textContent = "Felicitats! Ho has fet.";
                    calculateXP(attempts); // Calcular y mostrar XP

                    // Pedir al usuario que se registre en el ranking
                    setTimeout(() => {
                        askToJoinRanking(dailyXP);
                        hasWonToday = true; // Marcar como ganado para evitar registrar más puntos hoy
                        localStorage.setItem(`hasWonToday_${userId}`, 'true');
                    }, 500); // Asegurarse de que el mensaje de victoria se vea antes de mostrar el prompt
                } else {
                    // Mensaje si ya ha ganado hoy
                    message.textContent = "Ja has guanyat avui. Intenta-ho demà per més punts.";
                }
                setTimeout(resetGame, 2000); // Restablecer el juego después de 2 segundos
            }
        });
    });

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

    function resetGame() {
        userSequence = [];
        clickCount = 0;
        message.textContent = "";
        buttons.forEach(button => {
            button.classList.remove("correct");
            button.classList.remove("incorrect");
        });
    }

    function calculateXP(attempts) {
        let xpGained = 0;
        if (attempts === 1) {
            xpGained = 50;
        } else if (attempts <= 3) {
            xpGained = 30;
        } else {
            xpGained = 10;
        }

        dailyXP += xpGained;
        message.textContent = `Has guanyat ${xpGained} punts XP! Punts totals avui: ${dailyXP}`;
        storeDailyXP(dailyXP);
    }

    function storeDailyXP(xp) {
        const date = new Date().toISOString().split('T')[0]; // Obtener la fecha de hoy en formato YYYY-MM-DD
        fetch('https://el-codi-game-9c430ed97d57.herokuapp.com/xp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ xp, date, userId })
        })
        .then(response => response.json())
        .then(data => {
            console.log('XP stored:', data);
            loadTotalXP(); // Actualizar los puntos acumulados después de almacenar
        })
        .catch(error => {
            console.error('Error storing XP:', error);
        });
    }

    function loadDailyXP() {
        const date = new Date().toISOString().split('T')[0];
        fetch(`https://el-codi-game-9c430ed97d57.herokuapp.com/xp?date=${date}&userId=${userId}`)
            .then(response => response.json())
            .then(data => {
                dailyXP = data.xp || 0;
                hasWonToday = dailyXP > 0; // Determinar si ya ha ganado hoy
                message.textContent = `Punts XP acumulats avui: ${dailyXP}`;
            })
            .catch(error => {
                console.error('Error loading daily XP:', error);
            });
    }

    function loadTotalXP() {
        fetch(`https://el-codi-game-9c430ed97d57.herokuapp.com/total-xp?userId=${userId}`)
            .then(response => response.json())
            .then(data => {
                const totalXP = data.totalXP || 0;
                userXPDisplay.textContent = `Els teus XP: ${totalXP}`; // Mostrar puntos acumulados hasta hoy
            })
            .catch(error => {
                console.error('Error loading total XP:', error);
            });
    }

    function askToJoinRanking(xp) {
        let name;
        do {
            name = prompt("Vols afegir el teu nom al ranking del dia? (Només lletres, sense números)");
            if (name === null) return; // Si el usuario cancela, salir sin hacer nada
        } while (!isValidName(name));

        updateRanking(name, xp);
        displayRanking(); // Mostrar el ranking actualizado
    }

    function isValidName(name) {
        const regex = /^[a-zA-ZÀ-ÿ\s]+$/; // Expresión regular para validar solo letras y espacios
        if (!regex.test(name)) {
            alert("Només es permeten lletres i espais. Si us plau, introdueix un nom vàlid.");
            return false;
        }
        return true;
    }

    function updateRanking(name, xp) {
        const date = new Date().toISOString().split('T')[0];
        fetch('https://el-codi-game-9c430ed97d57.herokuapp.com/ranking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, xp, date, userId })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Ranking updated:', data);
            displayRanking(); // Actualizar el ranking después de cada actualización
        })
        .catch(error => {
            console.error('Error updating ranking:', error);
        });
    }

    function displayRanking() {
        const date = new Date().toISOString().split('T')[0];
        fetch(`https://el-codi-game-9c430ed97d57.herokuapp.com/ranking?date=${date}`)
            .then(response => response.json())
            .then(rankingForToday => {
                rankingList.innerHTML = ""; // Limpiar la lista antes de mostrarla
                rankingForToday.forEach((entry, index) => {
                    const listItem = document.createElement("li");
                    listItem.textContent = `${index + 1}. ${entry.name} - ${entry.xp} XP`;
                    rankingList.appendChild(listItem);
                });
            })
            .catch(error => {
                console.error('Error fetching ranking:', error);
            });
    }

    // Cargar el ranking al iniciar
    displayRanking();

    // Actualizar el ranking automáticamente cada 30 segundos
    setInterval(displayRanking, 30000);
});
