import { supabase } from './supabaseClient';
import { fetchCurrentCapabilityIds, fetchCurrentViewer, syncCurrentProfile } from './authApi';

const CALENDAR_ROW_ID = 'season3';
const CALENDAR_WRITE_CAPABILITY = 'calendar.write';

function normalizeRevealed(input) {
    if (!Array.isArray(input)) {
        return null;
    }

    if (input.length !== 12) {
        return null;
    }

    const normalized = input.map((value) => Number(value));
    const valid = normalized.every(
        (value) => Number.isInteger(value) && value >= 0 && value <= 24,
    );

    if (!valid) {
        return null;
    }

    return normalized;
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
    return capabilityIds.includes(CALENDAR_WRITE_CAPABILITY);
}

export async function fetchCalendarData() {
    const canEdit = await resolveCanEdit().catch(() => false);
    const { data, error } = await supabase
        .from('calendar_settings')
        .select('revealed')
        .eq('id', CALENDAR_ROW_ID)
        .maybeSingle();

    if (error) {
        throw error;
    }

    const revealed = normalizeRevealed(data?.revealed ?? Array(12).fill(0));
    if (!revealed) {
        throw new Error('Invalid calendar payload');
    }

    return {
        revealed,
        canEdit,
    };
}

export async function fetchRevealedGpIds() {
    const data = await fetchCalendarData();
    return data.revealed;
}

export async function updateRevealedGpIds(revealed) {
    const normalized = normalizeRevealed(revealed);
    if (!normalized) {
        throw new Error('Invalid calendar payload');
    }

    const profile = await syncCurrentProfile();
    if (!profile?.id) {
        throw new Error('Authentication required');
    }

    const { data, error } = await supabase
        .from('calendar_settings')
        .update({
            revealed: normalized,
            updated_by: profile.id,
        })
        .eq('id', CALENDAR_ROW_ID)
        .select('revealed')
        .single();

    if (error) {
        throw new Error(error.message ?? 'Calendar update failed');
    }

    const nextRevealed = normalizeRevealed(data?.revealed);
    if (!nextRevealed) {
        throw new Error('Invalid calendar payload');
    }

    return nextRevealed;
}
