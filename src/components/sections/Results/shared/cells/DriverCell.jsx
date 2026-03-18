import { DRIVER_PROFILE_IMAGE_BY_ID } from '../driverProfileImages';
import { getTeamPresentation } from '../../../../../utils/teamPresentation';

export default function DriverCell({ driver, showTeamLogo = true }) {
    const teamPresentation = getTeamPresentation(driver.team);
    const driverProfileUrl = DRIVER_PROFILE_IMAGE_BY_ID[driver.id];

    return (
        <span className="app-results__entity">
            {driverProfileUrl ? (
                <span className="app-results__entity-driver-thumb">
                    <img
                        className="app-results__entity-driver-thumb-image"
                        src={driverProfileUrl}
                        alt={driver.displayName}
                    />
                </span>
            ) : null}
            {showTeamLogo && teamPresentation.logoUrl ? (
                <span
                    className={`app-results__entity-logo-pill app-results__entity-logo-pill--team-${teamPresentation.colorModifier}`}
                >
                    <img
                        className="app-results__entity-logo"
                        src={teamPresentation.logoUrl}
                        alt={driver.team.name}
                    />
                </span>
            ) : null}
            <span className="app-results__entity-text">{driver.displayName}</span>
        </span>
    );
}
