// Configuration
const DEV_MODE = false; 

const calendarContainer = document.getElementById('calendar');
const modal = document.getElementById('media-modal');
const modalDate = document.getElementById('modal-date');
const modalMediaContainer = document.getElementById('modal-media-container');
const modalCaption = document.getElementById('modal-caption');
const closeBtn = document.querySelector('.close-btn');

// Données
const calendarData = (typeof GENERATED_CALENDAR_DATA !== 'undefined') 
    ? GENERATED_CALENDAR_DATA 
    : Array.from({ length: 25 }, (_, i) => ({
        day: i + 1,
        type: 'image',
        src: `https://placehold.co/600x400/165B33/FFF?text=Jour+${i + 1}`,
        caption: `Souvenir du jour ${i + 1}`
    }));

// Sauvegarde
let openedDoors = JSON.parse(localStorage.getItem('adventCalendarOpened')) || [];

// Nettoyage sécurité
if (!DEV_MODE) {
    const validOpenedDoors = openedDoors.filter(day => isDateAllowed(day));
    if (validOpenedDoors.length !== openedDoors.length) {
        openedDoors = validOpenedDoors;
        localStorage.setItem('adventCalendarOpened', JSON.stringify(openedDoors));
    }
}

// Initialisation sécurisée
function initCalendar() {
    if (!calendarContainer) return;
    calendarContainer.innerHTML = '';
    
    calendarData.forEach(data => {
        const door = document.createElement('div');
        door.classList.add('door');
        door.dataset.day = data.day;

        if (openedDoors.includes(data.day)) {
            door.classList.add('opened');
        } else if (!isDateAllowed(data.day)) {
            door.classList.add('locked');
        }

        const content = `
            <div class="ribbon ribbon-v"></div>
            <div class="ribbon ribbon-h"></div>
            <span class="day-number">${data.day}</span>
        `;
        door.innerHTML = content;

        // Toujours ouvrir le modal, même si verrouillé (demande utilisateur)
        door.addEventListener('click', () => handleDoorClick(door, data));

        calendarContainer.appendChild(door);
    });
}

function isDateAllowed(day) {
    if (DEV_MODE) return true;
    const now = new Date();
    const currentMonth = now.getMonth(); 
    const currentDay = now.getDate();
    // Si on est en Décembre (11) ou Janvier prochain
    if (currentMonth === 11) return currentDay >= day;
    if (currentMonth < 11 && now.getFullYear() > 2025) return true;
    return false;
}

function getWaitTimeParts(targetDay) {
    const now = new Date();
    // Cible : Décembre de l'année en cours
    const targetDate = new Date(now.getFullYear(), 11, targetDay, 0, 0, 0);
    let diff = targetDate - now;
    
    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
}

function handleDoorClick(doorElement, data) {
    // Si c'est permis, on marque ouvert
    if (isDateAllowed(data.day)) {
        doorElement.classList.add('opened');
        doorElement.classList.remove('locked');
        if (!openedDoors.includes(data.day)) {
            openedDoors.push(data.day);
            localStorage.setItem('adventCalendarOpened', JSON.stringify(openedDoors));
        }
    }
    // Dans tous les cas on ouvre le modal (qui gérera l'affichage Contenu vs Compte à rebours)
    openModal(data);
}

function openModal(data) {
    modalDate.textContent = `${data.day} Décembre`;
    modalMediaContainer.innerHTML = '';
    modalCaption.innerHTML = '';

    if (isDateAllowed(data.day)) {
        // AFFICHAGE MEDIA
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
        modalCaption.textContent = data.caption;
    } else {
        // AFFICHAGE COMPTE A REBOURS
        const wait = getWaitTimeParts(data.day);
        if (wait) {
            const msg = document.createElement('div');
            msg.className = 'modal-countdown-msg';
            msg.innerHTML = `
                <p>Patience... ce souvenir sera disponible dans :</p>
                <div class="countdown-timer">
                    <span>${wait.days}j</span>
                    <span>${wait.hours}h</span>
                    <span>${wait.minutes}m</span>
                </div>
                <p style="margin-top: 15px; font-size: 3rem;">🔒</p>
            `;
            modalMediaContainer.appendChild(msg);
        }
    }

    modal.classList.remove('hidden');
    modal.classList.add('visible');
}

function closeModal() {
    modal.classList.remove('visible');
    modal.classList.add('hidden');
    const video = modalMediaContainer.querySelector('video');
    if (video) video.pause();
}

if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (modal) modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// GLOBAL COUNTDOWN
function updateGlobalCountdown() {
    const countdownEl = document.getElementById('global-countdown');
    if (!countdownEl) return;

    const now = new Date();
    const christmas = new Date(now.getFullYear(), 11, 25, 0, 0, 0);
    if (now > christmas) christmas.setFullYear(now.getFullYear() + 1);

    const diff = christmas - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    countdownEl.textContent = `Noël dans : ${days}j ${hours}h ${minutes}m`;
}
setInterval(updateGlobalCountdown, 60000); // Update minute par minute suffisant
updateGlobalCountdown();

// MUSIQUE & OVERLAY
const bgMusic = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-toggle');
const welcomeOverlay = document.getElementById('welcome-overlay');
const enterBtn = document.getElementById('enter-site-btn');

function playMusic() {
    if (!bgMusic) return;
    bgMusic.volume = 0.3; 
    bgMusic.play().then(() => {
        if (musicBtn) musicBtn.classList.remove('paused');
    }).catch(e => console.log("Audio wait interaction"));
}

if (enterBtn && welcomeOverlay) {
    enterBtn.addEventListener('click', () => {
        playMusic();
        welcomeOverlay.classList.add('hidden');
        setTimeout(() => welcomeOverlay.style.display = 'none', 800);
    });
}

// Fallback click body
document.body.addEventListener('click', () => {
    if (bgMusic && bgMusic.paused) playMusic();
}, { once: true });

if (musicBtn) {
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
}

// PARTICULES
document.addEventListener('mousemove', function(e) {
    if (Math.random() > 0.8) return;
    const particle = document.createElement('div');
    particle.classList.add('magic-particle');
    particle.style.left = e.clientX + 'px';
    particle.style.top = e.clientY + 'px';
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
});

// INIT
function createSnowflakes() {
    const container = document.querySelector('.snow-container');
    if (!container) return;
    const snowflakeCount = 50;
    for (let i = 0; i < snowflakeCount; i++) {
        const flake = document.createElement('div');
        flake.classList.add('snowflake');
        flake.style.left = Math.random() * 100 + '%';
        flake.style.animationDuration = Math.random() * 3 + 5 + 's';
        flake.style.opacity = Math.random() * 0.5 + 0.2;
        flake.style.width = Math.random() * 3 + 2 + 'px';
        flake.style.height = flake.style.width;
        flake.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(flake);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    createSnowflakes();
    initCalendar();
    playMusic(); // Try auto play on load
});