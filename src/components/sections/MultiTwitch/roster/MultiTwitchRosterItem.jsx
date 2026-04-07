import EyeIcon from '../../../../assets/icons/eye-solid-full.svg?react';
import EyeSlashIcon from '../../../../assets/icons/eye-slash-solid-full.svg?react';
import { getTeamPresentation } from '../../../../utils/teamPresentation';
import './MultiTwitchRosterItem.scss';

const CASTER_ID = 'guygui_onlive';

export default function MultiTwitchRosterItem({
    item,
    isSelected,
    isDisabled,
    onToggle,
}) {
    const teamPresentation = item.team ? getTeamPresentation(item.team) : null;
    const VisibilityIcon = isSelected ? EyeIcon : EyeSlashIcon;

    return (
        <label
            className={`app-multi-twitch__roster-item${
                isSelected ? ' app-multi-twitch__roster-item--selected' : ''
            }${
                isDisabled ? ' app-multi-twitch__roster-item--disabled' : ''
            }${
                item.id === CASTER_ID
                    ? ' app-multi-twitch__roster-item--caster'
                    : teamPresentation
                      ? ` app-multi-twitch__roster-item--${teamPresentation.colorModifier}`
                      : ''
            }`}
        >
            <input
                className="app-multi-twitch__checkbox"
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => onToggle(item.id)}
            />
            <span className="app-multi-twitch__checkbox-mark" aria-hidden="true">
                <VisibilityIcon />
            </span>
            <span className="app-multi-twitch__roster-name">{item.displayName}</span>
        </label>
    );
}
