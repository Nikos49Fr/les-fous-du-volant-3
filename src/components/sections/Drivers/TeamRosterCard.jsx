import { DRIVER_PROFILE_IMAGE_BY_ID } from '../../../utils/driverPresentation';
import { getTeamPresentation } from '../../../utils/teamPresentation';

function TeamDriverRow({ driver }) {
    const profileUrl = DRIVER_PROFILE_IMAGE_BY_ID[driver.id] ?? '';

    return (
        <li className="app-drivers-card__roster-item">
            <div className="app-drivers-card__roster-driver">
                {profileUrl ? (
                    <img
                        className="app-drivers-card__roster-image"
                        src={profileUrl}
                        alt={driver.displayName}
                    />
                ) : null}
                <span className="app-drivers-card__roster-text">
                    <span className="app-drivers-card__roster-name">
                        {driver.displayName}
                    </span>
                    <span className="app-drivers-card__roster-number">
                        {driver.racingNumber}
                    </span>
                </span>
            </div>
        </li>
    );
}

export default function TeamRosterCard({ team }) {
    const teamPresentation = getTeamPresentation(team);

    return (
        <article
            className={`app-drivers-card app-drivers-card--team-${teamPresentation.colorModifier}`}
        >
            <div className="app-drivers-card__band app-drivers-card__band--top" />

            <div className="app-drivers-card__content">
                <div className="app-drivers-card__left">
                    {teamPresentation.carUrl ? (
                        <img
                            className="app-drivers-card__car"
                            src={teamPresentation.carUrl}
                            alt={`Voiture ${team.name}`}
                        />
                    ) : null}

                    <div className="app-drivers-card__team">
                        {teamPresentation.logoUrl ? (
                            <img
                                className="app-drivers-card__team-logo"
                                src={teamPresentation.logoUrl}
                                alt={team.name}
                            />
                        ) : null}
                        <h2 className="app-drivers-card__team-name">{team.name}</h2>
                    </div>
                </div>

                <div className="app-drivers-card__right">
                    <ul className="app-drivers-card__roster" aria-label={`Pilotes actifs ${team.name}`}>
                        {team.drivers.map((driver) => (
                            <TeamDriverRow key={driver.id} driver={driver} />
                        ))}
                    </ul>
                </div>
            </div>

            <div className="app-drivers-card__band app-drivers-card__band--bottom" />
        </article>
    );
}
