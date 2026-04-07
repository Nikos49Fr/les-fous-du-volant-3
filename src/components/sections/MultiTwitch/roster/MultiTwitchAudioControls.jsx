import './MultiTwitchAudioControls.scss';
import MultiTwitchAudioInfoTooltip from './MultiTwitchAudioInfoTooltip.jsx';
import MultiTwitchAudioMaster from './MultiTwitchAudioMaster.jsx';
import MultiTwitchAudioEntryList from './MultiTwitchAudioEntryList.jsx';

export default function MultiTwitchAudioControls({
    selectedEntries,
    primaryAudioEntryId,
    onPrimaryAudioEntryChange,
    primaryAudioVolume,
    onPrimaryAudioVolumeChange,
    onTogglePrimaryAudioMute,
    onToggleMuteAll,
    areAllSelectedEntriesMuted,
}) {
    const hasSelectedEntries = selectedEntries.length > 0;

    return (
        <section className="app-multi-twitch__audio-controls">
            <div className="app-multi-twitch__audio-controls-header">
                <h4 className="app-multi-twitch__audio-controls-title">
                    Audio contrôles
                </h4>
                <MultiTwitchAudioInfoTooltip />
            </div>
            <MultiTwitchAudioMaster
                volume={primaryAudioVolume}
                onVolumeChange={onPrimaryAudioVolumeChange}
                onToggleMute={onTogglePrimaryAudioMute}
                onToggleMuteAll={onToggleMuteAll}
                isAllMuted={areAllSelectedEntriesMuted}
                disabled={!hasSelectedEntries}
            />
            <MultiTwitchAudioEntryList
                entries={selectedEntries}
                selectedEntryId={hasSelectedEntries ? primaryAudioEntryId : ''}
                onSelectEntry={onPrimaryAudioEntryChange}
                disabled={!hasSelectedEntries}
            />
        </section>
    );
}
