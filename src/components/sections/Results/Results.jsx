import './Results.scss';
import { useEffect, useMemo, useState } from 'react';
import Title from '../../ui/Title/Title';
import ResultsTable from './ResultsTable';
import ResultsGpCarousel from './ResultsGpCarousel';
import ResultsAdminPanel, { ResultsAdminTabTrigger } from './ResultsAdminPanel';
import ChevronDownIcon from '../../../assets/icons/chevron-down-solid-full.svg?react';
import ChevronUpIcon from '../../../assets/icons/chevron-up-solid-full.svg?react';
import MinusIcon from '../../../assets/icons/minus-solid-full.svg?react';
import StopwatchIcon from '../../../assets/icons/stopwatch-solid-full.svg?react';
import { subscribeToAuthChanges } from '../../../utils/authApi';
import { fetchResultsData } from '../../../utils/resultsApi';
import { getTeamPresentation } from '../../../utils/teamPresentation';
import {
    buildGpSessionRows,
    buildTournamentDriverStandings,
    buildTournamentTeamStandings,
    getGridDelta,
    getLastStartedGpRound,
    RESULTS_MAIN_TAB_GP,
    RESULTS_MAIN_TAB_TOURNAMENT,
} from '../../../utils/resultsHelpers';

const RESULTS_MAIN_TAB_ADMIN = 'admin';
const DRIVER_PROFILE_IMAGES = import.meta.glob(
    '../../../assets/images/profils/*.webp',
    {
        eager: true,
        import: 'default',
    },
);
const DRIVER_PROFILE_IMAGE_BY_ID = Object.fromEntries(
    Object.entries(DRIVER_PROFILE_IMAGES).map(([path, url]) => [
        path.split('/').pop().replace('.webp', ''),
        url,
    ]),
);

const DRIVER_STANDINGS_COLUMNS = [
    { key: 'position', label: 'POS.', width: 'clamp(2.1rem, 4vw, 4.5rem)' },
    { key: 'number', label: 'NO.', width: 'clamp(2.1rem, 4vw, 4.5rem)' },
    {
        key: 'driver',
        label: 'Driver',
        width: 'clamp(10.5rem, 23vw, 16rem)',
        className: 'app-results-table__cell--align-left',
    },
    {
        key: 'team',
        label: 'Écurie',
        width: 'clamp(8rem, 16vw, 11rem)',
        mobileWidth: '2.5rem',
        className:
            'app-results-table__cell--align-left app-results-table__cell--team-logo-only-mobile',
    },
    { key: 'points', label: 'PTS.', width: 'clamp(2.4rem, 4.5vw, 5rem)' },
];

const TEAM_STANDINGS_COLUMNS = [
    { key: 'position', label: 'POS.', width: 'clamp(2.1rem, 4vw, 4.5rem)' },
    {
        key: 'team',
        label: 'Écurie',
        width: 'clamp(9rem, 19vw, 12rem)',
        className: 'app-results-table__cell--align-left',
    },
    { key: 'points', label: 'PTS.', width: 'clamp(2.4rem, 4.5vw, 5rem)' },
];

const GP_RESULTS_COLUMNS = [
    { key: 'position', label: 'POS.', width: 'clamp(2.2rem, 4.2vw, 5.25rem)' },
    { key: 'grid', label: 'GRILLE', width: 'clamp(3.8rem, 7vw, 6.5rem)' },
    { key: 'number', label: 'NO.', width: 'clamp(2.1rem, 4vw, 4.5rem)' },
    { key: 'driver', label: 'DRIVER', width: 'clamp(10rem, 22vw, 13rem)' },
    { key: 'team', label: 'TEAM', width: 'clamp(8rem, 15vw, 10rem)' },
    { key: 'points', label: 'PTS.', width: 'clamp(2.4rem, 4.5vw, 5rem)' },
];

function DriverCell({ driver, showTeamLogo = true }) {
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

function TeamCell({ team }) {
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

function GridCell({ qualifyingEntry, resultEntry }) {
    if (qualifyingEntry?.position != null) {
        if (resultEntry?.position != null) {
            const delta = getGridDelta(resultEntry.position, qualifyingEntry.position);
            const DeltaIcon =
                delta.direction === 'up'
                    ? ChevronUpIcon
                    : delta.direction === 'down'
                      ? ChevronDownIcon
                      : MinusIcon;

            return (
                <span className={`app-results__grid app-results__grid--${delta.direction}`}>
                    <span>{qualifyingEntry.position}</span>
                    <DeltaIcon aria-hidden="true" focusable="false" />
                </span>
            );
        }

        return <span className="app-results__grid">{qualifyingEntry.position}</span>;
    }

    if (qualifyingEntry?.status) {
        return <span className="app-results__status-pill">{qualifyingEntry.status}</span>;
    }

    return <span className="app-results__muted">—</span>;
}

function FastestLapTag() {
    return (
        <span className="app-results__fastest-lap-tag">
            <StopwatchIcon aria-hidden="true" focusable="false" />
            <span>Meilleur tour</span>
        </span>
    );
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
                setActiveGpRound((current) =>
                    current >= 1 && current <= data.schedule.length
                        ? current
                        : getLastStartedGpRound(),
                );
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
        setActiveGpRound(getLastStartedGpRound());
    }, [activeGpRound, resultsData]);

    const driverStandingsRows = useMemo(() => {
        if (!resultsData) return [];

        return buildTournamentDriverStandings(
            resultsData.drivers,
            resultsData.sessionsByRound,
        ).map((row) => ({
            id: row.driver.id,
            teamModifier: getTeamPresentation(row.driver.team).colorModifier,
            cells: {
                position: row.position,
                number: row.driver.racingNumber,
                driver: <DriverCell driver={row.driver} showTeamLogo={false} />,
                team: <TeamCell team={row.driver.team} />,
                points: row.points,
            },
        }));
    }, [resultsData]);

    const teamStandingsRows = useMemo(() => {
        if (!resultsData) return [];

        return buildTournamentTeamStandings(
            resultsData.drivers,
            resultsData.sessionsByRound,
        ).map((row) => ({
            id: row.team.id,
            teamModifier: getTeamPresentation(row.team).colorModifier,
            cells: {
                position: row.position,
                team: <TeamCell team={row.team} />,
                points: row.points,
            },
        }));
    }, [resultsData]);

    const activeGp = resultsData?.schedule?.find((gp) => gp.id === activeGpRound) ?? null;
    const activeRoundSessions = resultsData?.sessionsByRound?.[activeGpRound] ?? {};

    const sprintRows = useMemo(() => {
        if (!resultsData) return [];

        return buildGpSessionRows(
            resultsData.drivers,
            activeRoundSessions.sprint,
            activeRoundSessions.sprint_qualifying,
            'sprint',
        ).map((row) => ({
            id: `sprint-${row.driver.id}`,
            teamModifier: getTeamPresentation(row.driver.team).colorModifier,
            cells: {
                position: row.entry.position ?? row.entry.status,
                grid: (
                    <GridCell
                        qualifyingEntry={row.qualifyingEntry}
                        resultEntry={row.entry}
                    />
                ),
                number: row.driver.racingNumber,
                driver: <DriverCell driver={row.driver} />,
                team: <TeamCell team={row.driver.team} />,
                points: row.points,
            },
            tag: row.entry.hasFastestLap ? <FastestLapTag /> : null,
        }));
    }, [activeRoundSessions, resultsData]);

    const raceRows = useMemo(() => {
        if (!resultsData) return [];

        return buildGpSessionRows(
            resultsData.drivers,
            activeRoundSessions.race,
            activeRoundSessions.race_qualifying,
            'race',
        ).map((row) => ({
            id: `race-${row.driver.id}`,
            teamModifier: getTeamPresentation(row.driver.team).colorModifier,
            cells: {
                position: row.entry.position ?? row.entry.status,
                grid: (
                    <GridCell
                        qualifyingEntry={row.qualifyingEntry}
                        resultEntry={row.entry}
                    />
                ),
                number: row.driver.racingNumber,
                driver: <DriverCell driver={row.driver} />,
                team: <TeamCell team={row.driver.team} />,
                points: row.points,
            },
            tag: row.entry.hasFastestLap ? <FastestLapTag /> : null,
        }));
    }, [activeRoundSessions, resultsData]);

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
                <div className="app-results__tabs">
                    <div className="app-results__tabs-main">
                        <button
                            className={`app-results__tab${
                                activeTab === RESULTS_MAIN_TAB_TOURNAMENT
                                    ? ' app-results__tab--active'
                                    : ''
                            }`}
                            type="button"
                            onClick={() => setActiveTab(RESULTS_MAIN_TAB_TOURNAMENT)}
                        >
                            Tournoi
                        </button>
                        <button
                            className={`app-results__tab${
                                activeTab === RESULTS_MAIN_TAB_GP
                                    ? ' app-results__tab--active'
                                    : ''
                            }`}
                            type="button"
                            onClick={() => setActiveTab(RESULTS_MAIN_TAB_GP)}
                        >
                            Par course
                        </button>
                    </div>
                    {resultsData?.canEdit ? (
                        <ResultsAdminTabTrigger
                            isActive={activeTab === RESULTS_MAIN_TAB_ADMIN}
                            onClick={() => setActiveTab(RESULTS_MAIN_TAB_ADMIN)}
                        />
                    ) : null}
                </div>

                <div className="app-results__panel">
                    {isLoading ? <p>Chargement des résultats...</p> : null}
                    {!isLoading && loadError ? (
                        <p className="app-results__error">{loadError}</p>
                    ) : null}

                    {!isLoading && !loadError && resultsData ? (
                        <>
                            {activeTab === RESULTS_MAIN_TAB_TOURNAMENT ? (
                                <div className="app-results__tables-grid">
                                    <ResultsTable
                                        className="app-results-table--drivers"
                                        columns={DRIVER_STANDINGS_COLUMNS}
                                        rows={driverStandingsRows}
                                    />
                                    <ResultsTable
                                        columns={TEAM_STANDINGS_COLUMNS}
                                        rows={teamStandingsRows}
                                    />
                                </div>
                            ) : activeTab === RESULTS_MAIN_TAB_ADMIN ? (
                                <ResultsAdminPanel
                                    drivers={resultsData.drivers}
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
                                <div className="app-results__stack">
                                    <ResultsGpCarousel
                                        schedule={resultsData.schedule}
                                        activeGpRound={activeGpRound}
                                        onSelect={setActiveGpRound}
                                    />

                                    <div className="app-results__gp-header">
                                        <h3 className="app-results__gp-title">
                                            {activeGp?.flag ? (
                                                <span
                                                    className={`app-results__gp-flag fi fi-${activeGp.flag}`}
                                                />
                                            ) : null}
                                            <span>{activeGp?.country || `GP ${activeGpRound}`}</span>
                                        </h3>
                                    </div>

                                    <ResultsTable
                                        title="Sprint"
                                        columns={GP_RESULTS_COLUMNS}
                                        rows={sprintRows}
                                        emptyLabel="Aucun résultat sprint saisi pour le moment."
                                    />
                                    <ResultsTable
                                        title="Course"
                                        columns={GP_RESULTS_COLUMNS}
                                        rows={raceRows}
                                        emptyLabel="Aucun résultat course saisi pour le moment."
                                    />
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </section>
    );
}
