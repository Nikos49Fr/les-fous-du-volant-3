import { supabase } from './supabaseClient';

let authCodeExchangePromise = null;

function getProviderIdentity(user) {
    return (
        user?.identities?.find((identity) => identity.provider === 'twitch') ?? null
    );
}

function getIdentityMetadata(user) {
    return getProviderIdentity(user)?.identity_data ?? {};
}

function getTwitchLogin(user) {
    const metadata = user?.user_metadata ?? {};
    const identityMetadata = getIdentityMetadata(user);

    return (
        identityMetadata.preferred_username ??
        identityMetadata.user_name ??
        metadata.preferred_username ??
        metadata.user_name ??
        metadata.name ??
        null
    );
}

function getTwitchDisplayName(user) {
    const metadata = user?.user_metadata ?? {};
    const identityMetadata = getIdentityMetadata(user);

    return (
        identityMetadata.display_name ??
        identityMetadata.nickname ??
        identityMetadata.slug ??
        identityMetadata.name ??
        metadata.display_name ??
        metadata.nickname ??
        metadata.slug ??
        metadata.full_name ??
        metadata.preferred_username ??
        metadata.user_name ??
        metadata.name ??
        'Utilisateur'
    );
}

function getProfilePayload(user) {
    const metadata = user?.user_metadata ?? {};
    const identity = getProviderIdentity(user);

    return {
        id: user.id,
        provider: 'twitch',
        provider_user_id: identity?.id ?? metadata.provider_id ?? null,
        provider_login: getTwitchLogin(user),
        display_name: getTwitchDisplayName(user),
        avatar_url: metadata.avatar_url ?? metadata.picture ?? null,
    };
}

function mapViewer(user, profile) {
    if (!user || !profile) {
        return null;
    }

    return {
        id: user.id,
        login: profile.provider_login ?? profile.display_name,
        display_name: profile.display_name,
        profile_image_url: profile.avatar_url,
        isSuperAdmin: profile.is_super_admin === true,
    };
}

function clearAuthParamsFromUrl() {
    const url = new URL(window.location.href);
    const authParams = [
        'code',
        'error',
        'error_code',
        'error_description',
        'state',
    ];

    authParams.forEach((param) => url.searchParams.delete(param));

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, document.title, nextUrl);
}

async function ensureSessionFromUrl() {
    if (typeof window === 'undefined') {
        return;
    }

    if (authCodeExchangePromise) {
        return authCodeExchangePromise;
    }

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const errorDescription = url.searchParams.get('error_description');

    if (!code && !errorDescription) {
        return;
    }

    authCodeExchangePromise = (async () => {
        try {
            if (errorDescription) {
                throw new Error(errorDescription);
            }

            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
                throw error;
            }
        } finally {
            clearAuthParamsFromUrl();
            authCodeExchangePromise = null;
        }
    })();

    return authCodeExchangePromise;
}

async function getCurrentAuthUser() {
    await ensureSessionFromUrl();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        throw error;
    }

    return user ?? null;
}

export async function syncCurrentProfile() {
    const user = await getCurrentAuthUser();
    if (!user) {
        return null;
    }

    const payload = getProfilePayload(user);
    const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function fetchCurrentViewer() {
    const user = await getCurrentAuthUser();
    if (!user) {
        return null;
    }

    const profile = await syncCurrentProfile();
    return mapViewer(user, profile);
}

export async function fetchCurrentCapabilityIds() {
    const user = await getCurrentAuthUser();
    if (!user) {
        return [];
    }

    await syncCurrentProfile();

    const { data, error } = await supabase
        .from('user_capabilities')
        .select('capability_id, enabled')
        .eq('user_id', user.id);

    if (error) {
        throw error;
    }

    return (data ?? [])
        .filter((item) => item.enabled === true)
        .map((item) => item.capability_id);
}

export async function signInWithTwitch() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitch',
        options: {
            redirectTo: window.location.origin,
        },
    });

    if (error) {
        throw error;
    }
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
}

export function subscribeToAuthChanges(callback) {
    const {
        data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session ?? null);
    });

    return () => {
        subscription.unsubscribe();
    };
}
