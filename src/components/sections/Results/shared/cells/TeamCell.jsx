import { getTeamPresentation } from '../../../../../utils/teamPresentation';

export default function TeamCell({ team }) {
    const teamPresentation = getTeamPresentation(team);

    return (
        <span className="app-results__entity">
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
