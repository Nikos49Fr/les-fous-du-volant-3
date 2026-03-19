import './Drivers.scss';
import './DriversCasters.scss';
import { useEffect, useState } from 'react';
import Title from '../../ui/Title/Title';
import TeamRosterCard from './TeamRosterCard';
import { fetchDriversData } from '../../../utils/driversApi';
import castersImage from '../../../assets/images/profils/guyguy_et_ardan.webp';
import staffRandyImage from '../../../assets/images/profils/staff_randy.webp';
import staffLordImage from '../../../assets/images/profils/staff _lord.webp';

const DRIVERS_TAB_DRIVERS = 'drivers';
const DRIVERS_TAB_CASTERS = 'casters';
const DRIVERS_TAB_STAFF = 'staff';

export default function Drivers() {
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [activeTab, setActiveTab] = useState(DRIVERS_TAB_DRIVERS);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            setLoadError('');

            try {
                const data = await fetchDriversData();
                if (active) {
                    setTeams(data);
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
            <div className="app-drivers__tabs" role="tablist" aria-label="Navigation participants">
                <button
                    className={`app-drivers__tab${
                        activeTab === DRIVERS_TAB_DRIVERS
                            ? ' app-drivers__tab--active'
                            : ''
                    }`}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === DRIVERS_TAB_DRIVERS}
                    onClick={() => setActiveTab(DRIVERS_TAB_DRIVERS)}
                >
                    Pilotes & Écuries
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
                {activeTab === DRIVERS_TAB_DRIVERS ? (
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
                                <h2 className="app-drivers__casters-title">
                                    ArdanFox & Guygui_OnLive
                                </h2>
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
                                <h2 className="app-drivers__casters-title">
                                    RandyComicsFr & Lord_viserion
                                </h2>
                            </div>
                            <div className="app-drivers-showcase-card__band app-drivers-showcase-card__band--bottom" />
                        </article>
                    </div>
                ) : null}
            </div>
        </section>
    );
}




