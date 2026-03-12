const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const USERS_URL = 'https://api.twitch.tv/helix/users';

function parseCookies(cookieHeader = '') {
    return cookieHeader.split(';').reduce((acc, part) => {
        const [rawKey, ...rawVal] = part.trim().split('=');
        if (!rawKey) return acc;
        acc[rawKey] = decodeURIComponent(rawVal.join('=') || '');
        return acc;
    }, {});
}

function serializeCookie(name, value, options = {}) {
    const parts = [`${name}=${encodeURIComponent(value)}`];
    if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
    if (options.path) parts.push(`Path=${options.path}`);
    if (options.httpOnly) parts.push('HttpOnly');
    if (options.secure) parts.push('Secure');
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    return parts.join('; ');
}

async function fetchUser(accessToken, clientId) {
    const userRes = await fetch(USERS_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': clientId,
        },
    });

    if (!userRes.ok) {
        return { ok: false };
    }

    const userData = await userRes.json();
    return { ok: true, user: userData.data?.[0] ?? null };
}

export async function handler(event) {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return { statusCode: 500, body: 'Missing Twitch credentials' };
    }

    const cookies = parseCookies(event.headers.cookie ?? '');
    const accessToken = cookies.tw_access;
    const refreshToken = cookies.tw_refresh;

    if (!accessToken) {
        return { statusCode: 401, body: 'Not authenticated' };
    }

    let userResult = await fetchUser(accessToken, clientId);

    let newAccessToken = null;
    let newRefreshToken = null;
    let expiresIn = null;

    if (!userResult.ok && refreshToken) {
        const refreshParams = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        });

        const refreshRes = await fetch(`${TOKEN_URL}?${refreshParams.toString()}`, {
            method: 'POST',
        });

        if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            newAccessToken = refreshData.access_token;
            newRefreshToken = refreshData.refresh_token ?? refreshToken;
            expiresIn = refreshData.expires_in ?? 0;
            userResult = await fetchUser(newAccessToken, clientId);
        }
    }

    if (!userResult.ok || !userResult.user) {
        return { statusCode: 401, body: 'Not authenticated' };
    }

    const headers = { 'Content-Type': 'application/json' };
    const multiValueHeaders = {};

    if (newAccessToken) {
        const isSecure =
            (event.headers['x-forwarded-proto'] ?? 'https') === 'https';
        multiValueHeaders['Set-Cookie'] = [
            serializeCookie('tw_access', newAccessToken, {
                httpOnly: true,
                secure: isSecure,
                sameSite: 'Lax',
                path: '/',
                maxAge: expiresIn ?? 0,
            }),
            serializeCookie('tw_refresh', newRefreshToken, {
                httpOnly: true,
                secure: isSecure,
                sameSite: 'Lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30,
            }),
        ];
    }

    return {
        statusCode: 200,
        headers,
        multiValueHeaders,
        body: JSON.stringify({
            user: {
                id: userResult.user.id,
                login: userResult.user.login,
                display_name: userResult.user.display_name,
                profile_image_url: userResult.user.profile_image_url,
            },
        }),
    };
}
