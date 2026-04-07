import { useEffect, useRef, useState } from 'react';
import './TwitchPlayerEmbed.scss';

let twitchScriptPromise;

function loadTwitchScript() {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('Twitch player unavailable'));
    }

    if (window.Twitch?.Player) {
        return Promise.resolve(window.Twitch);
    }

    if (!twitchScriptPromise) {
        twitchScriptPromise = new Promise((resolve, reject) => {
            const existingScript = document.querySelector(
                'script[data-twitch-player-script="true"]',
            );

            if (existingScript) {
                existingScript.addEventListener('load', () => resolve(window.Twitch));
                existingScript.addEventListener('error', () =>
                    reject(new Error('Twitch player script failed to load')),
                );
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://player.twitch.tv/js/embed/v1.js';
            script.async = true;
            script.dataset.twitchPlayerScript = 'true';
            script.onload = () => resolve(window.Twitch);
            script.onerror = () =>
                reject(new Error('Twitch player script failed to load'));
            document.head.appendChild(script);
        });
    }

    return twitchScriptPromise;
}

export default function TwitchPlayerEmbed({
    channel,
    title,
    entryId,
    volumePercent = 100,
}) {
    const containerId = `app-twitch-player-${String(entryId).replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const [hasError, setHasError] = useState(false);
    const desiredVolumePercentRef = useRef(
        Math.min(100, Math.max(0, Number(volumePercent))),
    );
    const playerInstanceRef = useRef(null);
    const isPlayerReadyRef = useRef(false);

    useEffect(() => {
        desiredVolumePercentRef.current = Math.min(
            100,
            Math.max(0, Number(volumePercent)),
        );

        if (!isPlayerReadyRef.current || !playerInstanceRef.current?.setVolume) {
            return;
        }

        const normalizedVolume = desiredVolumePercentRef.current / 100;

        if (playerInstanceRef.current?.setMuted) {
            playerInstanceRef.current.setMuted(normalizedVolume <= 0);
        }

        playerInstanceRef.current.setVolume(normalizedVolume);
    }, [volumePercent]);

    useEffect(() => {
        let playerInstance = null;
        let isDisposed = false;

        function applyVolume(nextVolumePercent) {
            if (!playerInstance?.setVolume) {
                return;
            }

            const normalizedVolume = Math.min(
                1,
                Math.max(0, Number(nextVolumePercent) / 100),
            );

            if (playerInstance?.setMuted) {
                playerInstance.setMuted(normalizedVolume <= 0);
            }

            playerInstance.setVolume(normalizedVolume);
        }

        async function mountPlayer() {
            if (!channel) {
                return;
            }

            try {
                setHasError(false);
                const twitch = await loadTwitchScript();

                if (isDisposed || !twitch?.Player) {
                    return;
                }

                const parentHost = window.location.hostname || 'localhost';

                playerInstance = new twitch.Player(containerId, {
                    channel,
                    width: '100%',
                    height: '100%',
                    parent: [parentHost],
                    autoplay: true,
                    muted: true,
                });

                if (playerInstance?.addEventListener && twitch.Player?.READY) {
                    playerInstance.addEventListener(twitch.Player.READY, () => {
                        if (isDisposed) {
                            return;
                        }

                        isPlayerReadyRef.current = true;
                        applyVolume(desiredVolumePercentRef.current);
                    });
                }
                playerInstanceRef.current = playerInstance;
            } catch (_error) {
                if (!isDisposed) {
                    setHasError(true);
                }
            }
        }

        mountPlayer();

        return () => {
            isDisposed = true;
            playerInstanceRef.current = null;
            isPlayerReadyRef.current = false;
            if (playerInstance && typeof playerInstance.destroy === 'function') {
                playerInstance.destroy();
            }
        };
    }, [channel, containerId]);

    return (
        <div className="app-twitch-player-embed">
            <div id={containerId} className="app-twitch-player-embed__mount" />
            {hasError ? (
                <div className="app-twitch-player-embed__fallback">
                    <span>Impossible de charger la POV {title}.</span>
                </div>
            ) : null}
        </div>
    );
}
