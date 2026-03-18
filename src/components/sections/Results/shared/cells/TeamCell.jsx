import StopwatchIcon from '../../../../../assets/icons/stopwatch-solid-full.svg?react';
import { getTeamPresentation } from '../../../../../utils/teamPresentation';

export default function TeamCell({ team, showFastestLap = false }) {
    const teamPresentation = getTeamPresentation(team);

    return (
        <span className="app-results__entity app-results__entity--team">
            {showFastestLap ? (
                <span
                    className="app-results__fastest-lap-pin"
                    title="Meilleur tour +1 pt"
                    aria-label="Meilleur tour +1 pt"
                >
                    <StopwatchIcon aria-hidden="true" focusable="false" />
                </span>
            ) : null}
            {teamPresentation.logoUrl ? (
                <span
                    className={`app-results__entity-logo-pill app-results__entity-logo-pill--team-${teamPresentation.colorModifier}`}
                >
                    <img
                        className="app-results__entity-logo"
                        src={teamPresentation.logoUrl}
                        alt={team.name}
                    />
                </span>
            ) : null}
            <span className="app-results__entity-text">{team.name}</span>
        </span>
    );
}
