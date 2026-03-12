import crypto from 'crypto';

const AUTHORIZE_URL = 'https://id.twitch.tv/oauth2/authorize';

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

function serializeCookie(name, value, options = {}) {
    const parts = [`${name}=${encodeURIComponent(value)}`];
    if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
    if (options.path) parts.push(`Path=${options.path}`);
    if (options.httpOnly) parts.push('HttpOnly');
    if (options.secure) parts.push('Secure');
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    return parts.join('; ');
}

export async function handler(event) {
    const clientId = process.env.TWITCH_CLIENT_ID;

    if (!clientId) {
        return {
            statusCode: 500,
            body: 'Missing TWITCH_CLIENT_ID',
        };
    }

    const baseUrl = getBaseUrl(event);
    const redirectUri = `${baseUrl}/api/auth/twitch/callback`;
    const state = crypto.randomUUID();

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: '',
        state,
    });

    const isSecure = baseUrl.startsWith('https://');
    const stateCookie = serializeCookie('tw_state', state, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'Lax',
        path: '/',
        maxAge: 300,
    });

    return {
        statusCode: 302,
        headers: {
            Location: `${AUTHORIZE_URL}?${params.toString()}`,
        },
        multiValueHeaders: {
            'Set-Cookie': [stateCookie],
        },
    };
}
