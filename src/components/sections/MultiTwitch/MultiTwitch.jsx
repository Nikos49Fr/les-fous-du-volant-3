import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './MultiTwitch.scss';
import { fetchMultiTwitchRoster } from '../../../utils/driversApi';
import {
    fetchMultiTwitchSnapshot,
    requestMultiTwitchRefresh,
} from '../../../utils/multiTwitchApi';
import {
    fetchCurrentCapabilityIds,
    subscribeToAuthChanges,
} from '../../../utils/authApi';
import { getMultiTwitchViewportMaxPov } from './shared/multiTwitchViewport.js';
import MultiTwitchRosterPanel from './MultiTwitchRosterPanel.jsx';
import MultiTwitchStagePanel from './MultiTwitchStagePanel.jsx';
import MultiTwitchChatPanel from './MultiTwitchChatPanel.jsx';

const SNAPSHOT_TTL_MS = 60_000;
const SNAPSHOT_RUNNING_POLL_MS = 1_000;
const REFRESH_BUTTON_COOLDOWN_MS = 15_000;
const RETRY_AFTER_ERROR_MS = 5_000;
const MAX_SELECTED_POV = 6;
const AUDIO_BACKGROUND_VOLUME = 1;
const MULTI_TWITCH_STORAGE_KEY = 'fdv-multi-twitch-config';
const MULTI_TWITCH_TEST_CHANNELS_CAPABILITY =
    'multi_twitch.test_channels.view';

const CASTER_ENTRY = {
    id: 'guygui_onlive',
    displayName: 'Guygui_OnLive',
    twitchLogin: 'guygui_onlive',
    twitchLogins: ['guygui_onlive'],
    sourceType: 'caster',
};

const ENABLE_MULTI_TWITCH_TEST_CHANNELS = true;

const MULTI_TWITCH_TEST_CHANNELS = [
    'DevGirl_',
    'samueletienne',
    'CHLOE',
    'SenshiHira',
    'Harvendore',
    'Mynthos',
    'MissDadou',
    'Miyukichan__',
    'Monodie',
    'JeanMassiet',
    'Cyver__',
    'Clara_Doxal',
    'QuartierGaminClub',
];

const TEST_CHANNEL_ENTRIES = MULTI_TWITCH_TEST_CHANNELS.map((login) => ({
    id: `test:${login.toLowerCase()}`,
    displayName: login,
    twitchLogin: login.toLowerCase(),
    twitchLogins: [login.toLowerCase()],
    sourceType: 'test',
}));

function compareBaseRosterOrder(leftEntry, rightEntry) {
    const sourceRank = {
        caster: 0,
        driver: 1,
        test: 2,
    };

    const leftRank = sourceRank[leftEntry.sourceType] ?? 99;
    const rightRank = sourceRank[rightEntry.sourceType] ?? 99;

    if (leftRank !== rightRank) {
        return leftRank - rightRank;
    }

    return leftEntry.displayName.localeCompare(rightEntry.displayName, 'fr', {
        sensitivity: 'base',
    });
}

function loadStoredConfig() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const rawValue = window.localStorage.getItem(MULTI_TWITCH_STORAGE_KEY);
        if (!rawValue) {
            return null;
        }

        const parsedValue = JSON.parse(rawValue);
        return {
            selectedIds: Array.isArray(parsedValue?.selectedIds)
                ? parsedValue.selectedIds
                : [],
            isSidebarExpanded: parsedValue?.isSidebarExpanded !== false,
            isChatExpanded: parsedValue?.isChatExpanded !== false,
            chatTheme:
                parsedValue?.chatTheme === 'light' ||
                parsedValue?.chatTheme === 'dark'
                    ? parsedValue.chatTheme
                    : '',
            primaryAudioEntryId:
                typeof parsedValue?.primaryAudioEntryId === 'string'
                    ? parsedValue.primaryAudioEntryId
                    : '',
            primaryAudioVolume: Number.isFinite(parsedValue?.primaryAudioVolume)
                ? Math.min(
                      100,
                      Math.max(0, Number(parsedValue.primaryAudioVolume)),
                  )
                : 100,
            primaryAudioLastNonZeroVolume: Number.isFinite(
                parsedValue?.primaryAudioLastNonZeroVolume,
            )
                ? Math.min(
                      100,
                      Math.max(
                          1,
                          Number(parsedValue.primaryAudioLastNonZeroVolume),
                      ),
                  )
                : 100,
            isAllAudioMuted: parsedValue?.isAllAudioMuted === true,
            entryAudioSettings: normalizeStoredEntryAudioSettings(
                parsedValue?.entryAudioSettings,
            ),
        };
    } catch {
        return null;
    }
}

function resolveDefaultChatTheme() {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return 'dark';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

function isSnapshotStale(snapshot, nowMs = Date.now()) {
    if (!snapshot?.updated_at) {
        return true;
    }

    return nowMs - Date.parse(snapshot.updated_at) >= SNAPSHOT_TTL_MS;
}

function canManualRefreshSnapshot(snapshot, nowMs = Date.now()) {
    if (!snapshot?.updated_at) {
        return true;
    }

    return (
        nowMs - Date.parse(snapshot.updated_at) >= REFRESH_BUTTON_COOLDOWN_MS
    );
}

function normalizeStoredEntryAudioSettings(rawEntryAudioSettings) {
    if (
        !rawEntryAudioSettings ||
        typeof rawEntryAudioSettings !== 'object' ||
        Array.isArray(rawEntryAudioSettings)
    ) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(rawEntryAudioSettings).flatMap(([entryId, value]) => {
            if (
                !value ||
                typeof value !== 'object' ||
                Array.isArray(value)
            ) {
                return [];
            }

            const volume = Number.isFinite(value.volume)
                ? Math.min(100, Math.max(0, Number(value.volume)))
                : 100;
            const lastNonZeroVolume = Number.isFinite(value.lastNonZeroVolume)
                ? Math.min(100, Math.max(1, Number(value.lastNonZeroVolume)))
                : volume > 0
                  ? volume
                  : 100;

            return [[entryId, { volume, lastNonZeroVolume }]];
        }),
    );
}

export default function MultiTwitch() {
    const storedConfig = useMemo(() => loadStoredConfig(), []);
    const [drivers, setDrivers] = useState([]);
    const [selectedEntryIds, setSelectedEntryIds] = useState(() => [
        ...new Set(
            (storedConfig?.selectedIds ?? []).slice(0, MAX_SELECTED_POV),
        ),
    ]);
    const [isRosterLoading, setIsRosterLoading] = useState(true);
    const [snapshot, setSnapshot] = useState(null);
    const [isSnapshotLoading, setIsSnapshotLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(
        storedConfig?.isSidebarExpanded ?? true,
    );
    const [isChatExpanded, setIsChatExpanded] = useState(
        storedConfig?.isChatExpanded ?? true,
    );
    const [chatTheme, setChatTheme] = useState(
        storedConfig?.chatTheme || resolveDefaultChatTheme(),
    );
    const [canViewTestChannels, setCanViewTestChannels] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(() =>
        typeof window === 'undefined' ? 1440 : window.innerWidth,
    );
    const [activeChatIndex, setActiveChatIndex] = useState(0);
    const [nowMs, setNowMs] = useState(() => Date.now());
    const [pendingRefreshTrigger, setPendingRefreshTrigger] = useState(null);
    const [nextAutoRefreshAt, setNextAutoRefreshAt] = useState(null);
    const [retryAfterErrorAt, setRetryAfterErrorAt] = useState(null);
    const [primaryAudioEntryId, setPrimaryAudioEntryId] = useState(
        storedConfig?.primaryAudioEntryId ?? '',
    );
    const [primaryAudioVolume, setPrimaryAudioVolume] = useState(
        storedConfig?.primaryAudioVolume ?? 100,
    );
    const [primaryAudioLastNonZeroVolume, setPrimaryAudioLastNonZeroVolume] =
        useState(
            storedConfig?.primaryAudioLastNonZeroVolume ??
                (storedConfig?.primaryAudioVolume > 0
                    ? storedConfig.primaryAudioVolume
                    : 100),
        );
    const [isAllAudioMuted, setIsAllAudioMuted] = useState(
        storedConfig?.isAllAudioMuted ?? false,
    );
    const [entryAudioSettings, setEntryAudioSettings] = useState(
        () => storedConfig?.entryAudioSettings ?? {},
    );
    const [draggingEntryId, setDraggingEntryId] = useState('');
    const [dragOverEntryId, setDragOverEntryId] = useState('');

    const muteAllRestoreSettingsRef = useRef({});

    const fetchSnapshotAndStore = useCallback(async () => {
        const nextSnapshot = await fetchMultiTwitchSnapshot();
        setSnapshot(nextSnapshot);
        return nextSnapshot;
    }, []);

    const markSnapshotFresh = useCallback((currentSnapshot) => {
        setErrorMessage('');
        setPendingRefreshTrigger(null);
        setRetryAfterErrorAt(null);
        const nextRefreshAt = currentSnapshot?.updated_at
            ? Date.parse(currentSnapshot.updated_at) + SNAPSHOT_TTL_MS
            : Date.now() + SNAPSHOT_TTL_MS;
        setNextAutoRefreshAt(nextRefreshAt);
    }, []);

    const markRefreshPending = useCallback((trigger = 'auto') => {
        setPendingRefreshTrigger(trigger);
        setNextAutoRefreshAt(null);
    }, []);

    const markRefreshError = useCallback((message) => {
        setPendingRefreshTrigger(null);
        setRetryAfterErrorAt(Date.now() + RETRY_AFTER_ERROR_MS);
        setErrorMessage(message);
    }, []);

    const processSnapshot = useCallback(
        async (currentSnapshot, trigger = 'auto') => {
            if (!currentSnapshot) {
                markRefreshError(
                    'Impossible de charger l’état des lives pour le moment.',
                );
                return;
            }

            if (currentSnapshot.refresh_status === 'running') {
                markRefreshPending(currentSnapshot.refresh_trigger ?? trigger);
                return;
            }

            const shouldRequestRefresh =
                trigger === 'manual'
                    ? canManualRefreshSnapshot(currentSnapshot)
                    : isSnapshotStale(currentSnapshot);

            if (shouldRequestRefresh) {
                markRefreshPending(trigger);

                try {
                    const response = await requestMultiTwitchRefresh(trigger);
                    const responseSnapshot = response?.snapshot ?? null;

                    if (responseSnapshot) {
                        setSnapshot(responseSnapshot);

                        if (
                            responseSnapshot.refresh_status !== 'running' &&
                            !isSnapshotStale(responseSnapshot)
                        ) {
                            markSnapshotFresh(responseSnapshot);
                            return;
                        }

                        markRefreshPending(
                            responseSnapshot.refresh_trigger ?? trigger,
                        );
                        return;
                    }
                } catch (_error) {
                    markRefreshError(
                        'Impossible de charger l’état des lives pour le moment.',
                    );
                    return;
                }

                return;
            }

            markSnapshotFresh(currentSnapshot);
        },
        [markRefreshError, markRefreshPending, markSnapshotFresh],
    );

    const syncSnapshot = useCallback(
        async (trigger = 'auto') => {
            try {
                const currentSnapshot = await fetchSnapshotAndStore();
                await processSnapshot(currentSnapshot, trigger);
            } catch (_error) {
                markRefreshError(
                    'Impossible de charger l’état des lives pour le moment.',
                );
            } finally {
                setIsSnapshotLoading(false);
            }
        },
        [fetchSnapshotAndStore, markRefreshError, processSnapshot],
    );

    useEffect(() => {
        let isMounted = true;

        async function loadRoster() {
            try {
                setIsRosterLoading(true);
                const roster = await fetchMultiTwitchRoster();
                if (!isMounted) {
                    return;
                }
                setDrivers(roster);
            } catch (_error) {
                if (!isMounted) {
                    return;
                }
                setErrorMessage(
                    'Impossible de charger la liste des pilotes pour le moment.',
                );
            } finally {
                if (isMounted) {
                    setIsRosterLoading(false);
                }
            }
        }

        loadRoster();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function syncViewerCapabilities() {
            try {
                const capabilityIds = await fetchCurrentCapabilityIds();
                if (!isMounted) {
                    return;
                }

                setCanViewTestChannels(
                    capabilityIds.includes(MULTI_TWITCH_TEST_CHANNELS_CAPABILITY),
                );
            } catch {
                if (!isMounted) {
                    return;
                }

                setCanViewTestChannels(false);
            }
        }

        syncViewerCapabilities();

        const unsubscribe = subscribeToAuthChanges(() => {
            syncViewerCapabilities();
        });

        return () => {
            isMounted = false;
            unsubscribe?.();
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        function handleResize() {
            setViewportWidth(window.innerWidth);
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if (
            !isSidebarExpanded ||
            snapshot ||
            pendingRefreshTrigger ||
            errorMessage
        ) {
            return;
        }

        syncSnapshot('auto');
    }, [
        errorMessage,
        isSidebarExpanded,
        pendingRefreshTrigger,
        snapshot,
        syncSnapshot,
    ]);

    useEffect(() => {
        if (!isSidebarExpanded) {
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            setNowMs(Date.now());
        }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [isSidebarExpanded]);

    useEffect(() => {
        if (!isSidebarExpanded || isSnapshotLoading) {
            return undefined;
        }

        let timeoutMs = SNAPSHOT_TTL_MS;

        if (pendingRefreshTrigger) {
            timeoutMs = SNAPSHOT_RUNNING_POLL_MS;
        } else if (retryAfterErrorAt) {
            timeoutMs = Math.max(
                SNAPSHOT_RUNNING_POLL_MS,
                retryAfterErrorAt - Date.now(),
            );
        } else if (nextAutoRefreshAt) {
            timeoutMs = Math.max(
                SNAPSHOT_RUNNING_POLL_MS,
                nextAutoRefreshAt - Date.now(),
            );
        }

        const timeoutId = window.setTimeout(() => {
            syncSnapshot(
                pendingRefreshTrigger === 'manual' ? 'manual' : 'auto',
            );
        }, timeoutMs);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [
        isSidebarExpanded,
        isSnapshotLoading,
        nextAutoRefreshAt,
        pendingRefreshTrigger,
        retryAfterErrorAt,
        syncSnapshot,
    ]);

    const rosterEntries = useMemo(
        () => [
            CASTER_ENTRY,
            ...drivers.map((driver) => ({
                ...driver,
                sourceType: 'driver',
            })),
            ...(ENABLE_MULTI_TWITCH_TEST_CHANNELS && canViewTestChannels
                ? TEST_CHANNEL_ENTRIES
                : []),
        ],
        [canViewTestChannels, drivers],
    );

    useEffect(() => {
        if (rosterEntries.length === 0) {
            return;
        }

        const availableIds = new Set(rosterEntries.map((entry) => entry.id));
        setSelectedEntryIds((current) => {
            const next = current
                .filter((id) => availableIds.has(id))
                .slice(0, MAX_SELECTED_POV);

            return next.length === current.length &&
                next.every((id, index) => id === current[index])
                ? current
                : next;
        });
    }, [rosterEntries]);

    const rosterEntriesById = useMemo(
        () => new Map(rosterEntries.map((entry) => [entry.id, entry])),
        [rosterEntries],
    );

    const selectedIdSet = useMemo(
        () => new Set(selectedEntryIds),
        [selectedEntryIds],
    );

    const liveChannelsByLogin = useMemo(
        () =>
            new Map(
                (snapshot?.live_channels ?? [])
                    .map((channel) => [
                        String(channel?.twitch_login ?? '')
                            .trim()
                            .toLowerCase(),
                        channel,
                    ])
                    .filter(([login]) => Boolean(login)),
            ),
        [snapshot],
    );

    const baseLiveEntries = useMemo(() => {
        return rosterEntries.flatMap((entry) => {
            const candidateLogins = Array.isArray(entry.twitchLogins)
                ? entry.twitchLogins
                : [entry.twitchLogin];

            const activeTwitchLogin = candidateLogins.find((login) =>
                liveChannelsByLogin.has(
                    String(login ?? '')
                        .trim()
                        .toLowerCase(),
                ),
            );

            if (!activeTwitchLogin) {
                return [];
            }

            return [
                {
                    ...entry,
                    activeTwitchLogin: String(activeTwitchLogin)
                        .trim()
                        .toLowerCase(),
                },
            ];
        });
    }, [rosterEntries, liveChannelsByLogin]);

    const liveEntries = useMemo(
        () => [...baseLiveEntries].sort(compareBaseRosterOrder),
        [baseLiveEntries],
    );

    const selectedEntries = useMemo(
        () =>
            selectedEntryIds
                .map((id) => {
                    const entry = rosterEntriesById.get(id);
                    if (!entry) {
                        return null;
                    }

                    const candidateLogins = Array.isArray(entry.twitchLogins)
                        ? entry.twitchLogins
                        : [entry.twitchLogin];

                    const activeTwitchLogin = candidateLogins.find((login) =>
                        liveChannelsByLogin.has(
                            String(login ?? '')
                                .trim()
                                .toLowerCase(),
                        ),
                    );

                    return {
                        ...entry,
                        activeTwitchLogin: activeTwitchLogin
                            ? String(activeTwitchLogin).trim().toLowerCase()
                            : '',
                    };
                })
                .filter(Boolean)
                .slice(0, MAX_SELECTED_POV),
        [selectedEntryIds, rosterEntriesById, liveChannelsByLogin],
    );

    const viewportMaxPov = useMemo(
        () => getMultiTwitchViewportMaxPov(viewportWidth),
        [viewportWidth],
    );

    const visibleSelectedEntries = useMemo(
        () => selectedEntries.slice(0, viewportMaxPov),
        [selectedEntries, viewportMaxPov],
    );

    const hiddenSelectedCount = Math.max(
        0,
        selectedEntries.length - visibleSelectedEntries.length,
    );

    const endedSelectedEntries = useMemo(
        () => selectedEntries.filter((entry) => !entry.activeTwitchLogin),
        [selectedEntries],
    );

    const orderedLiveEntries = useMemo(() => {
        const selectedLiveEntries = selectedEntries.filter((entry) =>
            Boolean(entry.activeTwitchLogin),
        );
        const selectedLiveIdSet = new Set(
            selectedLiveEntries.map((entry) => entry.id),
        );

        return [
            ...selectedLiveEntries,
            ...liveEntries.filter((entry) => !selectedLiveIdSet.has(entry.id)),
        ];
    }, [liveEntries, selectedEntries]);

    useEffect(() => {
        if (visibleSelectedEntries.length === 0) {
            setActiveChatIndex(0);
            return;
        }

        setActiveChatIndex((current) =>
            Math.min(current, visibleSelectedEntries.length - 1),
        );
    }, [visibleSelectedEntries]);

    useEffect(() => {
        if (
            primaryAudioEntryId &&
            !selectedEntries.some((entry) => entry.id === primaryAudioEntryId)
        ) {
            setPrimaryAudioEntryId('');
        }
    }, [primaryAudioEntryId, selectedEntries]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        window.localStorage.setItem(
            MULTI_TWITCH_STORAGE_KEY,
            JSON.stringify({
                selectedIds: [...selectedEntryIds],
                isSidebarExpanded,
                isChatExpanded,
                chatTheme,
                primaryAudioEntryId,
                primaryAudioVolume,
                primaryAudioLastNonZeroVolume,
                isAllAudioMuted,
                entryAudioSettings,
            }),
        );
    }, [
        chatTheme,
        entryAudioSettings,
        isChatExpanded,
        isSidebarExpanded,
        isAllAudioMuted,
        primaryAudioEntryId,
        primaryAudioLastNonZeroVolume,
        primaryAudioVolume,
        selectedEntryIds,
    ]);

    const handlePrimaryAudioVolumeChange = useCallback((nextVolume) => {
        const normalizedVolume = Math.min(100, Math.max(0, Number(nextVolume)));

        setPrimaryAudioVolume(normalizedVolume);

        if (normalizedVolume > 0) {
            setPrimaryAudioLastNonZeroVolume(normalizedVolume);
        }
    }, []);

    const getEntryVolume = useCallback(
        (entryId) => entryAudioSettings[entryId]?.volume ?? 100,
        [entryAudioSettings],
    );

    const handleEntryVolumeChange = useCallback((entryId, nextVolume) => {
        if (!entryId) {
            return;
        }

        const normalizedVolume = Math.min(100, Math.max(0, Number(nextVolume)));

        setEntryAudioSettings((current) => ({
            ...current,
            [entryId]: {
                volume: normalizedVolume,
                lastNonZeroVolume:
                    normalizedVolume > 0
                        ? normalizedVolume
                        : current[entryId]?.lastNonZeroVolume ?? 100,
            },
        }));
    }, []);

    const handleToggleEntryMute = useCallback((entryId) => {
        if (!entryId) {
            return;
        }

        setEntryAudioSettings((current) => {
            const currentVolume = current[entryId]?.volume ?? 100;
            const lastNonZeroVolume =
                current[entryId]?.lastNonZeroVolume ??
                (currentVolume > 0 ? currentVolume : 100);
            const restoredVolume = Math.min(
                100,
                Math.max(1, Number(lastNonZeroVolume)),
            );

            return {
                ...current,
                [entryId]: {
                    volume: currentVolume <= 0 ? restoredVolume : 0,
                    lastNonZeroVolume:
                        currentVolume <= 0 ? restoredVolume : currentVolume,
                },
            };
        });
    }, []);

    const applyAudioMix = useCallback(
        ({
            nextPrimaryEntryId = primaryAudioEntryId,
            nextPrimaryVolume = primaryAudioVolume,
            muteAll = isAllAudioMuted,
        } = {}) => {
            if (selectedEntries.length === 0) {
                return;
            }

            const mainEntryId = selectedEntries.some(
                (entry) => entry.id === nextPrimaryEntryId,
            )
                ? nextPrimaryEntryId
                : selectedEntries[0]?.id;

            setEntryAudioSettings((current) => {
                const nextSettings = { ...current };

                for (const entry of selectedEntries) {
                    const nextVolume =
                        muteAll
                            ? 0
                            : entry.id === mainEntryId
                            ? nextPrimaryVolume
                            : AUDIO_BACKGROUND_VOLUME;

                    nextSettings[entry.id] = {
                        volume: nextVolume,
                        lastNonZeroVolume:
                            nextVolume > 0
                                ? nextVolume
                                : current[entry.id]?.lastNonZeroVolume ?? 100,
                    };
                }

                return nextSettings;
            });
        },
        [
            isAllAudioMuted,
            primaryAudioEntryId,
            primaryAudioVolume,
            selectedEntries,
        ],
    );

    const handleTogglePrimaryAudioMute = useCallback(() => {
        if (!primaryAudioEntryId) {
            return;
        }

        if (primaryAudioVolume <= 0) {
            const restoredVolume = Math.min(
                100,
                Math.max(1, Number(primaryAudioLastNonZeroVolume) || 100),
            );

            setPrimaryAudioLastNonZeroVolume(restoredVolume);
            setPrimaryAudioVolume(restoredVolume);
            applyAudioMix({
                nextPrimaryEntryId: primaryAudioEntryId,
                nextPrimaryVolume: restoredVolume,
            });
            return;
        }

        setPrimaryAudioLastNonZeroVolume(primaryAudioVolume);
        setPrimaryAudioVolume(0);
        applyAudioMix({
            nextPrimaryEntryId: primaryAudioEntryId,
            nextPrimaryVolume: 0,
        });
    }, [
        applyAudioMix,
        primaryAudioEntryId,
        primaryAudioLastNonZeroVolume,
        primaryAudioVolume,
    ]);

    const handlePrimaryAudioEntryChange = useCallback(
        (nextEntryId) => {
            setPrimaryAudioEntryId(nextEntryId);
            setIsAllAudioMuted(false);
            applyAudioMix({
                nextPrimaryEntryId: nextEntryId,
                nextPrimaryVolume: primaryAudioVolume,
                muteAll: false,
            });
        },
        [applyAudioMix, primaryAudioVolume],
    );

    const handleMasterAudioVolumeChange = useCallback(
        (nextVolume) => {
            const normalizedVolume = Math.min(
                100,
                Math.max(0, Number(nextVolume)),
            );
            const entriesWithCustomVolume = selectedEntries.filter(
                (entry) => getEntryVolume(entry.id) !== AUDIO_BACKGROUND_VOLUME,
            );

            handlePrimaryAudioVolumeChange(normalizedVolume);

            if (
                !primaryAudioEntryId ||
                entriesWithCustomVolume.length > 1
            ) {
                return;
            }

            setIsAllAudioMuted(false);
            applyAudioMix({
                nextPrimaryEntryId: primaryAudioEntryId,
                nextPrimaryVolume: normalizedVolume,
                muteAll: false,
            });
        },
        [
            applyAudioMix,
            getEntryVolume,
            handlePrimaryAudioVolumeChange,
            primaryAudioEntryId,
            selectedEntries,
        ],
    );

    const handleToggleMuteAll = useCallback(() => {
        if (selectedEntries.length === 0) {
            return;
        }

        if (isAllAudioMuted) {
            setIsAllAudioMuted(false);
            setEntryAudioSettings((current) => {
                const nextSettings = { ...current };

                for (const entry of selectedEntries) {
                    if (muteAllRestoreSettingsRef.current[entry.id]) {
                        nextSettings[entry.id] =
                            muteAllRestoreSettingsRef.current[entry.id];
                    }
                }

                return nextSettings;
            });
            return;
        }

        muteAllRestoreSettingsRef.current = Object.fromEntries(
            selectedEntries.map((entry) => {
                const currentVolume =
                    entryAudioSettings[entry.id]?.volume ?? 100;

                return [
                    entry.id,
                    {
                        volume: currentVolume,
                        lastNonZeroVolume:
                            entryAudioSettings[entry.id]?.lastNonZeroVolume ??
                            (currentVolume > 0 ? currentVolume : 100),
                    },
                ];
            }),
        );
        setIsAllAudioMuted(true);
        applyAudioMix({
            nextPrimaryEntryId: primaryAudioEntryId,
            nextPrimaryVolume: primaryAudioVolume,
            muteAll: true,
        });
    }, [
        applyAudioMix,
        entryAudioSettings,
        isAllAudioMuted,
        primaryAudioEntryId,
        primaryAudioVolume,
        selectedEntries,
    ]);

    const visiblePrimaryAudioEntryId = useMemo(() => {
        const entriesWithCustomVolume = selectedEntries.filter(
            (entry) => getEntryVolume(entry.id) !== AUDIO_BACKGROUND_VOLUME,
        );

        if (entriesWithCustomVolume.length > 1) {
            return '';
        }

        return primaryAudioEntryId;
    }, [getEntryVolume, primaryAudioEntryId, selectedEntries]);

    function handleToggleEntry(entryId) {
        setSelectedEntryIds((current) => {
            if (current.includes(entryId)) {
                return current.filter((id) => id !== entryId);
            }

            if (current.length >= viewportMaxPov) {
                return current;
            }

            return [...current, entryId];
        });
    }

    const handlePovDragStart = useCallback((entryId) => {
        setDraggingEntryId(entryId);
        setDragOverEntryId('');
    }, []);

    const handlePovDragEnter = useCallback(
        (targetEntryId) => {
            if (!draggingEntryId || draggingEntryId === targetEntryId) {
                setDragOverEntryId('');
                return;
            }

            setDragOverEntryId(targetEntryId);
        },
        [draggingEntryId],
    );

    const handlePovDragEnd = useCallback(() => {
        setDraggingEntryId('');
        setDragOverEntryId('');
    }, []);

    const handlePovDrop = useCallback(
        (targetEntryId) => {
            if (!draggingEntryId || draggingEntryId === targetEntryId) {
                setDraggingEntryId('');
                setDragOverEntryId('');
                return;
            }

            setSelectedEntryIds((current) => {
                const currentIndex = current.indexOf(draggingEntryId);
                const targetIndex = current.indexOf(targetEntryId);

                if (currentIndex < 0 || targetIndex < 0) {
                    return current;
                }

                const next = [...current];
                next.splice(currentIndex, 1);
                next.splice(targetIndex, 0, draggingEntryId);
                return next;
            });

            setDraggingEntryId('');
            setDragOverEntryId('');
        },
        [draggingEntryId],
    );

    function handleCycleChat(direction) {
        if (visibleSelectedEntries.length === 0) {
            return;
        }

        setActiveChatIndex((current) => {
            const nextIndex = current + direction;
            if (nextIndex < 0) {
                return visibleSelectedEntries.length - 1;
            }
            if (nextIndex >= visibleSelectedEntries.length) {
                return 0;
            }
            return nextIndex;
        });
    }

    async function handleManualRefresh() {
        if (isRefreshButtonDisabled) {
            return;
        }

        markRefreshPending('manual');
        await syncSnapshot('manual');
    }

    const activeChatEntry = visibleSelectedEntries[activeChatIndex] ?? null;
    const refreshReferenceTimestamp =
        snapshot?.refresh_status === 'running'
            ? snapshot.refresh_started_at
            : snapshot?.updated_at;
    const refreshCooldownRemainingMs = refreshReferenceTimestamp
        ? Math.max(
              0,
              Date.parse(refreshReferenceTimestamp) +
                  REFRESH_BUTTON_COOLDOWN_MS -
                  nowMs,
          )
        : 0;
    const isRefreshRunning = Boolean(pendingRefreshTrigger);
    const isRefreshButtonDisabled =
        isRefreshRunning || refreshCooldownRemainingMs > 0;

    const refreshState = isRefreshRunning
        ? pendingRefreshTrigger === 'manual'
            ? 'manual-running'
            : 'auto-running'
        : refreshCooldownRemainingMs > 0
          ? 'cooldown'
          : 'idle';

    const refreshLabel = pendingRefreshTrigger
        ? 'Refresh en cours...'
        : nextAutoRefreshAt && isSidebarExpanded
          ? `Refresh auto dans ${Math.max(
                0,
                Math.ceil((nextAutoRefreshAt - nowMs) / 1000),
            )}s...`
          : 'Refresh auto dans 60s...';

    return (
        <section className="app-section app-multi-twitch">
            <div className="app-multi-twitch__layout">
                <MultiTwitchRosterPanel
                    isExpanded={isSidebarExpanded}
                    onTogglePanel={() =>
                        setIsSidebarExpanded((current) => !current)
                    }
                    errorMessage={errorMessage}
                    isLoading={
                        isRosterLoading || (isSnapshotLoading && !snapshot)
                    }
                    liveEntries={orderedLiveEntries}
                    endedSelectedEntries={endedSelectedEntries}
                    selectedIds={selectedIdSet}
                    onToggleEntry={handleToggleEntry}
                    refreshLabel={refreshLabel}
                    refreshState={refreshState}
                    onManualRefresh={handleManualRefresh}
                    isRefreshButtonDisabled={isRefreshButtonDisabled}
                    maxSelected={viewportMaxPov}
                    selectedEntries={selectedEntries}
                    primaryAudioEntryId={visiblePrimaryAudioEntryId}
                    onPrimaryAudioEntryChange={handlePrimaryAudioEntryChange}
                    primaryAudioVolume={primaryAudioVolume}
                    onPrimaryAudioVolumeChange={handleMasterAudioVolumeChange}
                    onTogglePrimaryAudioMute={handleTogglePrimaryAudioMute}
                    onToggleMuteAll={handleToggleMuteAll}
                    areAllSelectedEntriesMuted={isAllAudioMuted}
                />

                <MultiTwitchStagePanel
                    selectedEntries={visibleSelectedEntries}
                    hiddenSelectedCount={hiddenSelectedCount}
                    maxVisiblePov={viewportMaxPov}
                    getEntryVolume={getEntryVolume}
                    onEntryVolumeChange={handleEntryVolumeChange}
                    onToggleEntryMute={handleToggleEntryMute}
                    draggingEntryId={draggingEntryId}
                    dragOverEntryId={dragOverEntryId}
                    onPovDragStart={handlePovDragStart}
                    onPovDragEnter={handlePovDragEnter}
                    onPovDragEnd={handlePovDragEnd}
                    onPovDrop={handlePovDrop}
                />

                <MultiTwitchChatPanel
                    isExpanded={isChatExpanded}
                    onTogglePanel={() =>
                        setIsChatExpanded((current) => !current)
                    }
                    chatTheme={chatTheme}
                    onToggleTheme={() =>
                        setChatTheme((current) =>
                            current === 'dark' ? 'light' : 'dark',
                        )
                    }
                    selectedEntries={visibleSelectedEntries}
                    activeChatEntry={activeChatEntry}
                    onPreviousChat={() => handleCycleChat(-1)}
                    onNextChat={() => handleCycleChat(1)}
                />
            </div>
        </section>
    );
}
