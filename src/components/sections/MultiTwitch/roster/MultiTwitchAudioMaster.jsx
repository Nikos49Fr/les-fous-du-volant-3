import VolumeMutedIcon from '../../../../assets/icons/volume-xmark-solid-full.svg?react';
import VolumeMediumIcon from '../../../../assets/icons/volume-solid-full.svg?react';
import VolumeControl from '../../../ui/VolumeControl/VolumeControl.jsx';
import './MultiTwitchAudioMaster.scss';

export default function MultiTwitchAudioMaster({
    volume,
    onVolumeChange,
    onToggleMute,
    onToggleMuteAll,
    isAllMuted,
    disabled,
}) {
    const ActionIcon = isAllMuted ? VolumeMediumIcon : VolumeMutedIcon;

    return (
        <div className="app-multi-twitch__audio-master">
            <p className="app-multi-twitch__audio-subtitle">Master volume</p>
            <VolumeControl
                value={volume}
                onChange={onVolumeChange}
                onToggleMute={onToggleMute}
                disabled={disabled}
                ariaLabel="Master volume"
                className="app-multi-twitch__audio-master-volume"
            />
            <button
                className={`app-multi-twitch__audio-mute-all${
                    isAllMuted
                        ? ' app-multi-twitch__audio-mute-all--restore'
                        : ' app-multi-twitch__audio-mute-all--mute'
                }`}
                type="button"
                onClick={onToggleMuteAll}
                disabled={disabled}
            >
                <ActionIcon aria-hidden="true" focusable="false" />
                <span>{isAllMuted ? 'Restore all' : 'Mute all'}</span>
            </button>
        </div>
    );
}
