import VolumeMutedIcon from '../../../assets/icons/volume-xmark-solid-full.svg?react';
import VolumeOffIcon from '../../../assets/icons/volume-off-solid-full.svg?react';
import VolumeLowIcon from '../../../assets/icons/volume-low-solid-full.svg?react';
import VolumeMediumIcon from '../../../assets/icons/volume-solid-full.svg?react';
import VolumeHighIcon from '../../../assets/icons/volume-high-solid-full.svg?react';
import './LiveControls.scss';

function getVolumeIcon(volume) {
    if (volume <= 0) {
        return VolumeMutedIcon;
    }

    if (volume <= 5) {
        return VolumeOffIcon;
    }

    if (volume <= 30) {
        return VolumeLowIcon;
    }

    if (volume <= 70) {
        return VolumeMediumIcon;
    }

    return VolumeHighIcon;
}

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
    const VolumeIcon = getVolumeIcon(primaryAudioVolume);

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
                    <div className="app-live-controls__volume-row">
                        <button
                            className="app-live-controls__volume-toggle"
                            type="button"
                            onClick={onTogglePrimaryAudioMute}
                            disabled={!hasSelectedEntries}
                            aria-label={
                                primaryAudioVolume <= 0
                                    ? 'Retablir le son'
                                    : 'Couper le son'
                            }
                        >
                            <VolumeIcon
                                className={`app-live-controls__volume-icon${
                                    primaryAudioVolume <= 0
                                        ? ' app-live-controls__volume-icon--muted'
                                        : ''
                                }`}
                                aria-hidden="true"
                                focusable="false"
                            />
                        </button>
                        <input
                            className="app-live-controls__range"
                            type="range"
                            min="0"
                            max="100"
                            value={primaryAudioVolume}
                            style={{
                                '--app-live-controls-range-progress': `${primaryAudioVolume}%`,
                            }}
                            onChange={(event) =>
                                onPrimaryAudioVolumeChange(Number(event.target.value))
                            }
                            aria-label="Volume principal"
                            disabled={!hasSelectedEntries}
                        />
                        <span className="app-live-controls__volume-value">
                            {primaryAudioVolume}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
