import { supabase } from './supabaseClient';

function normalizeLogin(value) {
    return String(value ?? '').trim().toLowerCase();
}

export async function fetchDriversData() {
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
            .select('id, display_name, racing_number, team_id, is_active')
            .eq('is_active', true)
            .order('display_name', { ascending: true }),
    ]);

    if (teamsError) {
        throw teamsError;
    }

    if (driversError) {
        throw driversError;
    }

    const driversByTeamId = new Map();

    for (const driver of drivers ?? []) {
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

export async function fetchMultiTwitchRoster() {
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
                'id, display_name, racing_number, team_id, linked_user_id, is_active',
            )
            .eq('is_active', true)
            .order('display_name', { ascending: true }),
    ]);

    if (teamsError) {
        throw teamsError;
    }

    if (driversError) {
        throw driversError;
    }

    const linkedProfileIds = [...new Set(
        (drivers ?? [])
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

    return (drivers ?? []).map((driver) => {
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
