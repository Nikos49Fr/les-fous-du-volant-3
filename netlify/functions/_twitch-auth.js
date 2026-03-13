const USERS_URL = 'https://api.twitch.tv/helix/users';
import { getDb } from './_firebase-admin.js';

function parseCookies(cookieHeader = '') {
    return cookieHeader.split(';').reduce((acc, part) => {
        const [rawKey, ...rawVal] = part.trim().split('=');
        if (!rawKey) return acc;
        acc[rawKey] = decodeURIComponent(rawVal.join('=') || '');
        return acc;
    }, {});
}

function getConfiguredSuperAdminId() {
    return (process.env.SUPER_ADMIN_TWITCH_ID ?? '').trim();
}

function isConfiguredSuperAdmin(twitchId) {
    const configuredId = getConfiguredSuperAdminId();
    return !!configuredId && String(twitchId) === configuredId;
}

export function isSuperAdminById(twitchId) {
    return isConfiguredSuperAdmin(twitchId);
}

export async function getCurrentTwitchUser(event) {
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) {
        return null;
    }

    const cookies = parseCookies(event?.headers?.cookie ?? '');
    const accessToken = cookies.tw_access;
    if (!accessToken) {
        return null;
    }

    const res = await fetch(USERS_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': clientId,
        },
    });

    if (!res.ok) {
        return null;
    }

    const data = await res.json();
    return data?.data?.[0] ?? null;
}

export async function getUserRecordByTwitchId(twitchId) {
    if (!twitchId) {
        return null;
    }

    const db = getDb();
    const ref = db.collection('users').doc(String(twitchId));
    const snap = await ref.get();

    if (!snap.exists) {
        return null;
    }

    return snap.data() ?? null;
}

export async function hasCapability(twitchId, capabilityId) {
    if (!twitchId || !capabilityId) {
        return false;
    }

    if (isConfiguredSuperAdmin(twitchId)) {
        return true;
    }

    const db = getDb();
    const userRef = db.collection('users').doc(String(twitchId));
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
        return false;
    }

    const user = userSnap.data() ?? {};
    if (user.isSuperAdmin === true) {
        return true;
    }

    const capabilitySnap = await userRef
        .collection('capabilities')
        .doc(String(capabilityId))
        .get();

    if (!capabilitySnap.exists) {
        return false;
    }

    const capability = capabilitySnap.data() ?? {};
    return capability.enabled === true;
}

export async function canCurrentUser(event, capabilityId) {
    const user = await getCurrentTwitchUser(event);
    if (!user?.id) {
        return { allowed: false, user: null };
    }

    const allowed = await hasCapability(user.id, capabilityId);
    return {
        allowed,
        user,
    };
}

export async function requireSuperAdmin(event) {
    const user = await getCurrentTwitchUser(event);
    if (!user?.id) {
        return { allowed: false, user: null, reason: 'unauthenticated' };
    }

    if (isConfiguredSuperAdmin(user.id)) {
        return { allowed: true, user, reason: 'configured-super-admin' };
    }

    const userRecord = await getUserRecordByTwitchId(user.id);
    if (userRecord?.isSuperAdmin === true) {
        return { allowed: true, user, reason: 'db-super-admin' };
    }

    return { allowed: false, user, reason: 'not-super-admin' };
}
