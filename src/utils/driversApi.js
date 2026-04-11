import { supabase } from './supabaseClient';
import {
    DRIVER_STATUS_ACTIVE,
    isDriverPubliclyVisible,
    normalizeDriverGpRound,
    normalizeDriverStatus,
} from './driverAvailability';
import { getLastStartedGpRound } from './resultsHelpers';

function normalizeLogin(value) {
    return String(value ?? '').trim().toLowerCase();
}

function isDriverCurrentlyActive(driver, currentGpRound) {
    if (!driver) {
        return false;
    }

    if (normalizeDriverStatus(driver.status) !== DRIVER_STATUS_ACTIVE) {
        return false;
    }

    return (
        normalizeDriverGpRound(driver.active_from_gp_round, 1) <= currentGpRound
    );
}

export async function fetchDriversData() {
    const currentGpRound = getLastStartedGpRound();
    const [
        { data: teams, error: teamsError },
        { data: drivers, error: driversError },
    ] = await Promise.all([
        supabase
            .from('teams')
            .select('id, name, short_name, color_key, logo_key')
            .order('name', { ascending: true }),
        supabase
            .from('drivers')
            .select(
                'id, display_name, racing_number, team_id, status, active_from_gp_round',
            )
            .order('display_name', { ascending: true }),
    ]);

    if (teamsError) {
        throw teamsError;
    }

    if (driversError) {
        throw driversError;
    }

    const driversByTeamId = new Map();

    for (const driver of (drivers ?? []).filter((item) =>
        isDriverCurrentlyActive(item, currentGpRound),
    )) {
        const current = driversByTeamId.get(driver.team_id) ?? [];
        current.push({
            id: driver.id,
            displayName: driver.display_name,
            racingNumber: driver.racing_number,
            teamId: driver.team_id,
        });
        driversByTeamId.set(driver.team_id, current);
    }

    return (teams ?? [])
        .map((team) => ({
            id: team.id,
            name: team.name,
            shortName: team.short_name,
            colorKey: team.color_key,
            logoKey: team.logo_key,
            drivers: (driversByTeamId.get(team.id) ?? []).sort((a, b) =>
                a.displayName.localeCompare(b.displayName),
            ),
        }))
        .filter((team) => team.drivers.length > 0);
}

export async function fetchDriversOverviewData() {
    const currentGpRound = getLastStartedGpRound();
    const [
        { data: teams, error: teamsError },
        { data: drivers, error: driversError },
        { data: resultEntries, error: resultEntriesError },
    ] = await Promise.all([
        supabase
            .from('teams')
            .select('id, name, short_name, color_key, logo_key')
            .order('name', { ascending: true }),
        supabase
            .from('drivers')
            .select(
                'id, display_name, bio, racing_number, team_id, linked_user_id, is_streamer, status, active_from_gp_round, abandoned_after_gp_round',
            )
            .order('display_name', { ascending: true }),
        supabase.from('result_entries').select('driver_id'),
    ]);

    if (teamsError) {
        throw teamsError;
    }

    if (driversError) {
        throw driversError;
    }

    if (resultEntriesError) {
        throw resultEntriesError;
    }

    const teamById = new Map(
        (teams ?? []).map((team) => [
            team.id,
            {
                id: team.id,
                name: team.name,
                shortName: team.short_name,
                colorKey: team.color_key,
                logoKey: team.logo_key,
            },
        ]),
    );
    const linkedProfileIds = [
        ...new Set(
            (drivers ?? [])
                .map((driver) => driver.linked_user_id)
                .filter(Boolean),
        ),
    ];
    let profileLoginById = new Map();

    if (linkedProfileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, provider_login')
            .in('id', linkedProfileIds);

        if (profilesError) {
            throw profilesError;
        }

        profileLoginById = new Map(
            (profiles ?? []).map((profile) => [profile.id, profile.provider_login]),
        );
    }

    const driverIdsWithResults = new Set(
        (resultEntries ?? []).map((entry) => entry.driver_id).filter(Boolean),
    );

    const visibleDrivers = (drivers ?? [])
        .filter((driver) =>
            isDriverPubliclyVisible(
                {
                    status: driver.status,
                    activeFromGpRound: driver.active_from_gp_round,
                },
                currentGpRound,
                driverIdsWithResults.has(driver.id),
            ),
        )
        .map((driver) => ({
            team: teamById.get(driver.team_id) ?? null,
            twitchLogin: driver.is_streamer
                ? normalizeLogin(
                      profileLoginById.get(driver.linked_user_id) ??
                          driver.display_name ??
                          driver.id,
                  )
                : '',
            id: driver.id,
            displayName: driver.display_name,
            bio: driver.bio ?? '',
            racingNumber: driver.racing_number,
            linkedUserId: driver.linked_user_id ?? null,
            isStreamer: driver.is_streamer === true,
            status: normalizeDriverStatus(driver.status),
            activeFromGpRound: normalizeDriverGpRound(
                driver.active_from_gp_round,
                1,
            ),
            abandonedAfterGpRound:
                driver.abandoned_after_gp_round == null
                    ? null
                    : normalizeDriverGpRound(driver.abandoned_after_gp_round, null),
        }))
        .sort((leftDriver, rightDriver) => {
            const leftTeamName = leftDriver.team?.name ?? '';
            const rightTeamName = rightDriver.team?.name ?? '';
            if (leftTeamName !== rightTeamName) {
                return leftTeamName.localeCompare(rightTeamName);
            }

            return leftDriver.displayName.localeCompare(rightDriver.displayName);
        });

    return {
        activeDrivers: visibleDrivers.filter(
            (driver) => driver.status === DRIVER_STATUS_ACTIVE,
        ),
        inactiveDrivers: visibleDrivers.filter(
            (driver) => driver.status !== DRIVER_STATUS_ACTIVE,
        ),
    };
}

export async function fetchMultiTwitchRoster() {
    const currentGpRound = getLastStartedGpRound();
    const [
        { data: teams, error: teamsError },
        { data: drivers, error: driversError },
    ] = await Promise.all([
        supabase
            .from('teams')
            .select('id, name, short_name, color_key, logo_key')
            .order('name', { ascending: true }),
        supabase
            .from('drivers')
            .select(
                'id, display_name, racing_number, team_id, linked_user_id, status, active_from_gp_round',
            )
            .order('display_name', { ascending: true }),
    ]);

    if (teamsError) {
        throw teamsError;
    }

    if (driversError) {
        throw driversError;
    }

    const activeDrivers = (drivers ?? []).filter((driver) =>
        isDriverCurrentlyActive(driver, currentGpRound),
    );

    const linkedProfileIds = [...new Set(
        activeDrivers
            .map((driver) => driver.linked_user_id)
            .filter(Boolean),
    )];

    let profileLoginById = new Map();

    if (linkedProfileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, provider_login')
            .in('id', linkedProfileIds);

        if (profilesError) {
            throw profilesError;
        }

        profileLoginById = new Map(
            (profiles ?? []).map((profile) => [profile.id, profile.provider_login]),
        );
    }

    const teamById = new Map(
        (teams ?? []).map((team) => [
            team.id,
            {
                id: team.id,
                name: team.name,
                shortName: team.short_name,
                colorKey: team.color_key,
                logoKey: team.logo_key,
            },
        ]),
    );

    return activeDrivers.map((driver) => {
        const primaryLogin = normalizeLogin(
            profileLoginById.get(driver.linked_user_id),
        );
        const fallbackLogin = normalizeLogin(driver.display_name);
        const legacyFallbackLogin = normalizeLogin(driver.id);
        const twitchLogins = [
            ...new Set(
                [primaryLogin, fallbackLogin, legacyFallbackLogin].filter(Boolean),
            ),
        ];

        return {
            id: driver.id,
            displayName: driver.display_name,
            racingNumber: driver.racing_number,
            team: teamById.get(driver.team_id) ?? null,
            twitchLogin: primaryLogin || fallbackLogin || legacyFallbackLogin,
            twitchLogins,
        };
    });
}
