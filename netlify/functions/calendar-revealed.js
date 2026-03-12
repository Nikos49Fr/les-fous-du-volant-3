import { getDb } from './_firebase-admin.js';
import { getCurrentTwitchUser, isAdminLogin } from './_twitch-auth.js';

const COLLECTION = 'calendar';
const DOCUMENT = 'season3';

function sanitizeRevealed(input) {
    if (!Array.isArray(input)) {
        return null;
    }

    const normalized = input
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= 12);

    const unique = [...new Set(normalized)];
    unique.sort((a, b) => a - b);
    return unique;
}

function json(statusCode, payload) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    };
}

async function handleGet() {
    const db = getDb();
    const ref = db.collection(COLLECTION).doc(DOCUMENT);
    const snap = await ref.get();

    if (!snap.exists) {
        return json(200, { revealed: [] });
    }

    const data = snap.data() ?? {};
    const revealed = sanitizeRevealed(data.revealed ?? []) ?? [];
    return json(200, { revealed });
}

async function handlePost(event) {
    const user = await getCurrentTwitchUser(event);

    if (!user || !isAdminLogin(user.login)) {
        return json(403, { error: 'Forbidden' });
    }

    let payload;
    try {
        payload = JSON.parse(event.body ?? '{}');
    } catch {
        return json(400, { error: 'Invalid JSON body' });
    }

    const revealed = sanitizeRevealed(payload.revealed);
    if (!revealed) {
        return json(400, { error: 'Field "revealed" must be an array of GP ids' });
    }

    const db = getDb();
    const ref = db.collection(COLLECTION).doc(DOCUMENT);

    await ref.set(
        {
            revealed,
            updatedAt: new Date().toISOString(),
            updatedBy: {
                twitchId: user.id ?? '',
                login: user.login ?? '',
            },
        },
        { merge: true },
    );

    return json(200, { ok: true, revealed });
}

export async function handler(event) {
    if (event.httpMethod === 'GET') {
        return handleGet();
    }

    if (event.httpMethod === 'POST') {
        return handlePost(event);
    }

    return json(405, { error: 'Method not allowed' });
}
