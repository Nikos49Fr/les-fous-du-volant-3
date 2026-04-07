import VolumeMutedIcon from '../../../assets/icons/volume-xmark-solid-full.svg?react';
import VolumeOffIcon from '../../../assets/icons/volume-off-solid-full.svg?react';
import VolumeLowIcon from '../../../assets/icons/volume-low-solid-full.svg?react';
import VolumeMediumIcon from '../../../assets/icons/volume-solid-full.svg?react';
import VolumeHighIcon from '../../../assets/icons/volume-high-solid-full.svg?react';
import './VolumeControl.scss';

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

export default function VolumeControl({
    value,
    onChange,
    onToggleMute,
    disabled = false,
    ariaLabel = 'Volume',
    className = '',
}) {
    const normalizedValue = Math.min(100, Math.max(0, Number(value) || 0));
    const VolumeIcon = getVolumeIcon(normalizedValue);

    return (
        <div className={`app-volume-control ${className}`.trim()}>
            <button
                className="app-volume-control__toggle"
                type="button"
                onClick={onToggleMute}
                disabled={disabled}
                aria-label={normalizedValue <= 0 ? 'Rétablir le son' : 'Couper le son'}
            >
                <VolumeIcon
                    className={`app-volume-control__icon${
                        normalizedValue <= 0 ? ' app-volume-control__icon--muted' : ''
                    }`}
                    aria-hidden="true"
                    focusable="false"
                />
            </button>
            <input
                className="app-volume-control__range"
                type="range"
                min="0"
                max="100"
                value={normalizedValue}
                style={{
                    '--app-volume-control-range-progress': `${normalizedValue}%`,
                }}
                onChange={(event) => onChange(Number(event.target.value))}
                aria-label={ariaLabel}
                disabled={disabled}
            />
            <span className="app-volume-control__value">{normalizedValue}</span>
        </div>
    );
}
