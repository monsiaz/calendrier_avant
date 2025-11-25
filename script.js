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

// NETTOYAGE DE SÉCURITÉ
if (!DEV_MODE) {
    const validOpenedDoors = openedDoors.filter(day => isDateAllowed(day));
    if (validOpenedDoors.length !== openedDoors.length) {
        console.log("Correction des données : fermeture des cases ouvertes par erreur.");
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

        if (openedDoors.includes(data.day)) {
            door.classList.add('opened');
        }

        const content = `
            <div class="ribbon ribbon-v"></div>
            <div class="ribbon ribbon-h"></div>
            <span class="day-number">${data.day}</span>
        `;
        door.innerHTML = content;

        door.addEventListener('click', () => handleDoorClick(door, data));

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

    if (currentMonth === 11) {
        return currentDay >= day;
    } else if (currentMonth < 11 && now.getFullYear() > 2025) { 
        return true;
    }
    
    return false;
}

// CALCUL TEMPS ATTENTE
function getWaitTimeMessage(targetDay) {
    const now = new Date();
    // Cible : Décembre de l'année en cours
    const targetDate = new Date(now.getFullYear(), 11, targetDay, 0, 0, 0);
    
    // Si on est avant décembre, la cible est le jour J en décembre
    // Si on est déjà en décembre mais avant le jour, la cible est correcte
    // Si on est après, ça n'arrivera pas car la case serait ouverte
    
    let diff = targetDate - now;
    
    if (diff <= 0) return "C'est le moment !";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let parts = [];
    if (days > 0) parts.push(`${days}j`);
    if (hours > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);

    return `Disponible dans : ${parts.join(' ')}`;
}

function handleDoorClick(doorElement, data) {
    if (doorElement.classList.contains('opened')) {
        openModal(data);
        return;
    }

    if (!isDateAllowed(data.day)) {
        doorElement.classList.add('locked');
        const waitTime = getWaitTimeMessage(data.day);
        showToast(`Patience ! ${waitTime}`);
        return;
    }

    doorElement.classList.add('opened');
    
    if (!openedDoors.includes(data.day)) {
        openedDoors.push(data.day);
        localStorage.setItem('adventCalendarOpened', JSON.stringify(openedDoors));
    }

    setTimeout(() => openModal(data), 300);
}

// GESTION TOAST AVEC COMPTE A REBOURS FERMETURE
let toastTimeout;
let countdownInterval;

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastCountdown = document.getElementById('toast-countdown');
    const toastClose = document.getElementById('toast-close');
    
    if (toast && toastMessage) {
        if (toastTimeout) clearTimeout(toastTimeout);
        if (countdownInterval) clearInterval(countdownInterval);
        
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('visible');
        
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

        const hideToast = () => {
            toast.classList.remove('visible');
            setTimeout(() => toast.classList.add('hidden'), 500);
            if (countdownInterval) clearInterval(countdownInterval);
        };

        toastClose.onclick = hideToast;
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
    const video = modalMediaContainer.querySelector('video');
    if (video) {
        video.pause();
    }
}

closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// COMPTE A REBOURS GLOBAL (Noël)
function updateGlobalCountdown() {
    const countdownEl = document.getElementById('global-countdown');
    if (!countdownEl) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const christmas = new Date(currentYear, 11, 25, 0, 0, 0); // 25 Décembre

    // Si passé, vise l'année prochaine ou affiche "Joyeux Noël"
    if (now > christmas) {
        // Si on est le 25, Joyeux Noël
        if (now.getDate() === 25 && now.getMonth() === 11) {
            countdownEl.textContent = "🎄 Joyeux Noël ! 🎄";
            return;
        }
        // Sinon année prochaine (optionnel, ou on cache)
        christmas.setFullYear(currentYear + 1);
    }

    const diff = christmas - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    countdownEl.textContent = `Noël dans : ${days}j ${hours}h ${minutes}m ${seconds}s`;
}

setInterval(updateGlobalCountdown, 1000);
updateGlobalCountdown(); // Lance direct

// GESTION MUSIQUE & OVERLAY
const bgMusic = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-toggle');
const welcomeOverlay = document.getElementById('welcome-overlay');
const enterBtn = document.getElementById('enter-site-btn');

function playMusic() {
    bgMusic.volume = 0.3; 
    bgMusic.play().then(() => {
        musicBtn.classList.remove('paused');
    }).catch(e => console.log("Audio error:", e));
}

enterBtn.addEventListener('click', () => {
    playMusic();
    welcomeOverlay.classList.add('hidden');
    setTimeout(() => {
        welcomeOverlay.style.display = 'none';
    }, 800);
});

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

// TRAINEE MAGIQUE CURSEUR
document.addEventListener('mousemove', function(e) {
    if (Math.random() > 0.8) return; 

    const particle = document.createElement('div');
    particle.classList.add('magic-particle');
    particle.style.left = e.clientX + 'px';
    particle.style.top = e.clientY + 'px';
    
    document.body.appendChild(particle);

    setTimeout(() => {
        particle.remove();
    }, 800);
});

// Initialisation
createSnowflakes();
initCalendar();