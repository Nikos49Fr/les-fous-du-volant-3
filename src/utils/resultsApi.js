import { supabase } from './supabaseClient';
import {
    fetchCurrentCapabilityIds,
    fetchCurrentViewer,
    syncCurrentProfile,
} from './authApi';
import {
    buildResultsSchedule,
    buildResultsSessionsByRound,
    RESULTS_SESSION_TYPES,
    RESULTS_WRITE_CAPABILITY,
    sessionSupportsFastestLap,
} from './resultsHelpers';

const CALENDAR_ROW_ID = 'season3';

function normalizeRevealed(input) {
    if (!Array.isArray(input) || input.length !== 12) {
        return Array(12).fill(0);
    }

    return input.map((value) => Number(value));
}

async function resolveCanEdit() {
    const viewer = await fetchCurrentViewer();
    if (!viewer) {
        return false;
    }

    if (viewer.isSuperAdmin) {
        return true;
    }

    const capabilityIds = await fetchCurrentCapabilityIds();
    return capabilityIds.includes(RESULTS_WRITE_CAPABILITY);
}

export async function fetchResultsData() {
    const canEdit = await resolveCanEdit().catch(() => false);

    const [
        { data: calendarRow, error: calendarError },
        { data: teams, error: teamsError },
        { data: drivers, error: driversError },
        { data: sessionRows, error: sessionRowsError },
        { data: entryRows, error: entryRowsError },
    ] = await Promise.all([
        supabase
            .from('calendar_settings')
            .select('revealed')
            .eq('id', CALENDAR_ROW_ID)
            .maybeSingle(),
        supabase
            .from('teams')
            .select('id, name, short_name, color_key, logo_key'),
        supabase
            .from('drivers')
            .select('id, display_name, racing_number, team_id, is_active')
            .eq('is_active', true),
        supabase
            .from('result_sessions')
            .select('id, gp_round, session_type, fastest_lap_driver_id, updated_at, updated_by')
            .order('gp_round', { ascending: true }),
        supabase
            .from('result_entries')
            .select('session_id, driver_id, position, status, has_fastest_lap'),
    ]);

    if (calendarError) throw calendarError;
    if (teamsError) throw teamsError;
    if (driversError) throw driversError;
    if (sessionRowsError) throw sessionRowsError;
    if (entryRowsError) throw entryRowsError;

    const teamsById = new Map(
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

    const normalizedDrivers = (drivers ?? [])
        .map((driver) => ({
            id: driver.id,
            displayName: driver.display_name,
            racingNumber: driver.racing_number,
            teamId: driver.team_id,
            team: teamsById.get(driver.team_id),
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return {
        canEdit,
        drivers: normalizedDrivers,
        schedule: buildResultsSchedule(normalizeRevealed(calendarRow?.revealed)),
        sessionsByRound: buildResultsSessionsByRound(sessionRows, entryRows),
    };
}

export async function saveResultsSession({
    gpRound,
    sessionType,
    entries,
    fastestLapDriverId,
}) {
    if (!Number.isInteger(gpRound) || gpRound < 1 || gpRound > 12) {
        throw new Error('GP invalide');
    }

    if (!RESULTS_SESSION_TYPES.includes(sessionType)) {
        throw new Error('Session invalide');
    }

    if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error('Aucune donnée à sauvegarder');
    }

    const profile = await syncCurrentProfile();
    if (!profile?.id) {
        throw new Error('Authentification requise');
    }

    const normalizedFastestLapDriverId = sessionSupportsFastestLap(sessionType)
        ? fastestLapDriverId ?? null
        : null;

    const { data: sessionRow, error: sessionError } = await supabase
        .from('result_sessions')
        .upsert(
            {
                gp_round: gpRound,
                session_type: sessionType,
                fastest_lap_driver_id: normalizedFastestLapDriverId,
                updated_by: profile.id,
            },
            { onConflict: 'gp_round,session_type' },
        )
        .select('id, gp_round, session_type, fastest_lap_driver_id')
        .single();

    if (sessionError) {
        throw new Error(sessionError.message ?? 'Sauvegarde impossible');
    }

    const normalizedEntries = entries.map((entry) => ({
        session_id: sessionRow.id,
        driver_id: entry.driverId,
        position: entry.position,
        status: entry.status,
        has_fastest_lap:
            sessionSupportsFastestLap(sessionType) &&
            normalizedFastestLapDriverId === entry.driverId,
        updated_by: profile.id,
    }));

    const { error: deleteError } = await supabase
        .from('result_entries')
        .delete()
        .eq('session_id', sessionRow.id);

    if (deleteError) {
        throw new Error(deleteError.message ?? 'Sauvegarde impossible');
    }

    const { data: savedEntries, error: insertError } = await supabase
        .from('result_entries')
        .insert(normalizedEntries)
        .select('driver_id, position, status, has_fastest_lap');

    if (insertError) {
        throw new Error(insertError.message ?? 'Sauvegarde impossible');
    }

    return {
        id: sessionRow.id,
        gpRound: sessionRow.gp_round,
        sessionType: sessionRow.session_type,
        fastestLapDriverId: sessionRow.fastest_lap_driver_id,
        entries: (savedEntries ?? []).map((entry) => ({
            driverId: entry.driver_id,
            position: entry.position,
            status: entry.status,
            hasFastestLap: entry.has_fastest_lap === true,
        })),
    };
}
