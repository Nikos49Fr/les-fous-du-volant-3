const ADMIN_PERMISSIONS_URL = '/api/admin/permissions';

export async function fetchAdminPermissions() {
    const response = await fetch(ADMIN_PERMISSIONS_URL, {
        credentials: 'include',
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(body.error ?? `HTTP ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return body;
}

export async function setUserCapability({ targetUserId, capabilityId, enabled }) {
    const response = await fetch(ADMIN_PERMISSIONS_URL, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            targetUserId,
            capabilityId,
            enabled,
        }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(body.error ?? `HTTP ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return body;
}
