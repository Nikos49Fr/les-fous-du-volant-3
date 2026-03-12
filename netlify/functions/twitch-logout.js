function serializeCookie(name, value, options = {}) {
    const parts = [`${name}=${encodeURIComponent(value)}`];
    if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
    if (options.path) parts.push(`Path=${options.path}`);
    if (options.httpOnly) parts.push('HttpOnly');
    if (options.secure) parts.push('Secure');
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    return parts.join('; ');
}

export async function handler(event) {
    const isSecure =
        (event.headers['x-forwarded-proto'] ?? 'https') === 'https';

    const cookiesToClear = [
        serializeCookie('tw_access', '', {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'Lax',
            path: '/',
            maxAge: 0,
        }),
        serializeCookie('tw_refresh', '', {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'Lax',
            path: '/',
            maxAge: 0,
        }),
    ];

    return {
        statusCode: 204,
        multiValueHeaders: {
            'Set-Cookie': cookiesToClear,
        },
    };
}
