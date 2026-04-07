import VolumeControl from '../VolumeControl/VolumeControl.jsx';
import './LiveControls.scss';

export default function LiveControls({
    selectedEntries,
    primaryAudioEntryId,
    onPrimaryAudioEntryChange,
    primaryAudioVolume,
    onPrimaryAudioVolumeChange,
    onTogglePrimaryAudioMute,
    onApplyAudioMix,
}) {
    const selectedCount = selectedEntries.length;
    const canChangeTwoPovLayout = selectedCount === 2;
    const hasSelectedEntries = selectedCount > 0;

    return (
        <div className="app-live-controls">
            <div className="app-live-controls__group">
                <div className="app-live-controls__actions">
                    <button
                        className="app-live-controls__button app-live-controls__button--active"
                        type="button"
                    >
                        Auto
                    </button>
                    <button
                        className="app-live-controls__button"
                        type="button"
                        disabled={!canChangeTwoPovLayout}
                    >
                        Verticale
                    </button>
                </div>
            </div>
            <div className="app-live-controls__group app-live-controls__group--audio">
                <button
                    className="app-live-controls__button"
                    type="button"
                    onClick={onApplyAudioMix}
                    disabled={!hasSelectedEntries}
                >
                    Ajuster volume
                </button>
                <select
                    className="app-live-controls__select"
                    value={hasSelectedEntries ? primaryAudioEntryId : ''}
                    onChange={(event) => onPrimaryAudioEntryChange(event.target.value)}
                    disabled={!hasSelectedEntries}
                >
                    {hasSelectedEntries
                        ? selectedEntries.map((entry) => (
                              <option key={entry.id} value={entry.id}>
                                  {entry.displayName}
                              </option>
                          ))
                        : null}
                </select>
                <div className="app-live-controls__volume-control">
                    <VolumeControl
                        value={primaryAudioVolume}
                        onChange={onPrimaryAudioVolumeChange}
                        onToggleMute={onTogglePrimaryAudioMute}
                        disabled={!hasSelectedEntries}
                        ariaLabel="Volume principal"
                    />
                </div>
            </div>
        </div>
    );
}
