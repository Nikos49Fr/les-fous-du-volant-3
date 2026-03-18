import { supabase } from './supabaseClient';

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
