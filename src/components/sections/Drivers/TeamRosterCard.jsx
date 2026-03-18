import { DRIVER_PROFILE_IMAGE_BY_ID } from '../../../utils/driverPresentation';
import { getTeamPresentation } from '../../../utils/teamPresentation';

function DriverSpot({ driver, align = 'left' }) {
    if (!driver) {
        return <div className={`app-drivers-card__driver app-drivers-card__driver--${align}`} />;
    }

    const profileUrl = DRIVER_PROFILE_IMAGE_BY_ID[driver.id];

    return (
        <div className={`app-drivers-card__driver app-drivers-card__driver--${align}`}>
            {profileUrl ? (
                <img
                    className="app-drivers-card__driver-image"
                    src={profileUrl}
                    alt={driver.displayName}
                />
            ) : null}
            <div className="app-drivers-card__driver-meta">
                <span className="app-drivers-card__driver-name">
                    {driver.displayName}
                </span>
                <span className="app-drivers-card__driver-number">
                    {driver.racingNumber}
                </span>
            </div>
        </div>
    );
}

export default function TeamRosterCard({ team }) {
    const teamPresentation = getTeamPresentation(team);
    const [leftDriver, rightDriver] = team.drivers;

    return (
        <article
            className={`app-drivers-card app-drivers-card--team-${teamPresentation.colorModifier}`}
        >
            <DriverSpot driver={leftDriver} align="left" />

            <div className="app-drivers-card__center">
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

                {teamPresentation.carUrl ? (
                    <img
                        className="app-drivers-card__car"
                        src={teamPresentation.carUrl}
                        alt={`Voiture ${team.name}`}
                    />
                ) : null}
            </div>

            <DriverSpot driver={rightDriver} align="right" />
        </article>
    );
}
