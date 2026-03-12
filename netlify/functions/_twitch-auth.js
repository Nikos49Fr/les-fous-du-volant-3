const USERS_URL = 'https://api.twitch.tv/helix/users';

function parseCookies(cookieHeader = '') {
    return cookieHeader.split(';').reduce((acc, part) => {
        const [rawKey, ...rawVal] = part.trim().split('=');
        if (!rawKey) return acc;
        acc[rawKey] = decodeURIComponent(rawVal.join('=') || '');
        return acc;
    }, {});
}

function getAdminLogins() {
    const raw = process.env.ADMIN_TWITCH_LOGINS ?? '';
    return new Set(
        raw
            .split(',')
            .map((login) => login.trim().toLowerCase())
            .filter(Boolean),
    );
}

export async function getCurrentTwitchUser(event) {
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) {
        return null;
    }

    const cookies = parseCookies(event.headers.cookie ?? '');
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

export function isAdminLogin(login) {
    if (!login) return false;
    return getAdminLogins().has(String(login).toLowerCase());
}
