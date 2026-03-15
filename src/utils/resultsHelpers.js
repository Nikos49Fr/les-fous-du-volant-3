import { GP_DATES } from '../data/dataGP';
import { getGpSchedule } from './gpHelpers';

export const RESULTS_WRITE_CAPABILITY = 'results.write';
export const RESULTS_MAIN_TAB_TOURNAMENT = 'tournament';
export const RESULTS_MAIN_TAB_GP = 'gp';
export const RESULTS_SESSION_TYPES = [
    'sprint_qualifying',
    'sprint',
    'race_qualifying',
    'race',
];
export const RESULTS_STATUS_OPTIONS = ['DNS', 'DNF', 'ABS', 'DSQ'];
export const RESULTS_STATUS_DISPLAY_ORDER = ['DNF', 'DNS', 'DSQ', 'ABS'];

const SESSION_LABELS = {
    sprint_qualifying: 'Qualif sprint',
    sprint: 'Sprint',
    race_qualifying: 'Qualif course',
    race: 'Course',
};

const SPRINT_POINTS = {
    1: 15,
    2: 13,
    3: 11,
    4: 9,
    5: 8,
    6: 7,
    7: 6,
    8: 5,
    9: 4,
    10: 3,
    11: 2,
    12: 1,
};

const RACE_POINTS = {
    1: 30,
    2: 26,
    3: 23,
    4: 20,
    5: 18,
    6: 16,
    7: 14,
    8: 12,
    9: 10,
    10: 8,
    11: 6,
    12: 5,
    13: 4,
    14: 3,
    15: 2,
    16: 1,
};

export function getResultsSessionLabel(sessionType) {
    return SESSION_LABELS[sessionType] ?? sessionType;
}

export function sessionSupportsFastestLap(sessionType) {
    return sessionType === 'sprint' || sessionType === 'race';
}

export function getResultsPointsForEntry(sessionType, entry) {
    if (!entry || entry.position == null) {
        return 0;
    }

    const basePoints =
        sessionType === 'sprint'
            ? (SPRINT_POINTS[entry.position] ?? 0)
            : sessionType === 'race'
              ? (RACE_POINTS[entry.position] ?? 0)
              : 0;

    return basePoints + (entry.hasFastestLap ? 1 : 0);
}

export function buildResultsSchedule(revealedIds) {
    return getGpSchedule(revealedIds);
}

export function getLastStartedGpRound(now = new Date()) {
    let lastStarted = GP_DATES[0]?.id ?? 1;

    GP_DATES.forEach((gpDate) => {
        if (new Date(gpDate.startDateTime) <= now) {
            lastStarted = gpDate.id;
        }
    });

    return lastStarted;
}

export function buildResultsSessionsByRound(sessionRows, entryRows) {
    const sessionsByRound = {};
    const entriesBySessionId = new Map();

    (entryRows ?? []).forEach((entry) => {
        const current = entriesBySessionId.get(entry.session_id) ?? [];
        current.push({
            driverId: entry.driver_id,
            position: entry.position,
            status: entry.status,
            hasFastestLap: entry.has_fastest_lap === true,
        });
        entriesBySessionId.set(entry.session_id, current);
    });

    (sessionRows ?? []).forEach((session) => {
        const round = Number(session.gp_round);
        if (!sessionsByRound[round]) {
            sessionsByRound[round] = {};
        }

        sessionsByRound[round][session.session_type] = {
            id: session.id,
            gpRound: round,
            sessionType: session.session_type,
            fastestLapDriverId: session.fastest_lap_driver_id ?? null,
            entries: (entriesBySessionId.get(session.id) ?? []).sort((a, b) => {
                if (a.position != null && b.position != null) {
                    return a.position - b.position;
                }
                if (a.position != null) return -1;
                if (b.position != null) return 1;
                const aStatusIndex = RESULTS_STATUS_DISPLAY_ORDER.indexOf(a.status);
                const bStatusIndex = RESULTS_STATUS_DISPLAY_ORDER.indexOf(b.status);
                return aStatusIndex - bStatusIndex;
            }),
        };
    });

    return sessionsByRound;
}

export function createEditorState(drivers, session) {
    const driverIds = drivers.map((driver) => driver.id);
    const entryByDriverId = new Map((session?.entries ?? []).map((entry) => [entry.driverId, entry]));
    const classifiedDriverIds = [];
    const statusByDriverId = {};

    driverIds.forEach((driverId) => {
        const entry = entryByDriverId.get(driverId);
        if (entry?.status) {
            statusByDriverId[driverId] = entry.status;
            return;
        }
        classifiedDriverIds.push({
            driverId,
            position: entry?.position ?? Number.MAX_SAFE_INTEGER,
        });
    });

    classifiedDriverIds.sort((a, b) => a.position - b.position);

    return {
        classifiedDriverIds: classifiedDriverIds.map((item) => item.driverId),
        statusByDriverId,
        fastestLapDriverId:
            sessionSupportsFastestLap(session?.sessionType)
                ? session?.fastestLapDriverId ?? null
                : null,
    };
}

export function moveItem(array, fromIndex, toIndex) {
    const next = [...array];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    return next;
}

export function buildEditorPayload(drivers, editorState) {
    const entries = [];

    editorState.classifiedDriverIds.forEach((driverId, index) => {
        entries.push({
            driverId,
            position: index + 1,
            status: null,
            hasFastestLap: editorState.fastestLapDriverId === driverId,
        });
    });

    drivers.forEach((driver) => {
        const status = editorState.statusByDriverId[driver.id] ?? null;
        if (!status) return;

        entries.push({
            driverId: driver.id,
            position: null,
            status,
            hasFastestLap: false,
        });
    });

    return entries;
}

export function buildTournamentDriverStandings(drivers, sessionsByRound) {
    const rows = drivers.map((driver) => ({
        driver,
        points: 0,
    }));
    const byDriverId = new Map(rows.map((row) => [row.driver.id, row]));

    Object.values(sessionsByRound).forEach((roundSessions) => {
        ['sprint', 'race'].forEach((sessionType) => {
            const session = roundSessions?.[sessionType];
            (session?.entries ?? []).forEach((entry) => {
                const row = byDriverId.get(entry.driverId);
                if (!row) return;
                row.points += getResultsPointsForEntry(sessionType, entry);
            });
        });
    });

    return rows
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return a.driver.displayName.localeCompare(b.driver.displayName);
        })
        .map((row, index) => ({
            position: index + 1,
            ...row,
        }));
}

export function buildTournamentTeamStandings(drivers, sessionsByRound) {
    const driverStandings = buildTournamentDriverStandings(drivers, sessionsByRound);
    const byTeamId = new Map();

    driverStandings.forEach((row) => {
        const current = byTeamId.get(row.driver.team.id) ?? {
            team: row.driver.team,
            points: 0,
        };
        current.points += row.points;
        byTeamId.set(row.driver.team.id, current);
    });

    return Array.from(byTeamId.values())
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return a.team.name.localeCompare(b.team.name);
        })
        .map((row, index) => ({
            position: index + 1,
            ...row,
        }));
}

function sortResultEntriesForDisplay(entries, driversById) {
    return [...(entries ?? [])].sort((a, b) => {
        if (a.position != null && b.position != null) {
            return a.position - b.position;
        }
        if (a.position != null) return -1;
        if (b.position != null) return 1;

        const aStatusIndex = RESULTS_STATUS_DISPLAY_ORDER.indexOf(a.status);
        const bStatusIndex = RESULTS_STATUS_DISPLAY_ORDER.indexOf(b.status);
        if (aStatusIndex !== bStatusIndex) {
            return aStatusIndex - bStatusIndex;
        }

        return (driversById.get(a.driverId)?.displayName ?? '').localeCompare(
            driversById.get(b.driverId)?.displayName ?? '',
        );
    });
}

export function buildGpSessionRows(drivers, resultSession, qualifyingSession, sessionType) {
    const driversById = new Map(drivers.map((driver) => [driver.id, driver]));
    const qualifyingEntryByDriverId = new Map(
        (qualifyingSession?.entries ?? []).map((entry) => [entry.driverId, entry]),
    );

    return sortResultEntriesForDisplay(resultSession?.entries ?? [], driversById).map(
        (entry) => {
            const driver = driversById.get(entry.driverId);
            const qualifyingEntry = qualifyingEntryByDriverId.get(entry.driverId) ?? null;

            return {
                driver,
                entry,
                qualifyingEntry,
                points: getResultsPointsForEntry(sessionType, entry),
            };
        },
    );
}

export function getGridDelta(resultPosition, gridPosition) {
    if (!Number.isInteger(resultPosition) || !Number.isInteger(gridPosition)) {
        return {
            direction: 'flat',
            value: 0,
        };
    }

    const delta = gridPosition - resultPosition;
    if (delta > 0) {
        return { direction: 'up', value: delta };
    }
    if (delta < 0) {
        return { direction: 'down', value: Math.abs(delta) };
    }
    return { direction: 'flat', value: 0 };
}
