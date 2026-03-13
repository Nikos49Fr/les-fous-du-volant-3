const TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const USERS_URL = 'https://api.twitch.tv/helix/users';

import { getDb } from './_firebase-admin.js';

function getBaseUrl(event) {
    if (process.env.TWITCH_REDIRECT_BASE_URL) {
        return process.env.TWITCH_REDIRECT_BASE_URL;
    }

    if (process.env.URL) {
        return process.env.URL;
    }

    const proto = event.headers['x-forwarded-proto'] ?? 'https';
    const host = event.headers.host;
    return `${proto}://${host}`;
}

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

async function fetchTwitchUser(accessToken, clientId) {
    const userRes = await fetch(USERS_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': clientId,
        },
    });

    if (!userRes.ok) {
        return null;
    }

    const userData = await userRes.json();
    return userData?.data?.[0] ?? null;
}

async function upsertUserRegistry(user) {
    if (!user?.id) return;

    const now = new Date().toISOString();
    const configuredSuperAdminId = (process.env.SUPER_ADMIN_TWITCH_ID ?? '').trim();
    const isConfiguredSuperAdmin =
        !!configuredSuperAdminId && user.id === configuredSuperAdminId;
    const db = getDb();
    const ref = db.collection('users').doc(user.id);
    const snap = await ref.get();

    if (!snap.exists) {
        await ref.set({
            twitchId: user.id,
            login: user.login ?? '',
            displayName: user.display_name ?? '',
            profileImageUrl: user.profile_image_url ?? '',
            firstLoginAt: now,
            lastLoginAt: now,
            isSuperAdmin: isConfiguredSuperAdmin,
        });
        return;
    }

    const updatePayload = {
        login: user.login ?? '',
        displayName: user.display_name ?? '',
        profileImageUrl: user.profile_image_url ?? '',
        lastLoginAt: now,
    };

    if (isConfiguredSuperAdmin) {
        updatePayload.isSuperAdmin = true;
    }

    await ref.set(updatePayload, { merge: true });
}

export async function handler(event) {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return {
            statusCode: 500,
            body: 'Missing Twitch credentials',
        };
    }

    const { code, state, error } = event.queryStringParameters ?? {};
    const cookies = parseCookies(event.headers.cookie ?? '');
    const expectedState = cookies.tw_state;

    if (error) {
        return {
            statusCode: 302,
            headers: { Location: '/?auth=denied' },
        };
    }

    if (!code || !state || !expectedState || state !== expectedState) {
        return {
            statusCode: 400,
            body: 'Invalid OAuth state',
        };
    }

    const baseUrl = getBaseUrl(event);
    const redirectUri = `${baseUrl}/api/auth/twitch/callback`;

    const tokenParams = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
    });

    const tokenRes = await fetch(`${TOKEN_URL}?${tokenParams.toString()}`, {
        method: 'POST',
    });

    if (!tokenRes.ok) {
        return {
            statusCode: 401,
            body: 'Token exchange failed',
        };
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in ?? 0;

    try {
        const twitchUser = await fetchTwitchUser(accessToken, clientId);
        if (twitchUser) {
            await upsertUserRegistry(twitchUser);
        }
    } catch {
        // Keep auth flow successful even if user registry write fails temporarily.
    }

    const isSecure = baseUrl.startsWith('https://');
    const cookiesToSet = [
        serializeCookie('tw_access', accessToken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'Lax',
            path: '/',
            maxAge: expiresIn,
        }),
        serializeCookie('tw_refresh', refreshToken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'Lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
        }),
        serializeCookie('tw_state', '', {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'Lax',
            path: '/',
            maxAge: 0,
        }),
    ];

    return {
        statusCode: 302,
        headers: {
            Location: '/?auth=success',
        },
        multiValueHeaders: {
            'Set-Cookie': cookiesToSet,
        },
    };
}
