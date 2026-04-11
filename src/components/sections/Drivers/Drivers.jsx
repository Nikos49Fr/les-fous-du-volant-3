import './Drivers.scss';
import './DriversCasters.scss';
import { useEffect, useState } from 'react';
import Title from '../../ui/Title/Title';
import TeamRosterCard from './TeamRosterCard';
import DriversPilotsPanel from './DriversPilotsPanel';
import TwitchIcon from '../../../assets/icons/twitch-brands-solid-full.svg?react';
import ArrowUpRightFromSquareIcon from '../../../assets/icons/arrow-up-right-from-square-solid-full.svg?react';
import {
    fetchDriversData,
    fetchDriversOverviewData,
} from '../../../utils/driversApi';
import castersImage from '../../../assets/images/profils/guyguy_et_ardan.webp';
import staffRandyImage from '../../../assets/images/profils/staff_randy.webp';
import staffLordImage from '../../../assets/images/profils/staff _lord.webp';

const DRIVERS_TAB_PILOTS = 'pilots';
const DRIVERS_TAB_TEAMS = 'teams';
const DRIVERS_TAB_CASTERS = 'casters';
const DRIVERS_TAB_STAFF = 'staff';

function TwitchLink({ login }) {
    return (
        <a
            className="app-drivers__twitch-link"
            href={`https://www.twitch.tv/${login}`}
            target="_blank"
            rel="noreferrer"
        >
            <TwitchIcon
                className="app-drivers__twitch-link-icon app-drivers__twitch-link-icon--brand"
                aria-hidden="true"
            />
            <span>{login}</span>
            <ArrowUpRightFromSquareIcon
                className="app-drivers__twitch-link-icon"
                aria-hidden="true"
            />
        </a>
    );
}

export default function Drivers() {
    const [teams, setTeams] = useState([]);
    const [activeDrivers, setActiveDrivers] = useState([]);
    const [inactiveDrivers, setInactiveDrivers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [activeTab, setActiveTab] = useState(DRIVERS_TAB_PILOTS);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            setLoadError('');

            try {
                const [teamsData, driversData] = await Promise.all([
                    fetchDriversData(),
                    fetchDriversOverviewData(),
                ]);

                if (active) {
                    setTeams(teamsData);
                    setActiveDrivers(driversData.activeDrivers);
                    setInactiveDrivers(driversData.inactiveDrivers);
                }
            } catch (error) {
                if (active) {
                    setLoadError(
                        error.message ?? 'Pilotes indisponibles pour le moment.',
                    );
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        load();
        return () => {
            active = false;
        };
    }, []);

    return (
        <section className="app-section app-drivers">
            <Title title="Toute l'équipe de cette saison" />
            <div
                className="app-drivers__tabs"
                role="tablist"
                aria-label="Navigation participants"
            >
                <button
                    className={`app-drivers__tab${
                        activeTab === DRIVERS_TAB_PILOTS
                            ? ' app-drivers__tab--active'
                            : ''
                    }`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === DRIVERS_TAB_PILOTS}
                    onClick={() => setActiveTab(DRIVERS_TAB_PILOTS)}
                >
                    Pilotes
                </button>
                <button
                    className={`app-drivers__tab${
                        activeTab === DRIVERS_TAB_TEAMS
                            ? ' app-drivers__tab--active'
                            : ''
                    }`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === DRIVERS_TAB_TEAMS}
                    onClick={() => setActiveTab(DRIVERS_TAB_TEAMS)}
                >
                    Écuries
                </button>
                <button
                    className={`app-drivers__tab${
                        activeTab === DRIVERS_TAB_CASTERS
                            ? ' app-drivers__tab--active'
                            : ''
                    }`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === DRIVERS_TAB_CASTERS}
                    onClick={() => setActiveTab(DRIVERS_TAB_CASTERS)}
                >
                    Casteurs
                </button>
                <button
                    className={`app-drivers__tab${
                        activeTab === DRIVERS_TAB_STAFF
                            ? ' app-drivers__tab--active'
                            : ''
                    }`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === DRIVERS_TAB_STAFF}
                    onClick={() => setActiveTab(DRIVERS_TAB_STAFF)}
                >
                    Staff
                </button>
            </div>

            <div className="app-drivers-content">
                {activeTab === DRIVERS_TAB_PILOTS ? (
                    <DriversPilotsPanel
                        activeDrivers={activeDrivers}
                        inactiveDrivers={inactiveDrivers}
                        isLoading={isLoading}
                        loadError={loadError}
                    />
                ) : null}

                {activeTab === DRIVERS_TAB_TEAMS ? (
                    <>
                        {isLoading ? <p>Chargement des pilotes...</p> : null}
                        {loadError ? <p>{loadError}</p> : null}

                        {!isLoading && !loadError ? (
                            <div className="app-drivers__list">
                                {teams.map((team) => (
                                    <TeamRosterCard key={team.id} team={team} />
                                ))}
                            </div>
                        ) : null}
                    </>
                ) : null}

                {activeTab === DRIVERS_TAB_CASTERS ? (
                    <div className="app-drivers__casters">
                        <article className="app-drivers-showcase-card app-drivers-showcase-card--casters">
                            <div className="app-drivers-showcase-card__band app-drivers-showcase-card__band--top" />
                            <div className="app-drivers-showcase-card__inner">
                                <p className="app-drivers-showcase-card__eyebrow">
                                    Commentaire officiel
                                </p>
                                <div className="app-drivers-showcase-card__frame">
                                    <img
                                        className="app-drivers__casters-image"
                                        src={castersImage}
                                        alt="ArdanFox et Guygui_OnLive, casteurs de l'événement"
                                    />
                                </div>
                                <div
                                    className="app-drivers__casters-links"
                                    aria-label="Chaînes Twitch des casteurs"
                                >
                                    <TwitchLink login="ArdanFox" />
                                    <TwitchLink login="Guygui_OnLive" />
                                </div>
                            </div>
                            <div className="app-drivers-showcase-card__band app-drivers-showcase-card__band--bottom" />
                        </article>
                    </div>
                ) : null}

                {activeTab === DRIVERS_TAB_STAFF ? (
                    <div className="app-drivers__casters">
                        <article className="app-drivers-showcase-card app-drivers-showcase-card--staff">
                            <div className="app-drivers-showcase-card__band app-drivers-showcase-card__band--top" />
                            <div className="app-drivers-showcase-card__inner">
                                <p className="app-drivers-showcase-card__eyebrow">
                                    Organisateurs
                                </p>
                                <div className="app-drivers-showcase-card__frame app-drivers-showcase-card__frame--staff">
                                    <img
                                        className="app-drivers__casters-image app-drivers__casters-image--staff"
                                        src={staffRandyImage}
                                        alt="RandyComicsFr"
                                    />
                                    <img
                                        className="app-drivers__casters-image app-drivers__casters-image--staff"
                                        src={staffLordImage}
                                        alt="Lord_viserion"
                                    />
                                </div>
                                <div
                                    className="app-drivers__casters-links"
                                    aria-label="Chaînes Twitch du staff"
                                >
                                    <TwitchLink login="RandyComicsFr" />
                                    <TwitchLink login="Lord_viserion" />
                                </div>
                            </div>
                            <div className="app-drivers-showcase-card__band app-drivers-showcase-card__band--bottom" />
                        </article>
                    </div>
                ) : null}
            </div>
        </section>
    );
}
