import './Drivers.scss';
import { useEffect, useState } from 'react';
import Title from '../../ui/Title/Title';
import TeamRosterCard from './TeamRosterCard';
import { fetchDriversData } from '../../../utils/driversApi';
import castersImage from '../../../assets/images/profils/guyguy_et_ardan.webp';

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
            <Title title="Pilotes & Écuries" />
            <div className="app-drivers__tabs" role="tablist" aria-label="Navigation pilotes">
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
                        <h2 className="app-drivers__casters-title">
                            ArdanFox & Guygui_OnLive
                        </h2>
                        <img
                            className="app-drivers__casters-image"
                            src={castersImage}
                            alt="ArdanFox et Guygui_OnLive"
                        />
                    </div>
                ) : null}

                {activeTab === DRIVERS_TAB_STAFF ? (
                    <div className="app-drivers__empty-panel" />
                ) : null}
            </div>
        </section>
    );
}
