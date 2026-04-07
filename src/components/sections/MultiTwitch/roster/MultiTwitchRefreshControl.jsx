import ArrowRotateRightIcon from '../../../../assets/icons/arrow-rotate-right-solid-full.svg?react';
import './MultiTwitchRefreshControl.scss';

export default function MultiTwitchRefreshControl({
    label,
    state,
    disabled,
    onManualRefresh,
}) {
    return (
        <div className="app-multi-twitch__refresh-row">
            <span className="app-multi-twitch__refresh-label">{label}</span>
            <button
                className={`app-multi-twitch__refresh-button app-multi-twitch__refresh-button--${state}`}
                type="button"
                aria-label="Forcer l'actualisation des lives"
                onClick={onManualRefresh}
                disabled={disabled}
            >
                <ArrowRotateRightIcon aria-hidden="true" focusable="false" />
            </button>
        </div>
    );
}

