import { GP_DATES, GP_NAMES, GP_REVEALED } from '../data/dataGP';

const DATE_FORMAT_OPTIONS = {
    day: 'numeric',
    month: 'long',
};

const TIME_FORMAT_OPTIONS = {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
};

const UNKNOWN_GP_NAME = 'Révélation à venir';
const UNKNOWN_GP_FALLBACK = 'À venir';

// Paramètres : dateTime (string ISO), locale (string). Retourne : chaîne formatée "8 mars 20h30".
function formatGpDate(dateTime, locale = 'fr-FR') {
    const date = new Date(dateTime);
    const datePart = new Intl.DateTimeFormat(
        locale,
        DATE_FORMAT_OPTIONS,
    ).format(date);
    const timePart = new Intl.DateTimeFormat(
        locale,
        TIME_FORMAT_OPTIONS,
    ).format(date);
    const formatted = `${datePart} ${timePart.replace(':', 'h')}`;

// Retire les accents (ex : "août" -> "aout")
    return formatted.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Parametres : a (Date), b (Date). Retourne : true si meme jour (annee/mois/jour).
function isSameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

// Paramètres : aucun. Retourne : tableau d'objets GP avec start/end, libellés et données de révélation.
export function getGpSchedule() {
    const gpById = Object.fromEntries(GP_NAMES.map((gp) => [gp.id, gp]));

    return GP_DATES.map((gpDate, index) => {
        const gpId = GP_REVEALED[index] ?? 0;
        const gp = gpById[gpId];
        const isKnown = gpId !== 0 && gp;
        const startLabel = formatGpDate(gpDate.startDateTime);

        return {
            id: gpDate.id,
            startDateTime: gpDate.startDateTime,
            endDateTime: gpDate.endDateTime,
            startLabel,
            isKnown,
            name: isKnown ? gp.name : '',
            country: isKnown ? gp.country : '',
            flag: isKnown ? gp.flag : '',
        };
    });
}

// Paramètres : now (Date), gp (élément du planning). Retourne : 'upcoming' | 'live' | 'finished' | 'unknown'.
function getGpStatus(now, gp) {
    if (!gp) return 'unknown';

    const start = new Date(gp.startDateTime);
    const end = new Date(gp.endDateTime);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'live';
    return 'finished';
}

// Paramètres : now (Date). Retourne : { gp, status } pour la fenêtre GP active (jusqu'à l'heure de fin).
function getActiveGp(now = new Date()) {
    const schedule = getGpSchedule();

    for (const gp of schedule) {
        const end = new Date(gp.endDateTime);

        if (now <= end) {
            return { gp, status: getGpStatus(now, gp) };
        }
    }

    return { gp: null, status: 'unknown' };
}

// Paramètres : now (Date), gpStartDateTime (string ISO). Retourne : { days, hours, minutes, seconds }.
function getCountdown(now, gpStartDateTime) {
    const target = new Date(gpStartDateTime);
    const diffMs = Math.max(0, target.getTime() - now.getTime());

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds };
}

// Paramètres : now (Date). Retourne : données formatées d'affichage pour la barre de statut.
export function getActiveGpDisplay(now = new Date()) {
    const { gp, status } = getActiveGp(now);

    if (!gp) {
        return {
            gp,
            status,
            phase: 'season-ended',
            dateTime: '',
            dateLabel: 'Date inconnue',
            gpName: UNKNOWN_GP_FALLBACK,
            countdownLabel: '--',
            statusLabel: '--',
            isLive: false,
        };
    }

    const gpName = gp.isKnown ? gp.name : UNKNOWN_GP_NAME;
    const gpCountry = gp.isKnown ? gp.country : '';
    const gpFlag = gp.isKnown ? gp.flag : '';
    const dateLabel = formatGpDate(gp.startDateTime);
    const start = new Date(gp.startDateTime);
    const countdown = getCountdown(now, gp.startDateTime);
    const countdownLabel =
        countdown.days > 0
            ? `${countdown.days}j ${countdown.hours}h ${countdown.minutes}min ${countdown.seconds}s`
            : countdown.hours > 0
            ? `${countdown.hours}h ${countdown.minutes}min ${countdown.seconds}s`
            : countdown.minutes > 0
            ? `${countdown.minutes}min ${countdown.seconds}s`
            : `${countdown.seconds}s`;

    const statusLabel =
        status === 'live'
            ? 'Grand Prix en cours'
            : status === 'unknown'
            ? 'Saison terminée'
            : countdownLabel;

    const phase =
        status === 'live'
            ? 'live'
            : status === 'unknown'
            ? 'season-ended'
            : isSameDay(now, start)
            ? 'today'
            : 'upcoming';

    return {
        gp,
        status,
        phase,
        dateTime: gp.startDateTime,
        dateLabel,
        gpName,
        gpCountry,
        gpFlag,
        countdownLabel,
        statusLabel,
        isLive: status === 'live',
    };
}
