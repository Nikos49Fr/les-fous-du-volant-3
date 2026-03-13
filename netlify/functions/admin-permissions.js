import { getDb } from './_firebase-admin.js';
import { requireSuperAdmin, isSuperAdminById } from './_twitch-auth.js';

const PROTECTED_CAPABILITY = 'admin.permissions.manage';
const CAPABILITY_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function json(statusCode, payload) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    };
}

function normalizeUser(doc) {
    const data = doc.data() ?? {};
    return {
        twitchId: doc.id,
        login: data.login ?? '',
        displayName: data.displayName ?? '',
        profileImageUrl: data.profileImageUrl ?? '',
        firstLoginAt: data.firstLoginAt ?? '',
        lastLoginAt: data.lastLoginAt ?? '',
        isSuperAdmin: data.isSuperAdmin === true,
    };
}

function normalizeCapability(doc) {
    const data = doc.data() ?? {};
    return {
        capabilityId: doc.id,
        enabled: data.enabled === true,
        createdAt: data.createdAt ?? null,
        createdBy: data.createdBy ?? null,
        updatedAt: data.updatedAt ?? null,
        updatedBy: data.updatedBy ?? null,
    };
}

async function handleGet(event) {
    const admin = await requireSuperAdmin(event);
    if (!admin.allowed) {
        return json(403, { error: 'Forbidden' });
    }

    const db = getDb();
    const usersSnap = await db.collection('users').get();

    const users = await Promise.all(
        usersSnap.docs.map(async (userDoc) => {
            const user = normalizeUser(userDoc);
            const capabilitiesSnap = await userDoc.ref.collection('capabilities').get();
            const capabilities = capabilitiesSnap.docs
                .map(normalizeCapability)
                .sort((a, b) => a.capabilityId.localeCompare(b.capabilityId));

            return { ...user, capabilities };
        }),
    );

    users.sort((a, b) =>
        (a.login || a.displayName || a.twitchId).localeCompare(
            b.login || b.displayName || b.twitchId,
        ),
    );

    return json(200, {
        ok: true,
        users,
        actor: {
            twitchId: admin.user.id,
            login: admin.user.login ?? '',
        },
    });
}

async function handlePost(event) {
    const admin = await requireSuperAdmin(event);
    if (!admin.allowed) {
        return json(403, { error: 'Forbidden' });
    }

    let payload;
    try {
        payload = JSON.parse(event.body ?? '{}');
    } catch {
        return json(400, { error: 'Invalid JSON body' });
    }

    const targetUserId = String(payload.targetUserId ?? '').trim();
    const capabilityId = String(payload.capabilityId ?? '').trim().toLowerCase();
    const enabled = payload.enabled;

    if (!targetUserId) {
        return json(400, { error: 'Field "targetUserId" is required' });
    }

    if (!capabilityId || !CAPABILITY_PATTERN.test(capabilityId)) {
        return json(400, { error: 'Field "capabilityId" is invalid' });
    }

    if (typeof enabled !== 'boolean') {
        return json(400, { error: 'Field "enabled" must be a boolean' });
    }

    if (capabilityId === PROTECTED_CAPABILITY) {
        return json(403, { error: 'Protected capability cannot be modified via API' });
    }

    if (isSuperAdminById(targetUserId)) {
        return json(403, { error: 'Super-admin permissions cannot be modified' });
    }

    const db = getDb();
    const userRef = db.collection('users').doc(targetUserId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
        return json(404, { error: 'Target user not found' });
    }

    const userData = userSnap.data() ?? {};
    if (userData.isSuperAdmin === true) {
        return json(403, { error: 'Super-admin permissions cannot be modified' });
    }

    const now = new Date().toISOString();
    const capabilityRef = userRef.collection('capabilities').doc(capabilityId);
    const capabilitySnap = await capabilityRef.get();
    const patch = {
        enabled,
        updatedAt: now,
        updatedBy: admin.user.id,
    };

    if (!capabilitySnap.exists) {
        patch.createdAt = now;
        patch.createdBy = admin.user.id;
    }

    await capabilityRef.set(patch, { merge: true });
    const updatedSnap = await capabilityRef.get();

    return json(200, {
        ok: true,
        targetUserId,
        capability: normalizeCapability(updatedSnap),
    });
}

export async function handler(event) {
    if (event.httpMethod === 'GET') {
        return handleGet(event);
    }

    if (event.httpMethod === 'POST') {
        return handlePost(event);
    }

    return json(405, { error: 'Method not allowed' });
}
