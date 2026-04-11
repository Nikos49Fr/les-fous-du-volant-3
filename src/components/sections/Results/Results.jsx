import './Results.scss';
import { useEffect, useState } from 'react';
import Title from '../../ui/Title/Title';
import ResultsAdminPanel from './ResultsAdminPanel';
import ResultsTabs from './tabs/ResultsTabs';
import TournamentView from './tournament/TournamentView';
import GpResultsView from './gp/GpResultsView';
import { subscribeToAuthChanges } from '../../../utils/authApi';
import { fetchResultsData } from '../../../utils/resultsApi';
import {
    getLastStartedGpRound,
    RESULTS_MAIN_TAB_GP,
    RESULTS_MAIN_TAB_TOURNAMENT,
} from '../../../utils/resultsHelpers';

const RESULTS_MAIN_TAB_ADMIN = 'admin';


function getLastGpRoundWithResults(data) {
    const scheduleLength = data?.schedule?.length ?? 0;

    for (let round = scheduleLength; round >= 1; round -= 1) {
        const roundSessions = data?.sessionsByRound?.[round];
        if (!roundSessions) continue;

        const hasEntries = Object.values(roundSessions).some(
            (session) => (session?.entries?.length ?? 0) > 0,
        );

        if (hasEntries) {
            return round;
        }
    }

    return getLastStartedGpRound();
}


export default function Results() {
    const [resultsData, setResultsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [activeTab, setActiveTab] = useState(RESULTS_MAIN_TAB_TOURNAMENT);
    const [activeGpRound, setActiveGpRound] = useState(() =>
        getLastStartedGpRound(),
    );

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            setLoadError('');

            try {
                const data = await fetchResultsData();
                if (!active) return;
                setResultsData(data);
                setActiveGpRound(getLastGpRoundWithResults(data));
            } catch (error) {
                if (!active) return;
                setLoadError(error.message ?? 'Résultats indisponibles pour le moment.');
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        load();

        const unsubscribe = subscribeToAuthChanges(() => {
            load();
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!resultsData?.schedule?.length) return;
        if (activeGpRound >= 1 && activeGpRound <= resultsData.schedule.length) return;
        setActiveGpRound(getLastGpRoundWithResults(resultsData));
    }, [activeGpRound, resultsData]);

    function handleSessionSaved(savedSession) {
        setResultsData((current) => {
            if (!current) return current;

            const nextSessionsByRound = {
                ...current.sessionsByRound,
                [savedSession.gpRound]: {
                    ...(current.sessionsByRound[savedSession.gpRound] ?? {}),
                    [savedSession.sessionType]: savedSession,
                },
            };

            return {
                ...current,
                sessionsByRound: nextSessionsByRound,
            };
        });
    }

    return (
        <section className="app-section app-results">
            <Title title="Classements et Résultats" />

            <div className="app-results__content">
                <ResultsTabs
                    activeTab={activeTab}
                    tournamentTab={RESULTS_MAIN_TAB_TOURNAMENT}
                    gpTab={RESULTS_MAIN_TAB_GP}
                    adminTab={RESULTS_MAIN_TAB_ADMIN}
                    canEdit={resultsData?.canEdit === true}
                    onTabChange={setActiveTab}
                />

                <div className="app-results__panel">
                    {isLoading ? <p>Chargement des résultats...</p> : null}
                    {!isLoading && loadError ? (
                        <p className="app-results__error">{loadError}</p>
                    ) : null}

                    {!isLoading && !loadError && resultsData ? (
                        <>
                            {activeTab === RESULTS_MAIN_TAB_TOURNAMENT ? (
                                <TournamentView
                                    drivers={resultsData.drivers}
                                    sessionsByRound={resultsData.sessionsByRound}
                                />
                            ) : activeTab === RESULTS_MAIN_TAB_ADMIN ? (
                                <ResultsAdminPanel
                                    drivers={resultsData.adminDrivers}
                                    schedule={resultsData.schedule}
                                    sessionsByRound={resultsData.sessionsByRound}
                                    onSessionSaved={handleSessionSaved}
                                    onGpDeleted={(gpRound) =>
                                        setResultsData((current) => {
                                            if (!current) return current;

                                            return {
                                                ...current,
                                                sessionsByRound: {
                                                    ...current.sessionsByRound,
                                                    [gpRound]: {},
                                                },
                                            };
                                        })
                                    }
                                />
                            ) : (
                                <GpResultsView
                                    schedule={resultsData.schedule}
                                    sessionsByRound={resultsData.sessionsByRound}
                                    drivers={resultsData.drivers}
                                    activeGpRound={activeGpRound}
                                    onSelectGpRound={setActiveGpRound}
                                />
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
