import { supabase } from './supabaseClient';
import { fetchCurrentViewer, syncCurrentProfile } from './authApi';
import { buildResultsSchedule } from './resultsHelpers';
import {
    DRIVER_STATUS_ACTIVE,
    normalizeDriverGpRound,
    normalizeDriverStatus,
} from './driverAvailability';

const SUPER_ADMIN_CONFIGURABLE_CAPABILITY = 'multi_twitch.test_channels.view';
const SYSTEM_CAPABILITY_METADATA = {
    'calendar.write': {
        label: 'Calendrier',
        description: 'R?v?le et met ? jour le calendrier.',
        isSystem: true,
    },
    'results.write': {
        label: 'R?sultats',
        description:
            'Saisit et met ? jour les r?sultats des qualifications et des courses.',
        isSystem: true,
    },
    'multi_twitch.test_channels.view': {
        label: 'Multi-Twitch tests',
        description:
            'Affiche les cha?nes Twitch de test dans la liste Multi-Twitch.',
        isSystem: true,
    },
};

function getCapabilityMetadata(capabilityId) {
    const systemMetadata = SYSTEM_CAPABILITY_METADATA[capabilityId];
    if (systemMetadata) {
        return systemMetadata;
    }

    return {
        label: capabilityId,
        description: null,
        isSystem: false,
    };
}

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
        bio: driver.bio ?? '',
        racingNumber: driver.racing_number ?? '',
        linkedUserId: driver.linked_user_id ?? null,
        linkedUserDisplayName: driver.profiles?.display_name ?? '',
        teamId: driver.team_id,
        teamName: driver.teams?.name ?? '',
        isStreamer: driver.is_streamer === true,
        status: normalizeDriverStatus(driver.status),
        activeFromGpRound: normalizeDriverGpRound(driver.active_from_gp_round, 1),
        abandonedAfterGpRound: Number.isInteger(driver.abandoned_after_gp_round)
            ? driver.abandoned_after_gp_round
            : driver.abandoned_after_gp_round == null
              ? null
              : normalizeDriverGpRound(driver.abandoned_after_gp_round, null),
        abandonedAt: driver.abandoned_at ?? null,
        isActive: driver.is_active === true,
    };
}

function mapTeamRow(team) {
    return {
        id: team.id,
        name: team.name ?? '',
        shortName: team.short_name ?? '',
    };
}

function slugifyDriverId(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

async function requireSuperAdmin() {
    const viewer = await fetchCurrentViewer();
    if (!viewer?.isSuperAdmin) {
        const error = new Error('Forbidden');
        error.status = 403;
        throw error;
    }
}

async function ensureCapabilityExists(capabilityId) {
    const metadata = getCapabilityMetadata(capabilityId);

    const { error } = await supabase.from('capabilities').upsert(
        {
            id: capabilityId,
            label: metadata.label,
            description: metadata.description,
            is_system: metadata.isSystem,
        },
        { onConflict: 'id' },
    );

    if (error) {
        const normalizedError = new Error(error.message);
        normalizedError.status = 500;
        throw normalizedError;
    }
}

export async function fetchAdminPermissions() {
    await requireSuperAdmin();

    const [
        { data: profiles, error: profilesError },
        { data: capabilities, error: capabilitiesError },
        { data: drivers, error: driversError },
        { data: teams, error: teamsError },
        { data: calendarRow, error: calendarError },
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
            .select(
                'id, display_name, bio, racing_number, linked_user_id, team_id, is_streamer, is_active, status, active_from_gp_round, abandoned_after_gp_round, abandoned_at, teams(name), profiles:linked_user_id(display_name)',
            )
            .order('display_name', { ascending: true }),
        supabase
            .from('teams')
            .select('id, name, short_name')
            .order('name', { ascending: true }),
        supabase
            .from('calendar_settings')
            .select('revealed')
            .eq('id', 'season3')
            .single(),
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

    if (teamsError) {
        const error = new Error(teamsError.message);
        error.status = 500;
        throw error;
    }

    if (calendarError) {
        const error = new Error(calendarError.message);
        error.status = 500;
        throw error;
    }

    const gpSchedule = buildResultsSchedule(calendarRow?.revealed).filter(
        (gp) => gp.isKnown === true,
    );

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
        teams: (teams ?? []).map(mapTeamRow),
        gpSchedule,
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

    if (
        targetProfile.is_super_admin === true &&
        normalizedCapabilityId !== SUPER_ADMIN_CONFIGURABLE_CAPABILITY
    ) {
        const error = new Error('Super-admin permissions cannot be modified');
        error.status = 403;
        throw error;
    }

    await ensureCapabilityExists(normalizedCapabilityId);

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

function buildDriverPayload(input) {
    const displayName = String(input.displayName ?? '').trim();
    const bio = String(input.bio ?? '').trim();
    const driverId = String(input.driverId ?? '').trim().toLowerCase();
    const racingNumber = String(input.racingNumber ?? '').trim();
    const teamId = String(input.teamId ?? '').trim();
    const status = normalizeDriverStatus(input.status);
    const activeFromGpRound = normalizeDriverGpRound(input.activeFromGpRound, 1);
    const abandonedAfterGpRound =
        status === 'abandoned'
            ? normalizeDriverGpRound(input.abandonedAfterGpRound, null)
            : null;

    if (!displayName) {
        const error = new Error('Le nom affich? est requis');
        error.status = 400;
        throw error;
    }

    if (!driverId) {
        const error = new Error("L'identifiant technique est requis");
        error.status = 400;
        throw error;
    }

    if (!racingNumber) {
        const error = new Error('Le num?ro est requis');
        error.status = 400;
        throw error;
    }

    if (!teamId) {
        const error = new Error("L'?curie est requise");
        error.status = 400;
        throw error;
    }

    if (status === 'abandoned' && !Number.isInteger(abandonedAfterGpRound)) {
        const error = new Error("Le dernier GP disput? doit ?tre renseign? pour un abandon");
        error.status = 400;
        throw error;
    }

    if (
        status === 'abandoned' &&
        Number.isInteger(abandonedAfterGpRound) &&
        abandonedAfterGpRound < activeFromGpRound
    ) {
        const error = new Error(
            "Le dernier GP disput? ne peut pas ?tre ant?rieur au premier GP disponible",
        );
        error.status = 400;
        throw error;
    }

    return {
        id: driverId,
        display_name: displayName,
        bio,
        racing_number: racingNumber,
        team_id: teamId,
        is_streamer: input.isStreamer === true,
        status,
        active_from_gp_round: activeFromGpRound,
        abandoned_after_gp_round: abandonedAfterGpRound,
        abandoned_at:
            status === 'abandoned'
                ? input.abandonedAt ?? new Date().toISOString()
                : null,
        is_active: status === DRIVER_STATUS_ACTIVE,
    };
}

export function buildDefaultDriverDraft() {
    return {
        driverId: '',
        displayName: '',
        bio: '',
        racingNumber: '',
        teamId: '',
        isStreamer: false,
        status: 'draft',
        activeFromGpRound: 1,
        abandonedAfterGpRound: null,
        abandonedAt: null,
    };
}

export function buildDriverDraftFromRow(driver) {
    if (!driver) {
        return buildDefaultDriverDraft();
    }

    return {
        driverId: driver.driverId,
        displayName: driver.displayName,
        bio: driver.bio ?? '',
        racingNumber: driver.racingNumber,
        teamId: driver.teamId,
        isStreamer: driver.isStreamer === true,
        status: normalizeDriverStatus(driver.status),
        activeFromGpRound: normalizeDriverGpRound(driver.activeFromGpRound, 1),
        abandonedAfterGpRound: driver.abandonedAfterGpRound ?? null,
        abandonedAt: driver.abandonedAt ?? null,
    };
}

export function buildSuggestedDriverId(displayName) {
    return slugifyDriverId(displayName);
}

export async function createDriver(input) {
    await requireSuperAdmin();

    const payload = buildDriverPayload(input);
    const { data, error } = await supabase
        .from('drivers')
        .insert(payload)
        .select(
            'id, display_name, bio, racing_number, linked_user_id, team_id, is_streamer, is_active, status, active_from_gp_round, abandoned_after_gp_round, abandoned_at, teams(name), profiles:linked_user_id(display_name)',
        )
        .single();

    if (error) {
        const normalizedError = new Error(error.message ?? 'Création impossible');
        normalizedError.status = 500;
        throw normalizedError;
    }

    return mapDriverRow(data);
}

export async function updateDriver(input) {
    await requireSuperAdmin();

    const payload = buildDriverPayload(input);
    const { data, error } = await supabase
        .from('drivers')
        .update({
            display_name: payload.display_name,
            bio: payload.bio,
            racing_number: payload.racing_number,
            team_id: payload.team_id,
            is_streamer: payload.is_streamer,
            status: payload.status,
            active_from_gp_round: payload.active_from_gp_round,
            abandoned_after_gp_round: payload.abandoned_after_gp_round,
            abandoned_at: payload.abandoned_at,
            is_active: payload.is_active,
        })
        .eq('id', payload.id)
        .select(
            'id, display_name, bio, racing_number, linked_user_id, team_id, is_streamer, is_active, status, active_from_gp_round, abandoned_after_gp_round, abandoned_at, teams(name), profiles:linked_user_id(display_name)',
        )
        .single();

    if (error) {
        const normalizedError = new Error(error.message ?? 'Mise à jour impossible');
        normalizedError.status = 500;
        throw normalizedError;
    }

    return mapDriverRow(data);
}
