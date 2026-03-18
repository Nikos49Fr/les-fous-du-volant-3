import { supabase } from './supabaseClient';
import { fetchCurrentViewer, syncCurrentProfile } from './authApi';

function mapUserProfile(profile, capabilities) {
    return {
        twitchId: profile.provider_user_id ?? profile.id,
        userId: profile.id,
        login: profile.provider_login ?? '',
        displayName: profile.display_name ?? '',
        profileImageUrl: profile.avatar_url ?? '',
        firstLoginAt: profile.created_at ?? '',
        lastLoginAt: profile.updated_at ?? '',
        isSuperAdmin: profile.is_super_admin === true,
        capabilities,
    };
}

function mapDriverRow(driver) {
    return {
        driverId: driver.id,
        displayName: driver.display_name ?? '',
        racingNumber: driver.racing_number ?? '',
        linkedUserId: driver.linked_user_id ?? null,
        linkedUserDisplayName: driver.profiles?.display_name ?? '',
        teamId: driver.team_id,
        teamName: driver.teams?.name ?? '',
    };
}

async function requireSuperAdmin() {
    const viewer = await fetchCurrentViewer();
    if (!viewer?.isSuperAdmin) {
        const error = new Error('Forbidden');
        error.status = 403;
        throw error;
    }
}

export async function fetchAdminPermissions() {
    await requireSuperAdmin();

    const [
        { data: profiles, error: profilesError },
        { data: capabilities, error: capabilitiesError },
        { data: drivers, error: driversError },
    ] = await Promise.all([
        supabase
            .from('profiles')
            .select(
                'id, provider_user_id, provider_login, display_name, avatar_url, created_at, updated_at, is_super_admin',
            )
            .order('display_name', { ascending: true }),
        supabase
            .from('user_capabilities')
            .select('user_id, capability_id, enabled, created_at, created_by, updated_at, updated_by'),
        supabase
            .from('drivers')
            .select('id, display_name, racing_number, linked_user_id, team_id, teams(name), profiles:linked_user_id(display_name)')
            .eq('is_active', true)
            .order('display_name', { ascending: true }),
    ]);

    if (profilesError) {
        const error = new Error(profilesError.message);
        error.status = 500;
        throw error;
    }

    if (capabilitiesError) {
        const error = new Error(capabilitiesError.message);
        error.status = 500;
        throw error;
    }

    if (driversError) {
        const error = new Error(driversError.message);
        error.status = 500;
        throw error;
    }

    const capabilitiesByUserId = new Map();
    (capabilities ?? []).forEach((capability) => {
        const current = capabilitiesByUserId.get(capability.user_id) ?? [];
        current.push({
            capabilityId: capability.capability_id,
            enabled: capability.enabled === true,
            createdAt: capability.created_at ?? null,
            createdBy: capability.created_by ?? null,
            updatedAt: capability.updated_at ?? null,
            updatedBy: capability.updated_by ?? null,
        });
        capabilitiesByUserId.set(capability.user_id, current);
    });

    return {
        ok: true,
        users: (profiles ?? []).map((profile) =>
            mapUserProfile(
                profile,
                (capabilitiesByUserId.get(profile.id) ?? []).sort((a, b) =>
                    a.capabilityId.localeCompare(b.capabilityId),
                ),
            ),
        ),
        drivers: (drivers ?? []).map(mapDriverRow),
    };
}

export async function setUserCapability({ targetUserId, capabilityId, enabled }) {
    await requireSuperAdmin();

    const actorProfile = await syncCurrentProfile();
    if (!actorProfile?.id) {
        const error = new Error('Authentication required');
        error.status = 401;
        throw error;
    }

    const normalizedCapabilityId = String(capabilityId ?? '').trim().toLowerCase();
    if (!normalizedCapabilityId) {
        const error = new Error('Capability ID is required');
        error.status = 400;
        throw error;
    }

    if (normalizedCapabilityId === 'admin.permissions.manage') {
        const error = new Error('Protected capability cannot be modified');
        error.status = 403;
        throw error;
    }

    const { data: targetProfile, error: targetProfileError } = await supabase
        .from('profiles')
        .select('id, is_super_admin')
        .eq('id', targetUserId)
        .single();

    if (targetProfileError) {
        const error = new Error(targetProfileError.message);
        error.status = 404;
        throw error;
    }

    if (targetProfile.is_super_admin === true) {
        const error = new Error('Super-admin permissions cannot be modified');
        error.status = 403;
        throw error;
    }

    const payload = {
        user_id: targetUserId,
        capability_id: normalizedCapabilityId,
        enabled,
        updated_by: actorProfile.id,
    };

    const { data, error: upsertError } = await supabase
        .from('user_capabilities')
        .upsert(payload, { onConflict: 'user_id,capability_id' })
        .select('capability_id, enabled, created_at, created_by, updated_at, updated_by')
        .single();

    if (upsertError) {
        const error = new Error(upsertError.message);
        error.status = 500;
        throw error;
    }

    return {
        ok: true,
        targetUserId,
        capability: {
            capabilityId: data.capability_id,
            enabled: data.enabled === true,
            createdAt: data.created_at ?? null,
            createdBy: data.created_by ?? null,
            updatedAt: data.updated_at ?? null,
            updatedBy: data.updated_by ?? null,
        },
    };
}

export async function linkDriverToUser({ driverId, linkedUserId }) {
    await requireSuperAdmin();

    const payload = {
        linked_user_id: linkedUserId,
    };

    const { data, error } = await supabase
        .from('drivers')
        .update(payload)
        .eq('id', driverId)
        .select('id, linked_user_id, profiles:linked_user_id(display_name)')
        .single();

    if (error) {
        const normalizedError = new Error(error.message ?? 'Liaison impossible');
        normalizedError.status = 500;
        throw normalizedError;
    }

    return {
        driverId: data.id,
        linkedUserId: data.linked_user_id ?? null,
        linkedUserDisplayName: data.profiles?.display_name ?? '',
    };
}
