import { supabase } from './supabaseClient';

const SNAPSHOT_ID = 'default';

export function getMultiTwitchSnapshotId() {
    return SNAPSHOT_ID;
}

export async function fetchMultiTwitchSnapshot() {
    const { data, error } = await supabase
        .from('multi_twitch_live_snapshot')
        .select(
            'id, live_channels, refresh_status, refresh_trigger, refresh_started_at, updated_at, last_error',
        )
        .eq('id', SNAPSHOT_ID)
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function requestMultiTwitchRefresh(trigger = 'auto') {
    const { data, error } = await supabase.functions.invoke(
        'refresh-multi-twitch-live',
        {
            body: { trigger },
        },
    );

    if (error) {
        throw error;
    }

    return data;
}
