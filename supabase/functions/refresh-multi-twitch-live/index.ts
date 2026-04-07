import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SNAPSHOT_ID = 'default';
const SNAPSHOT_TTL_MS = 60_000;
const MANUAL_REFRESH_COOLDOWN_MS = 15_000;
const RUNNING_STALE_MS = 15_000;
const CASTER_LOGIN = 'guygui_onlive';
const ENABLE_MULTI_TWITCH_TEST_CHANNELS = true;
const MULTI_TWITCH_TEST_CHANNELS = [
    'devgirl_',
    'samueletienne',
    'chloe',
    'senshihira',
    'harvendore',
    'mynthos',
    'missdadou',
    'miyukichan__',
    'monodie',
    'jeanmassiet',
    'cyver__',
    'clara_doxal',
    'quartiergaminclub',
];

function jsonResponse(status: number, payload: unknown) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        },
    });
}

function normalizeLogin(value: string | null | undefined) {
    return String(value ?? '')
        .trim()
        .toLowerCase();
}

function isSnapshotFresh(snapshot: { updated_at: string | null | undefined }) {
    if (!snapshot?.updated_at) {
        return false;
    }

    return Date.now() - Date.parse(snapshot.updated_at) < SNAPSHOT_TTL_MS;
}

function isManualRefreshCoolingDown(snapshot: {
    updated_at: string | null | undefined;
}) {
    if (!snapshot?.updated_at) {
        return false;
    }

    return (
        Date.now() - Date.parse(snapshot.updated_at) <
        MANUAL_REFRESH_COOLDOWN_MS
    );
}

async function fetchSnapshot(adminClient: ReturnType<typeof createClient>) {
    const { data, error } = await adminClient
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

async function fetchTrackedChannels(
    adminClient: ReturnType<typeof createClient>,
) {
    const { data: drivers, error: driversError } = await adminClient
        .from('drivers')
        .select('id, display_name, linked_user_id, is_active')
        .eq('is_active', true)
        .order('display_name', { ascending: true });

    if (driversError) {
        throw driversError;
    }

    const linkedProfileIds = [
        ...new Set(
            (drivers ?? [])
                .map((driver) => driver.linked_user_id)
                .filter(Boolean),
        ),
    ];

    let profileLoginById = new Map<string, string | null>();

    if (linkedProfileIds.length > 0) {
        const { data: profiles, error: profilesError } = await adminClient
            .from('profiles')
            .select('id, provider_login')
            .in('id', linkedProfileIds);

        if (profilesError) {
            throw profilesError;
        }

        profileLoginById = new Map(
            (profiles ?? []).map((profile) => [
                profile.id,
                profile.provider_login,
            ]),
        );
    }

    const logins = new Set<string>([CASTER_LOGIN]);

    if (ENABLE_MULTI_TWITCH_TEST_CHANNELS) {
        for (const login of MULTI_TWITCH_TEST_CHANNELS) {
            const normalizedLogin = normalizeLogin(login);
            if (normalizedLogin) {
                logins.add(normalizedLogin);
            }
        }
    }

    for (const driver of drivers ?? []) {
        const primaryLogin = normalizeLogin(
            profileLoginById.get(driver.linked_user_id),
        );
        const fallbackLogin = normalizeLogin(driver.display_name);
        const legacyFallbackLogin = normalizeLogin(driver.id);

        if (primaryLogin) {
            logins.add(primaryLogin);
        }

        if (fallbackLogin) {
            logins.add(fallbackLogin);
        }

        if (legacyFallbackLogin) {
            logins.add(legacyFallbackLogin);
        }
    }

    return [...logins];
}

async function getTwitchAppToken(clientId: string, clientSecret: string) {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'client_credentials',
        }),
    });

    if (!response.ok) {
        throw new Error(`Twitch token error: ${response.status}`);
    }

    const payload = await response.json();
    return payload.access_token as string;
}

async function fetchLiveChannels(
    logins: string[],
    clientId: string,
    accessToken: string,
) {
    const url = new URL('https://api.twitch.tv/helix/streams');

    for (const login of logins) {
        url.searchParams.append('user_login', login);
    }

    const response = await fetch(url, {
        headers: {
            'Client-Id': clientId,
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Twitch streams error: ${response.status}`);
    }

    const payload = await response.json();

    return (payload.data ?? []).map((stream: Record<string, unknown>) => ({
        twitch_login: normalizeLogin(String(stream.user_login ?? '')),
        title: String(stream.title ?? ''),
        viewer_count: Number(stream.viewer_count ?? 0),
        started_at: String(stream.started_at ?? ''),
        thumbnail_url: String(stream.thumbnail_url ?? ''),
    }));
}

Deno.serve(async (request) => {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const twitchClientId = Deno.env.get('TWITCH_CLIENT_ID');
    const twitchClientSecret = Deno.env.get('TWITCH_CLIENT_SECRET');

    if (
        !supabaseUrl ||
        !supabaseServiceRoleKey ||
        !twitchClientId ||
        !twitchClientSecret
    ) {
        return jsonResponse(500, { error: 'Missing server configuration' });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    try {
        const body = await request.json().catch(() => ({}));
        const requestedTrigger = body?.trigger === 'manual' ? 'manual' : 'auto';

        let snapshot = await fetchSnapshot(adminClient);

        if (snapshot.refresh_status === 'running') {
            const refreshStartedAt = snapshot.refresh_started_at
                ? Date.parse(snapshot.refresh_started_at)
                : 0;
            if (Date.now() - refreshStartedAt < RUNNING_STALE_MS) {
                return jsonResponse(200, { refreshed: false, snapshot });
            }
        }

        if (
            requestedTrigger === 'manual' &&
            isManualRefreshCoolingDown(snapshot)
        ) {
            return jsonResponse(200, { refreshed: false, snapshot });
        }

        if (requestedTrigger !== 'manual' && isSnapshotFresh(snapshot)) {
            return jsonResponse(200, { refreshed: false, snapshot });
        }

        const staleBefore = new Date(
            Date.now() - SNAPSHOT_TTL_MS,
        ).toISOString();
        const runningStaleBefore = new Date(
            Date.now() - RUNNING_STALE_MS,
        ).toISOString();

        const { data: claimGranted, error: claimError } = await adminClient.rpc(
            'claim_multi_twitch_live_refresh',
            {
                snapshot_id: SNAPSHOT_ID,
                requested_trigger: requestedTrigger,
                stale_before: staleBefore,
                running_stale_before: runningStaleBefore,
            },
        );

        if (claimError) {
            throw claimError;
        }

        if (!claimGranted) {
            snapshot = await fetchSnapshot(adminClient);
            return jsonResponse(200, { refreshed: false, snapshot });
        }

        const trackedLogins = await fetchTrackedChannels(adminClient);
        const accessToken = await getTwitchAppToken(
            twitchClientId,
            twitchClientSecret,
        );
        const liveChannels = await fetchLiveChannels(
            trackedLogins,
            twitchClientId,
            accessToken,
        );

        const { data: updatedSnapshot, error: updateError } = await adminClient
            .from('multi_twitch_live_snapshot')
            .update({
                live_channels: liveChannels,
                refresh_status: 'idle',
                refresh_trigger: requestedTrigger,
                refresh_started_at: null,
                last_error: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', SNAPSHOT_ID)
            .select(
                'id, live_channels, refresh_status, refresh_trigger, refresh_started_at, updated_at, last_error',
            )
            .single();

        if (updateError) {
            throw updateError;
        }

        return jsonResponse(200, {
            refreshed: true,
            snapshot: updatedSnapshot,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Unknown error';

        await adminClient
            .from('multi_twitch_live_snapshot')
            .update({
                refresh_status: 'idle',
                refresh_started_at: null,
                last_error: message,
                updated_at: new Date().toISOString(),
            })
            .eq('id', SNAPSHOT_ID);

        const snapshot = await fetchSnapshot(adminClient).catch(() => null);

        return jsonResponse(500, {
            error: message,
            snapshot,
        });
    }
});
