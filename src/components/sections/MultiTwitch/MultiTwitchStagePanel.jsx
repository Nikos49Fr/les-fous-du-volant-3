import LiveControls from '../../ui/LiveControls/LiveControls.jsx';
import TwitchPlayerEmbed from '../../ui/TwitchPlayerEmbed/TwitchPlayerEmbed.jsx';

function getStageClassName(selectedCount) {
    if (selectedCount <= 0) {
        return 'app-multi-twitch__pov-grid--empty';
    }

    const boundedCount = Math.min(selectedCount, 6);
    return `app-multi-twitch__pov-grid--${boundedCount}`;
}

function MultiTwitchPovTile({ entry, onRegisterPlayerController }) {
    return (
        <article className="app-multi-twitch__pov-tile">
            <header className="app-multi-twitch__pov-header">{entry.displayName}</header>
            <div className="app-multi-twitch__pov-body">
                <TwitchPlayerEmbed
                    channel={entry.activeTwitchLogin || entry.twitchLogin}
                    title={entry.displayName}
                    entryId={entry.id}
                    onRegisterPlayerController={onRegisterPlayerController}
                />
            </div>
        </article>
    );
}

export default function MultiTwitchStagePanel({
    selectedEntries,
    primaryAudioEntryId,
    onPrimaryAudioEntryChange,
    primaryAudioVolume,
    onPrimaryAudioVolumeChange,
    onTogglePrimaryAudioMute,
    onApplyAudioMix,
    onRegisterPlayerController,
}) {
    const selectedCount = selectedEntries.length;

    return (
        <section className="app-multi-twitch__stage">
            <LiveControls
                selectedEntries={selectedEntries}
                primaryAudioEntryId={primaryAudioEntryId}
                onPrimaryAudioEntryChange={onPrimaryAudioEntryChange}
                primaryAudioVolume={primaryAudioVolume}
                onPrimaryAudioVolumeChange={onPrimaryAudioVolumeChange}
                onTogglePrimaryAudioMute={onTogglePrimaryAudioMute}
                onApplyAudioMix={onApplyAudioMix}
            />
            {selectedCount > 0 ? (
                <div
                    className={`app-multi-twitch__pov-grid ${getStageClassName(selectedCount)}`}
                >
                    {selectedEntries.slice(0, 6).map((entry) => (
                        <MultiTwitchPovTile
                            key={entry.id}
                            entry={entry}
                            onRegisterPlayerController={onRegisterPlayerController}
                        />
                    ))}
                </div>
            ) : (
                <div className="app-multi-twitch__empty-stage">
                    <p>Sélectionne jusqu'à 6 POV pour commencer.</p>
                </div>
            )}
        </section>
    );
}
