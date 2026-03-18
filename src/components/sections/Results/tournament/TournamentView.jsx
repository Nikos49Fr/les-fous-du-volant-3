import { useMemo } from 'react';
import ResultsTable from '../shared/table/ResultsTable';
import DriverCell from '../shared/cells/DriverCell';
import TeamCell from '../shared/cells/TeamCell';
import {
    buildTournamentDriverStandings,
    buildTournamentTeamStandings,
} from '../../../../utils/resultsHelpers';
import { getTeamPresentation } from '../../../../utils/teamPresentation';
import {
    DRIVER_STANDINGS_COLUMNS,
    TEAM_STANDINGS_COLUMNS,
} from '../config/tableColumns';

export default function TournamentView({ drivers, sessionsByRound }) {
    const driverStandingsRows = useMemo(() => {
        return buildTournamentDriverStandings(drivers, sessionsByRound).map((row) => ({
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
    }, [drivers, sessionsByRound]);

    const teamStandingsRows = useMemo(() => {
        return buildTournamentTeamStandings(drivers, sessionsByRound).map((row) => ({
            id: row.team.id,
            teamModifier: getTeamPresentation(row.team).colorModifier,
            cells: {
                position: row.position,
                team: <TeamCell team={row.team} />,
                points: row.points,
            },
        }));
    }, [drivers, sessionsByRound]);

    return (
        <div className="app-results__tables-grid">
            <ResultsTable
                className="app-results-table--tournament-drivers"
                columns={DRIVER_STANDINGS_COLUMNS}
                rows={driverStandingsRows}
            />
            <ResultsTable
                className="app-results-table--tournament-teams"
                columns={TEAM_STANDINGS_COLUMNS}
                rows={teamStandingsRows}
            />
        </div>
    );
}
