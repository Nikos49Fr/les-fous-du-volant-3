import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import './MultiTwitch.scss';
import { fetchMultiTwitchRoster } from '../../../utils/driversApi';
import {
    fetchMultiTwitchSnapshot,
    requestMultiTwitchRefresh,
} from '../../../utils/multiTwitchApi';
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
            primaryAudioEntryId:
                typeof parsedValue?.primaryAudioEntryId === 'string'
                    ? parsedValue.primaryAudioEntryId
                    : '',
            primaryAudioVolume:
                Number.isFinite(parsedValue?.primaryAudioVolume)
                    ? Math.min(100, Math.max(0, Number(parsedValue.primaryAudioVolume)))
                    : 100,
            primaryAudioLastNonZeroVolume:
                Number.isFinite(parsedValue?.primaryAudioLastNonZeroVolume)
                    ? Math.min(
                          100,
                          Math.max(1, Number(parsedValue.primaryAudioLastNonZeroVolume)),
                      )
                    : 100,
        };
    } catch {
        return null;
    }
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

    return nowMs - Date.parse(snapshot.updated_at) >= REFRESH_BUTTON_COOLDOWN_MS;
}

export default function MultiTwitch() {
    const storedConfig = useMemo(() => loadStoredConfig(), []);
    const [drivers, setDrivers] = useState([]);
    const [selectedEntryIds, setSelectedEntryIds] = useState(
        () => [...new Set((storedConfig?.selectedIds ?? []).slice(0, MAX_SELECTED_POV))],
    );
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
    const [primaryAudioLastNonZeroVolume, setPrimaryAudioLastNonZeroVolume] = useState(
        storedConfig?.primaryAudioLastNonZeroVolume ??
            (storedConfig?.primaryAudioVolume > 0 ? storedConfig.primaryAudioVolume : 100),
    );
    const [playerRegistryVersion, setPlayerRegistryVersion] = useState(0);

    const playerControllersRef = useRef(new Map());

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
                markRefreshError('Impossible de charger l’état des lives pour le moment.');
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

                        markRefreshPending(responseSnapshot.refresh_trigger ?? trigger);
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
                markRefreshError('Impossible de charger l’état des lives pour le moment.');
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
        if (!isSidebarExpanded || snapshot || pendingRefreshTrigger || errorMessage) {
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
            syncSnapshot(pendingRefreshTrigger === 'manual' ? 'manual' : 'auto');
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
            ...(ENABLE_MULTI_TWITCH_TEST_CHANNELS ? TEST_CHANNEL_ENTRIES : []),
        ],
        [drivers],
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
                        String(channel?.twitch_login ?? '').trim().toLowerCase(),
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
                liveChannelsByLogin.has(String(login ?? '').trim().toLowerCase()),
            );

            if (!activeTwitchLogin) {
                return [];
            }

            return [
                {
                    ...entry,
                    activeTwitchLogin: String(activeTwitchLogin).trim().toLowerCase(),
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
                        liveChannelsByLogin.has(String(login ?? '').trim().toLowerCase()),
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

    const endedSelectedEntries = useMemo(
        () => selectedEntries.filter((entry) => !entry.activeTwitchLogin),
        [selectedEntries],
    );

    const orderedLiveEntries = useMemo(() => {
        const selectedLiveEntries = selectedEntries.filter(
            (entry) => Boolean(entry.activeTwitchLogin),
        );
        const selectedLiveIdSet = new Set(selectedLiveEntries.map((entry) => entry.id));

        return [
            ...selectedLiveEntries,
            ...liveEntries.filter((entry) => !selectedLiveIdSet.has(entry.id)),
        ];
    }, [liveEntries, selectedEntries]);

    useEffect(() => {
        if (selectedEntries.length === 0) {
            setActiveChatIndex(0);
            return;
        }

        setActiveChatIndex((current) => Math.min(current, selectedEntries.length - 1));
    }, [selectedEntries]);

    useEffect(() => {
        if (!selectedEntries.some((entry) => entry.id === primaryAudioEntryId)) {
            setPrimaryAudioEntryId(selectedEntries[0]?.id ?? '');
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
                primaryAudioEntryId,
                primaryAudioVolume,
                primaryAudioLastNonZeroVolume,
            }),
        );
    }, [
        isChatExpanded,
        isSidebarExpanded,
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

    const handleTogglePrimaryAudioMute = useCallback(() => {
        setPrimaryAudioVolume((currentVolume) => {
            if (currentVolume <= 0) {
                const restoredVolume = Math.min(
                    100,
                    Math.max(1, Number(primaryAudioLastNonZeroVolume) || 100),
                );
                setPrimaryAudioLastNonZeroVolume(restoredVolume);
                return restoredVolume;
            }

            setPrimaryAudioLastNonZeroVolume(currentVolume);
            return 0;
        });
    }, [primaryAudioLastNonZeroVolume]);

    const applyAudioMix = useCallback(() => {
        if (selectedEntries.length === 0) {
            return;
        }

        const mainEntryId = selectedEntries.some(
            (entry) => entry.id === primaryAudioEntryId,
        )
            ? primaryAudioEntryId
            : selectedEntries[0]?.id;

        for (const entry of selectedEntries) {
            const playerController = playerControllersRef.current.get(entry.id);
            if (!playerController?.setVolumePercent) {
                continue;
            }

            if (entry.id === mainEntryId) {
                playerController.setVolumePercent(primaryAudioVolume);
            } else {
                playerController.setVolumePercent(AUDIO_BACKGROUND_VOLUME);
            }
        }
    }, [primaryAudioEntryId, primaryAudioVolume, selectedEntries]);

    useEffect(() => {
        applyAudioMix();
    }, [
        applyAudioMix,
        playerRegistryVersion,
        primaryAudioEntryId,
        primaryAudioVolume,
        selectedEntries,
    ]);

    const registerPlayerController = useCallback((entryId, controller) => {
        if (!entryId) {
            return;
        }

        if (controller) {
            playerControllersRef.current.set(entryId, controller);
        } else {
            playerControllersRef.current.delete(entryId);
        }

        setPlayerRegistryVersion((current) => current + 1);
    }, []);

    function handleToggleEntry(entryId) {
        setSelectedEntryIds((current) => {
            if (current.includes(entryId)) {
                return current.filter((id) => id !== entryId);
            }

            if (current.length >= MAX_SELECTED_POV) {
                return current;
            }

            return [...current, entryId];
        });
    }

    function handleCycleChat(direction) {
        if (selectedEntries.length === 0) {
            return;
        }

        setActiveChatIndex((current) => {
            const nextIndex = current + direction;
            if (nextIndex < 0) {
                return selectedEntries.length - 1;
            }
            if (nextIndex >= selectedEntries.length) {
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

    const activeChatEntry = selectedEntries[activeChatIndex] ?? null;
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
                    onTogglePanel={() => setIsSidebarExpanded((current) => !current)}
                    errorMessage={errorMessage}
                    isLoading={isRosterLoading || (isSnapshotLoading && !snapshot)}
                    liveEntries={orderedLiveEntries}
                    endedSelectedEntries={endedSelectedEntries}
                    selectedIds={selectedIdSet}
                    onToggleEntry={handleToggleEntry}
                    refreshLabel={refreshLabel}
                    refreshState={refreshState}
                    onManualRefresh={handleManualRefresh}
                    isRefreshButtonDisabled={isRefreshButtonDisabled}
                    maxSelected={MAX_SELECTED_POV}
                />

                <MultiTwitchStagePanel
                    selectedEntries={selectedEntries}
                    primaryAudioEntryId={primaryAudioEntryId}
                    onPrimaryAudioEntryChange={setPrimaryAudioEntryId}
                    primaryAudioVolume={primaryAudioVolume}
                    onPrimaryAudioVolumeChange={handlePrimaryAudioVolumeChange}
                    onTogglePrimaryAudioMute={handleTogglePrimaryAudioMute}
                    onApplyAudioMix={applyAudioMix}
                    onRegisterPlayerController={registerPlayerController}
                />

                <MultiTwitchChatPanel
                    isExpanded={isChatExpanded}
                    onTogglePanel={() => setIsChatExpanded((current) => !current)}
                    selectedEntries={selectedEntries}
                    activeChatEntry={activeChatEntry}
                    onPreviousChat={() => handleCycleChat(-1)}
                    onNextChat={() => handleCycleChat(1)}
                />
            </div>
        </section>
    );
}
