const REVEALED_URL = '/api/calendar/revealed';

function normalizeRevealed(input) {
    if (!Array.isArray(input)) {
        return null;
    }

    if (input.length !== 12) {
        return null;
    }

    const normalized = input.map((value) => Number(value));
    const valid = normalized.every(
        (value) => Number.isInteger(value) && value >= 0 && value <= 24,
    );

    if (!valid) {
        return null;
    }

    return normalized;
}

export async function fetchCalendarData() {
    const response = await fetch(REVEALED_URL, { credentials: 'include' });

    if (!response.ok) {
        throw new Error(`Calendar API failed with ${response.status}`);
    }

    const body = await response.json();
    const revealed = normalizeRevealed(body.revealed);

    if (!revealed) {
        throw new Error('Invalid calendar API payload');
    }

    return {
        revealed,
        canEdit: Boolean(body.canEdit),
    };
}

export async function fetchRevealedGpIds() {
    const data = await fetchCalendarData();
    return data.revealed;
}

export async function updateRevealedGpIds(revealed) {
    const response = await fetch(REVEALED_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ revealed }),
    });

    const body = await response.json();
    if (!response.ok) {
        throw new Error(body.error ?? `Calendar update failed with ${response.status}`);
    }

    const normalized = normalizeRevealed(body.revealed);
    if (!normalized) {
        throw new Error('Invalid calendar API response after update');
    }

    return normalized;
}
