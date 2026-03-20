import ArrowLeftToBarIcon from '../../../assets/icons/arrow-left-to-bar-solid.svg?react';
import ArrowRightToBarIcon from '../../../assets/icons/arrow-right-to-bar-solid.svg?react';

export default function MultiTwitchPanelToggle({
    isExpanded,
    expandLabel,
    collapseLabel,
    onClick,
    side,
}) {
    const isLeft = side === 'left';

    return (
        <button
            className="app-multi-twitch__panel-toggle"
            type="button"
            aria-label={isExpanded ? collapseLabel : expandLabel}
            onClick={onClick}
        >
            {isExpanded ? (
                isLeft ? (
                    <ArrowLeftToBarIcon aria-hidden="true" focusable="false" />
                ) : (
                    <ArrowRightToBarIcon aria-hidden="true" focusable="false" />
                )
            ) : isLeft ? (
                <ArrowRightToBarIcon aria-hidden="true" focusable="false" />
            ) : (
                <ArrowLeftToBarIcon aria-hidden="true" focusable="false" />
            )}
        </button>
    );
}
