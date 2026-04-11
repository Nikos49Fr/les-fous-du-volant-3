import './DriverProfileCard.scss';
import ArrowUpRightFromSquareIcon from '../../../assets/icons/arrow-up-right-from-square-solid-full.svg?react';
import TwitchIcon from '../../../assets/icons/twitch-brands-solid-full.svg?react';
import { DRIVER_PROFILE_IMAGE_BY_ID } from '../../../utils/driverPresentation';
import { getTeamPresentation } from '../../../utils/teamPresentation';

export default function DriverProfileCard({ driver, retired = false }) {
    const teamPresentation = getTeamPresentation(driver.team);
    const profileUrl = DRIVER_PROFILE_IMAGE_BY_ID[driver.id] ?? '';
    const twitchUrl = driver.twitchLogin
        ? `https://www.twitch.tv/${driver.twitchLogin}`
        : '';

    return (
        <article
            className={`app-driver-profile-card app-driver-profile-card--team-${teamPresentation.colorModifier}${
                retired ? ' app-driver-profile-card--retired' : ''
            }`}
        >
            <div className="app-driver-profile-card__band app-driver-profile-card__band--top" />

            {retired ? (
                <span className="app-driver-profile-card__retired-badge">
                    Retired
                </span>
            ) : null}

            <h2 className="app-driver-profile-card__name">
                {driver.displayName}
            </h2>
            <span className="app-driver-profile-card__number">
                {driver.racingNumber}
            </span>

            <div className="app-driver-profile-card__content">
                <div className="app-driver-profile-card__media">
                    {profileUrl ? (
                        <img
                            className="app-driver-profile-card__image"
                            src={profileUrl}
                            alt={driver.displayName}
                        />
                    ) : (
                        <div className="app-driver-profile-card__image-placeholder" />
                    )}
                </div>

                <div className="app-driver-profile-card__body">
                    <header className="app-driver-profile-card__header">
                        <div className="app-driver-profile-card__team">
                            {teamPresentation.carUrl ? (
                                <img
                                    className="app-driver-profile-card__team-car"
                                    src={teamPresentation.carUrl}
                                    alt=""
                                />
                            ) : null}
                            <div className="app-driver-profile-card__team-brand">
                                {teamPresentation.logoUrl ? (
                                    <img
                                        className="app-driver-profile-card__team-logo"
                                        src={teamPresentation.logoUrl}
                                        alt={driver.team?.name ?? ''}
                                    />
                                ) : null}
                                <span className="app-driver-profile-card__team-name">
                                    {driver.team?.name ?? 'Écurie inconnue'}
                                </span>
                            </div>
                        </div>
                    </header>

                    <div className="app-driver-profile-card__meta">
                        <section className="app-driver-profile-card__slot app-driver-profile-card__slot--bio">
                            <p
                                className={`app-driver-profile-card__slot-value app-driver-profile-card__slot-value--bio${
                                    driver.bio
                                        ? ''
                                        : ' app-driver-profile-card__slot-value--muted'
                                }`}
                                title={driver.bio || undefined}
                            >
                                {driver.bio || 'À venir'}
                            </p>
                        </section>

                        <section className="app-driver-profile-card__slot app-driver-profile-card__slot--twitch">
                            {twitchUrl ? (
                                <a
                                    className="app-driver-profile-card__twitch-link"
                                    href={twitchUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <TwitchIcon
                                        className="app-driver-profile-card__twitch-icon"
                                        aria-hidden="true"
                                        focusable="false"
                                    />
                                    <span>{driver.twitchLogin}</span>
                                    <ArrowUpRightFromSquareIcon
                                        className="app-driver-profile-card__external-icon"
                                        aria-hidden="true"
                                        focusable="false"
                                    />
                                </a>
                            ) : (
                                <p className="app-driver-profile-card__slot-value app-driver-profile-card__slot-value--muted">
                                    À venir
                                </p>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            <div className="app-driver-profile-card__band app-driver-profile-card__band--bottom" />
        </article>
    );
}
