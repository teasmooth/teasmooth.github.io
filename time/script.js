// Ora X – 5 Round, punteggio morbido, orologio 24h (una rotazione = 24 ore)

const canvas = document.getElementById("clockCanvas");
const ctx = canvas.getContext("2d");

const confirmButton = document.getElementById("confirmButton");
const nextButton = document.getElementById("nextButton");
const clueEl = document.getElementById("clue");
const messageEl = document.getElementById("message");
const currentTimeEl = document.getElementById("currentTime");
const roundLabelEl = document.getElementById("roundLabel");
const scoresPanel = document.getElementById("scoresPanel");
const scoresList = document.getElementById("scoresList");
const averageScoreEl = document.getElementById("averageScore");
const restartGameBtn = document.getElementById("restartGame");

const TOTAL_ROUNDS = 5;

const clueSets = {
    nightDeep: [
        "È un’ora in cui la città dorme profondamente: tra mezzanotte e l’alba.",
        "Il mondo è immobile: siamo nelle ore più buie della notte.",
        "Solo i nottambuli e i sogni sono svegli: è notte fonda.",
        "Un momento in cui il silenzio domina completamente.",
        "Le strade sono vuote e il cielo è nero: siamo nel cuore della notte.",
        "Un’ora in cui anche i pensieri parlano piano.",
        "La notte è al suo punto più profondo.",
        "Un orario che appartiene solo a chi non riesce a dormire.",
        "Il mondo è avvolto nel buio più totale.",
        "Un’ora in cui il tempo sembra sospeso.",
        "La luna è alta e la città tace.",
        "Un momento che pochi vedono davvero.",
        "Un’ora che vive tra sogno e realtà.",
        "Il silenzio è così forte da sembrare un suono.",
        "Un orario che appartiene solo alla notte più scura."
    ],
    dawn: [
        "È un’ora tra il primo chiarore e il risveglio del mondo.",
        "La luce inizia appena a comparire: siamo all’alba.",
        "Il cielo cambia colore, ma il sole non è ancora alto.",
        "Un momento in cui la notte sta finendo.",
        "Le prime luci del giorno stanno arrivando.",
        "Un’ora fresca, silenziosa, tra buio e mattino.",
        "Il mondo si sveglia lentamente.",
        "Un orario che profuma di inizio.",
        "Il cielo è chiaro ma il sole è ancora basso.",
        "Un’ora in cui i primi rumori del giorno iniziano a sentirsi.",
        "La città si stiracchia.",
        "Un momento fragile tra notte e giorno.",
        "Il cielo è pastello, non ancora luminoso.",
        "Un’ora che anticipa il mattino vero e proprio.",
        "Un orario che appartiene ai primi risvegli."
    ],
    morning: [
        "È un’ora piena di luce: la mattina è già iniziata.",
        "Il sole è alto abbastanza da illuminare tutto.",
        "La giornata è in pieno movimento.",
        "Un orario tipico di chi lavora o studia.",
        "La mattina è ormai ben avviata.",
        "Un’ora energica, luminosa.",
        "Il mondo è completamente sveglio.",
        "Un orario in cui il traffico è vivo.",
        "La luce è forte e chiara.",
        "Un’ora che sa di routine mattutina.",
        "Il sole è già salito parecchio.",
        "Un momento molto attivo della giornata.",
        "La mattina è nel suo pieno.",
        "Un orario ideale per iniziare attività.",
        "La giornata è già ben avviata."
    ],
    afternoon: [
        "È un’ora del pomeriggio, quando il sole è ancora alto.",
        "La luce è calda e piena.",
        "Il giorno è maturo, non più giovane.",
        "Un orario tipico delle attività pomeridiane.",
        "Il sole inizia lentamente a scendere.",
        "Un momento tranquillo ma ancora luminoso.",
        "Il pomeriggio è nel suo pieno.",
        "Un’ora che invita alla calma.",
        "La giornata è oltre la metà.",
        "Un orario in cui le ombre iniziano ad allungarsi.",
        "Il sole è ancora forte ma meno aggressivo.",
        "Un momento di transizione verso la sera.",
        "Un’ora che sa di metà giornata avanzata.",
        "Il pomeriggio è ben inoltrato.",
        "Un orario caldo e disteso."
    ],
    evening: [
        "È un’ora in cui la luce sta svanendo: siamo verso sera.",
        "Il sole è basso e il cielo si colora.",
        "La giornata sta finendo.",
        "Un orario tipico della cena o del rientro a casa.",
        "Le luci della città iniziano ad accendersi.",
        "Un momento che profuma di sera.",
        "Le ombre sono lunghe e morbide.",
        "Il cielo è arancione, rosa o viola.",
        "Un’ora che segna la fine delle attività.",
        "La luce è debole ma ancora presente.",
        "Un orario che invita al relax.",
        "Il giorno sta cedendo alla notte.",
        "Un momento perfetto per una passeggiata serale.",
        "La città cambia ritmo.",
        "Un’ora che appartiene alla sera vera e propria."
    ],
    lateNight: [
        "È un’ora tarda, quando molti dormono già.",
        "La notte è iniziata da un po’, ma non è profonda.",
        "Le strade sono tranquille ma non deserte.",
        "Un orario tipico dei nottambuli.",
        "La città è silenziosa ma non spenta.",
        "Un momento tra sera e notte.",
        "Le luci artificiali dominano la scena.",
        "Un’ora in cui il mondo rallenta.",
        "La notte è giovane ma già scura.",
        "Un orario che appartiene ai pensieri.",
        "Il silenzio cresce, ma non è totale.",
        "Un momento di quiete dopo la giornata.",
        "La notte è iniziata davvero.",
        "Un’ora che invita alla riflessione.",
        "Un orario in cui il tempo sembra più lento."
    ]
};


const roundsConfig = [
    {
        label: "Round 1 di 5",
        clue: "Un’ora in cui il mondo è sveglio ma ancora silenzioso.",
        minMinutes: 5 * 60,
        maxMinutes: 8 * 60
    },
    {
        label: "Round 2 di 5",
        clue: "Il sole è alto e la giornata sembra infinita.",
        minMinutes: 9 * 60,
        maxMinutes: 12 * 60
    },
    {
        label: "Round 3 di 5",
        clue: "Il pomeriggio si trascina lento, come se avesse sonno.",
        minMinutes: 13 * 60,
        maxMinutes: 17 * 60
    },
    {
        label: "Round 4 di 5",
        clue: "La città si illumina e l’aria profuma di sera.",
        minMinutes: 18 * 60,
        maxMinutes: 21 * 60
    },
    {
        label: "Round 5 di 5",
        clue: "Un momento in cui solo i nottambuli conoscono il colore del cielo.",
        minMinutes: 22 * 60,
        maxMinutes: 3 * 60 + 59
    }
];

let currentRound = 0;
let targetMinutes = 0;      // 0–1439
let scores = [];
let roundFinished = false;

// stato tempo: totale minuti 0–1439
let totalMinutes = 12 * 60; // default 12:00

let center = { x: canvas.width / 2, y: canvas.height / 2 };
let radius = canvas.width * 0.4;

let draggingHand = null; // "minute" | "hour" | null

// ---------- Utility tempo ----------

function formatTime24(total) {
    let h = Math.floor(total / 60);
    let m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function circularDistance(a, b) {
    let diff = Math.abs(a - b);
    return Math.min(diff, 1440 - diff);
}

// Determina fascia oraria
function getTimeCategory(mins) {
    if (mins < 5 * 60) return "nightDeep";          // 00:00–04:59
    if (mins < 9 * 60) return "dawn";               // 05:00–08:59
    if (mins < 12 * 60) return "morning";           // 09:00–11:59
    if (mins < 18 * 60) return "afternoon";         // 12:00–17:59
    if (mins < 22 * 60) return "evening";           // 18:00–21:59
    return "lateNight";                             // 22:00–23:59
}

// ---------- Setup round ----------



function randomInRange(min, max) {
    if (min <= max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    } else {
        const len1 = 1440 - min;
        const len2 = max + 1;
        const total = len1 + len2;
        const r = Math.floor(Math.random() * total);
        if (r < len1) return min + r;
        return r - len1;
    }
}

// Genera un round completamente casuale
function setupRound(index) {
    roundFinished = false;
    confirmButton.disabled = false;
    nextButton.disabled = true;
    scoresPanel.classList.add("hidden");

    // Orario casuale 0–1439
    targetMinutes = Math.floor(Math.random() * 1440);

    // Determina fascia e indizio
    const category = getTimeCategory(targetMinutes);
    const clues = clueSets[category];
    const clue = clues[Math.floor(Math.random() * clues.length)];

    roundLabelEl.textContent = `Round ${index + 1} di ${TOTAL_ROUNDS}`;
    clueEl.textContent = clue;
    messageEl.textContent = "Trascina le lancette e conferma il tuo orario.";

    // Reset orologio
    totalMinutes = 12 * 60; // 12:00
    updateCurrentTimeLabel();
    drawClock();

    // Rimuovi eventuale badge precedente
    const oldBadge = document.querySelector(".score-badge");
    if (oldBadge) oldBadge.remove();
}

// ---------- Disegno orologio ----------

function drawClockFace() {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createRadialGradient(
        center.x, center.y - radius * 0.6, radius * 0.1,
        center.x, center.y, radius * 1.1
    );
    grad.addColorStop(0, "#020617");
    grad.addColorStop(1, "#020617");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#020617";
    ctx.fill();
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 4;
    ctx.stroke();

    for (let i = 0; i < 60; i++) {
        const angle = (i * 6 - 90) * Math.PI / 180;
        const outer = radius - 6;
        const inner = i % 5 === 0 ? radius - 18 : radius - 12;

        const x1 = center.x + Math.cos(angle) * outer;
        const y1 = center.y + Math.sin(angle) * outer;
        const x2 = center.x + Math.cos(angle) * inner;
        const y2 = center.y + Math.sin(angle) * inner;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 5 === 0 ? "#4b5563" : "#1f2937";
        ctx.lineWidth = i % 5 === 0 ? 3 : 1;
        ctx.stroke();
    }

    ctx.fillStyle = "#9ca3af";
    ctx.font = "18px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const labels = [
        { text: "12", angle: -90 },
        { text: "3", angle: 0 },
        { text: "6", angle: 90 },
        { text: "9", angle: 180 }
    ];

    labels.forEach(l => {
        const rad = l.angle * Math.PI / 180;
        const x = center.x + Math.cos(rad) * (radius - 34);
        const y = center.y + Math.sin(rad) * (radius - 34);
        ctx.fillText(l.text, x, y);
    });

    ctx.restore();
}

function drawHands() {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    // minuti: 60 min = 360°
    const minuteAngle = (m * 6 - 90) * Math.PI / 180;

    // ore: 24h = 360° → 1h = 15° → totalMinutes/4 gradi
    const hourAngle = (totalMinutes / 4 - 90) * Math.PI / 180;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(
        center.x + Math.cos(minuteAngle) * (radius - 26),
        center.y + Math.sin(minuteAngle) * (radius - 26)
    );
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(56,189,248,0.6)";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(
        center.x + Math.cos(hourAngle) * (radius - 52),
        center.y + Math.sin(hourAngle) * (radius - 52)
    );
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(249,115,22,0.6)";
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(center.x, center.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#e5e7eb";
    ctx.fill();
}

function drawClock() {
    center = { x: canvas.width / 2, y: canvas.height / 2 };
    radius = canvas.width * 0.4;
    drawClockFace();
    drawHands();
}

// ---------- Interazione lancette ----------

function getAngleFromPoint(x, y) {
    const dx = x - center.x;
    const dy = y - center.y;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
}

function getHandFromPoint(x, y) {
    const dx = x - center.x;
    const dy = y - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius + 20) return null;

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    const angle = getAngleFromPoint(x, y);
    const minuteAngle = (m * 6) % 360;
    const hourAngle = (totalMinutes / 4) % 360;

    const diffMinute = Math.min(
        Math.abs(angle - minuteAngle),
        360 - Math.abs(angle - minuteAngle)
    );
    const diffHour = Math.min(
        Math.abs(angle - hourAngle),
        360 - Math.abs(angle - hourAngle)
    );

    if (diffMinute < 18 && dist > radius * 0.45) return "minute";
    if (diffHour < 22) return "hour";
    return null;
}

function setTimeFromAngle(hand, angle) {
    if (hand === "minute") {
        // nuovo minuto da angolo
        let newMinute = Math.round(angle / 6) % 60;
        if (newMinute < 0) newMinute += 60;

        const oldMinute = totalMinutes % 60;
        let delta = newMinute - oldMinute;
        if (delta > 30) delta -= 60;
        if (delta < -30) delta += 60;

        totalMinutes = (totalMinutes + delta + 1440) % 1440;
    } else if (hand === "hour") {
        // 24h su 360° → 1h = 15°
        let newHourFloat = angle / 360 * 24; // 0–24
        if (newHourFloat < 0) newHourFloat += 24;
        let newTotalFromAngle = Math.round(newHourFloat * 60) % 1440;

        // scegli il delta minimo (continuità)
        let diff = newTotalFromAngle - totalMinutes;
        if (diff > 720) diff -= 1440;
        if (diff < -720) diff += 1440;

        totalMinutes = (totalMinutes + diff + 1440) % 1440;
    }

    updateCurrentTimeLabel();
    drawClock();
}

function pointerPos(evt) {
    const rect = canvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
}

function onPointerDown(evt) {
    if (roundFinished) return;
    evt.preventDefault();
    const { x, y } = pointerPos(evt);
    draggingHand = getHandFromPoint(x, y);
    if (draggingHand) {
        const angle = getAngleFromPoint(x, y);
        setTimeFromAngle(draggingHand, angle);
    }
}

function onPointerMove(evt) {
    if (!draggingHand || roundFinished) return;
    evt.preventDefault();
    const { x, y } = pointerPos(evt);
    const angle = getAngleFromPoint(x, y);
    setTimeFromAngle(draggingHand, angle);
}

function onPointerUp() {
    draggingHand = null;
}

// ---------- Punteggio ----------

function computeScore() {
    const dist = circularDistance(totalMinutes, targetMinutes);

    // Curva molto più generosa:
    // 10 * e^-( (dist/180)^2 )
    // - 0–30 min → 9.5–10
    // - 30–90 min → 8–9.5
    // - 90–180 min → 6–8
    // - 180–360 min → 3–6
    // - oltre → minimo 1
    let raw = 10 * Math.exp(-Math.pow(dist / 180, 2));

    if (raw < 1) raw = 1;
    if (raw > 10) raw = 10;

    return { score: Math.round(raw * 10) / 10, dist };
}


// ---------- Logica round ----------

function updateCurrentTimeLabel() {
    currentTimeEl.textContent = formatTime24(totalMinutes);
}

function handleConfirm() {
    if (roundFinished) return;

    // Rimuovi eventuale badge precedente
    const oldBadge = document.querySelector(".score-badge");
    if (oldBadge) oldBadge.remove();

    const { score, dist } = computeScore();
    scores[currentRound] = score;
    roundFinished = true;
    confirmButton.disabled = true;
    nextButton.disabled = currentRound >= TOTAL_ROUNDS - 1;

    // Crea badge punteggio
    const badge = document.createElement("div");
    badge.className = "score-badge";
    badge.textContent = `Punteggio: ${score.toFixed(1)} / 10`;
    messageEl.insertAdjacentElement("afterend", badge);

    const targetStr = formatTime24(targetMinutes);
    messageEl.textContent =
        `Punteggio round: ${score.toFixed(1)} / 10. ` +
        `L'orario da indovinare era ${targetStr}. ` +
        `Sei distante circa ${dist} minuti.`;

    if (currentRound === TOTAL_ROUNDS - 1) {
        showFinalScores();
    }
}

function showFinalScores() {
    // Crea overlay
    const overlay = document.createElement("div");
    overlay.className = "final-overlay";

    const box = document.createElement("div");
    box.className = "final-box";

    const title = document.createElement("h2");
    title.textContent = "Risultati finali";

    const list = document.createElement("ul");
    let sum = 0;
    scores.forEach((s, i) => {
        const li = document.createElement("li");
        li.textContent = `Round ${i + 1}: ${s.toFixed(1)} / 10`;
        list.appendChild(li);
        sum += s;
    });

    const avg = document.createElement("div");
    avg.className = "average";
    avg.textContent = `Media: ${(sum / scores.length).toFixed(1)} / 10`;

    const restartBtn = document.createElement("button");
    restartBtn.textContent = "Ricomincia partita";
    restartBtn.onclick = () => {
        overlay.remove();
        handleRestartGame();
    };

    box.appendChild(title);
    box.appendChild(list);
    box.appendChild(avg);
    box.appendChild(restartBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}


function handleNextRound() {
    if (!roundFinished) return;
    if (currentRound >= TOTAL_ROUNDS - 1) return;
    currentRound++;
    setupRound(currentRound);
}

function handleRestartGame() {
    scores = [];
    currentRound = 0;
    scoresPanel.classList.add("hidden");
    setupRound(0);
}

// ---------- Eventi ----------

canvas.addEventListener("mousedown", onPointerDown);
canvas.addEventListener("mousemove", onPointerMove);
window.addEventListener("mouseup", onPointerUp);

canvas.addEventListener("touchstart", onPointerDown, { passive: false });
canvas.addEventListener("touchmove", onPointerMove, { passive: false });
canvas.addEventListener("touchend", onPointerUp);

confirmButton.addEventListener("click", handleConfirm);
nextButton.addEventListener("click", handleNextRound);
restartGameBtn.addEventListener("click", handleRestartGame);

// ---------- Avvio ----------

setupRound(0);
window.addEventListener("resize", () => {
    drawClock();
});
