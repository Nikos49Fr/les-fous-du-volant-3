import { useMemo } from 'react';
import ResultsGpCarousel from '../ResultsGpCarousel';
import ResultsTable from '../shared/table/ResultsTable';
import DriverCell from '../shared/cells/DriverCell';
import TeamCell from '../shared/cells/TeamCell';
import GpGridDeltaCell from '../shared/cells/GpGridDeltaCell';
import { buildGpSessionRows } from '../../../../utils/resultsHelpers';
import { getTeamPresentation } from '../../../../utils/teamPresentation';
import { GP_RESULTS_COLUMNS } from '../config/tableColumns';

function buildGpDisplayRows(drivers, session, qualifyingSession, sessionType) {
    return buildGpSessionRows(drivers, session, qualifyingSession, sessionType).map((row) => ({
        id: `${sessionType}-${row.driver.id}`,
        teamModifier: getTeamPresentation(row.driver.team).colorModifier,
        rowClassName: row.entry.status != null ? 'app-results-table__row--dimmed' : '',
        cellClassNames:
            row.entry.status != null
                ? {
                      position: 'app-results-table__cell--dimmed',
                      grid: 'app-results-table__cell--dimmed',
                      number: 'app-results-table__cell--dimmed',
                      driver: 'app-results-table__cell--dimmed',
                      team: 'app-results-table__cell--dimmed',
                      points: 'app-results-table__cell--dimmed',
                  }
                : undefined,
        cells: {
            position: row.entry.position ?? row.entry.status,
            grid: (
                <GpGridDeltaCell
                    qualifyingEntry={row.qualifyingEntry}
                    resultEntry={row.entry}
                />
            ),
            number: row.driver.racingNumber,
            driver: <DriverCell driver={row.driver} showTeamLogo={false} />,
            team: (
                <TeamCell
                    team={row.driver.team}
                    showFastestLap={row.entry.hasFastestLap === true}
                />
            ),
            points: row.points,
        },
    }));
}

export default function GpResultsView({
    schedule,
    sessionsByRound,
    drivers,
    activeGpRound,
    onSelectGpRound,
}) {
    const activeRoundSessions = sessionsByRound?.[activeGpRound] ?? {};

    const sprintRows = useMemo(
        () =>
            buildGpDisplayRows(
                drivers,
                activeRoundSessions.sprint,
                activeRoundSessions.sprint_qualifying,
                'sprint',
            ),
        [activeRoundSessions.sprint, activeRoundSessions.sprint_qualifying, drivers],
    );

    const raceRows = useMemo(
        () =>
            buildGpDisplayRows(
                drivers,
                activeRoundSessions.race,
                activeRoundSessions.race_qualifying,
                'race',
            ),
        [activeRoundSessions.race, activeRoundSessions.race_qualifying, drivers],
    );

    return (
        <div className="app-results__stack">
            <ResultsGpCarousel
                schedule={schedule}
                activeGpRound={activeGpRound}
                onSelect={onSelectGpRound}
            />

            <div className="app-results__tables-grid app-results__tables-grid--gp">
                <ResultsTable
                    title="Sprint 50%"
                    className="app-results-table--gp-results"
                    columns={GP_RESULTS_COLUMNS}
                    rows={sprintRows}
                    emptyLabel="Aucun résultat sprint saisi pour le moment."
                />
                <ResultsTable
                    title="Course 50%"
                    className="app-results-table--gp-results"
                    columns={GP_RESULTS_COLUMNS}
                    rows={raceRows}
                    emptyLabel="Aucun résultat course saisi pour le moment."
                />
            </div>
        </div>
    );
}
