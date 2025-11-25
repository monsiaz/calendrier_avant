// Configuration
// METTRE À FALSE POUR LA VERSION FINALE
// Si true, permet d'ouvrir toutes les cases pour tester
const DEV_MODE = false; 

const calendarContainer = document.getElementById('calendar');
const modal = document.getElementById('media-modal');
const modalDate = document.getElementById('modal-date');
const modalMediaContainer = document.getElementById('modal-media-container');
const modalCaption = document.getElementById('modal-caption');
const closeBtn = document.querySelector('.close-btn');

// Utilise les données générées par le script Python s'il existe, sinon fallback
const calendarData = (typeof GENERATED_CALENDAR_DATA !== 'undefined') 
    ? GENERATED_CALENDAR_DATA 
    : Array.from({ length: 25 }, (_, i) => ({
        day: i + 1,
        type: 'image',
        src: `https://placehold.co/600x400/165B33/FFF?text=Jour+${i + 1}`,
        caption: `Souvenir du jour ${i + 1}`
    }));

// Sauvegarde l'état des cases ouvertes
let openedDoors = JSON.parse(localStorage.getItem('adventCalendarOpened')) || [];

// NETTOYAGE DE SÉCURITÉ : Si on n'est pas en mode DEV, on vérifie que les cases ouvertes
// sont bien autorisées à la date d'aujourd'hui. Sinon, on les referme.
if (!DEV_MODE) {
    const validOpenedDoors = openedDoors.filter(day => isDateAllowed(day));
    if (validOpenedDoors.length !== openedDoors.length) {
        console.log("Correction des données : fermeture des cases ouvertes par erreur (test).");
        openedDoors = validOpenedDoors;
        localStorage.setItem('adventCalendarOpened', JSON.stringify(openedDoors));
    }
}

function initCalendar() {
    calendarContainer.innerHTML = ''; // Nettoie le conteneur
    
    calendarData.forEach(data => {
        const door = document.createElement('div');
        door.classList.add('door');
        door.dataset.day = data.day;

        // Vérifie si la case a déjà été ouverte
        if (openedDoors.includes(data.day)) {
            door.classList.add('opened');
        }

        // Contenu de la porte
        const content = `
            <div class="ribbon ribbon-v"></div>
            <div class="ribbon ribbon-h"></div>
            <span class="day-number">${data.day}</span>
        `;
        door.innerHTML = content;

        // Gestion du clic
        door.addEventListener('click', () => handleDoorClick(door, data));

        // Vérifie si la case est verrouillée (pour le style)
        if (!isDateAllowed(data.day) && !openedDoors.includes(data.day)) {
            door.classList.add('locked');
            door.title = "Patience ! Ce n'est pas encore le moment...";
        }

        calendarContainer.appendChild(door);
    });
}

function isDateAllowed(day) {
    if (DEV_MODE) return true;

    const now = new Date();
    const currentMonth = now.getMonth(); // 0 = Janvier, 11 = Décembre
    const currentDay = now.getDate();

    // Autoriser si on est en Décembre et que le jour est atteint
    // OU si on est après Décembre (ex: Janvier de l'année suivante)
    if (currentMonth === 11) {
        return currentDay >= day;
    } else if (currentMonth < 11 && now.getFullYear() > 2025) { 
        // Année suivante (juste une sécurité simple)
        return true;
    }
    
    // Si on est avant décembre (ex: Novembre), tout est verrouillé
    return false;
}

function handleDoorClick(doorElement, data) {
    if (doorElement.classList.contains('opened')) {
        // Si déjà ouvert, on ré-ouvre juste le modal sans animation de porte
        openModal(data);
        return;
    }

    if (!isDateAllowed(data.day)) {
        // Animation de refus
        doorElement.classList.add('locked');
        // Le CSS gère l'animation shake via la classe :hover ou active, 
        // mais on peut forcer un reflow si besoin. 
        // Ici, l'utilisateur verra le curseur "not-allowed" et l'animation CSS au survol.
        showToast(`Patience ! Tu ne peux pas encore ouvrir la case du ${data.day} décembre.`);
        return;
    }

    // Ouvre la porte
    doorElement.classList.add('opened');
    
    // Sauvegarde
    if (!openedDoors.includes(data.day)) {
        openedDoors.push(data.day);
        localStorage.setItem('adventCalendarOpened', JSON.stringify(openedDoors));
    }

    // Affiche le modal
    setTimeout(() => openModal(data), 300); // Petit délai pour l'animation
}

let toastTimeout;
let countdownInterval;

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastCountdown = document.getElementById('toast-countdown');
    const toastClose = document.getElementById('toast-close');
    
    if (toast && toastMessage) {
        // Reset précédent
        if (toastTimeout) clearTimeout(toastTimeout);
        if (countdownInterval) clearInterval(countdownInterval);
        
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('visible');
        
        // Compte à rebours visuel
        let secondsLeft = 4;
        toastCountdown.textContent = `Fermeture dans ${secondsLeft}s`;
        
        countdownInterval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft > 0) {
                toastCountdown.textContent = `Fermeture dans ${secondsLeft}s`;
            } else {
                clearInterval(countdownInterval);
                toastCountdown.textContent = "";
            }
        }, 1000);

        // Fonction de fermeture
        const hideToast = () => {
            toast.classList.remove('visible');
            setTimeout(() => toast.classList.add('hidden'), 500);
            if (countdownInterval) clearInterval(countdownInterval);
        };

        // Fermeture manuelle
        toastClose.onclick = hideToast;
        
        // Fermeture automatique après 4 secondes
        toastTimeout = setTimeout(hideToast, 4000);
    }
}

function openModal(data) {
    modalDate.textContent = `${data.day} Décembre`;
    modalCaption.textContent = data.caption;
    modalMediaContainer.innerHTML = '';

    if (data.type === 'image') {
        const img = document.createElement('img');
        img.src = data.src;
        img.alt = `Souvenir du jour ${data.day}`;
        modalMediaContainer.appendChild(img);
    } else if (data.type === 'video') {
        const video = document.createElement('video');
        video.src = data.src;
        video.controls = true;
        video.autoplay = true;
        modalMediaContainer.appendChild(video);
    }

    modal.classList.remove('hidden');
    modal.classList.add('visible');
}

function closeModal() {
    modal.classList.remove('visible');
    modal.classList.add('hidden');
    // Arrête la vidéo si elle joue
    const video = modalMediaContainer.querySelector('video');
    if (video) {
        video.pause();
    }
}

// Fermeture du modal
closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Génération des flocons en JS pour plus de contrôle
function createSnowflakes() {
    const container = document.querySelector('.snow-container');
    const snowflakeCount = 50;

    for (let i = 0; i < snowflakeCount; i++) {
        const flake = document.createElement('div');
        flake.classList.add('snowflake');
        flake.style.left = Math.random() * 100 + '%';
        flake.style.animationDuration = Math.random() * 3 + 5 + 's'; // Entre 5 et 8s
        flake.style.opacity = Math.random() * 0.5 + 0.2;
        flake.style.width = Math.random() * 3 + 2 + 'px';
        flake.style.height = flake.style.width;
        flake.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(flake);
    }
}

// GESTION MUSIQUE & OVERLAY
const bgMusic = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-toggle');
const welcomeOverlay = document.getElementById('welcome-overlay');
const enterBtn = document.getElementById('enter-site-btn');

// Fonction pour lancer la musique
function playMusic() {
    bgMusic.volume = 0.3; 
    bgMusic.play().then(() => {
        musicBtn.classList.remove('paused');
    }).catch(e => console.log("Audio error:", e));
}

// Clic sur le bouton "Entrer" de l'overlay
enterBtn.addEventListener('click', () => {
    // 1. Lancer la musique (interaction utilisateur directe = autorisé)
    playMusic();
    
    // 2. Cacher l'overlay avec une transition douce
    welcomeOverlay.classList.add('hidden');
    
    // 3. Supprimer l'overlay du DOM après la transition pour ne pas gêner
    setTimeout(() => {
        welcomeOverlay.style.display = 'none';
    }, 800);
});

// Fallback : Tente quand même de lancer si l'utilisateur a déjà interagi ou si le navigateur est permissif
playMusic();

musicBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    if (bgMusic.paused) {
        bgMusic.play();
        musicBtn.classList.remove('paused');
    } else {
        bgMusic.pause();
        musicBtn.classList.add('paused');
    }
});

// Initialisation
createSnowflakes();
initCalendar();

// TRAINEE MAGIQUE CURSEUR
document.addEventListener('mousemove', function(e) {
    if (Math.random() > 0.8) return; // Pas à chaque pixel pour performance

    const particle = document.createElement('div');
    particle.classList.add('magic-particle');
    particle.style.left = e.clientX + 'px';
    particle.style.top = e.clientY + 'px';
    
    document.body.appendChild(particle);

    setTimeout(() => {
        particle.remove();
    }, 800);
});
