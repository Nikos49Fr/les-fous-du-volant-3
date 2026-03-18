export const DRIVER_STANDINGS_COLUMNS = [
    { key: 'position', label: 'POS.', colClassName: 'app-results-table__col--position' },
    { key: 'number', label: 'NO.', colClassName: 'app-results-table__col--number' },
    {
        key: 'driver',
        label: 'Driver',
        colClassName: 'app-results-table__col--driver',
        className: 'app-results-table__cell--align-left',
    },
    {
        key: 'team',
        label: 'Écurie',
        colClassName: 'app-results-table__col--team',
        className:
            'app-results-table__cell--align-left app-results-table__cell--team-logo-only-mobile',
    },
    { key: 'points', label: 'PTS.', colClassName: 'app-results-table__col--points' },
];

export const TEAM_STANDINGS_COLUMNS = [
    { key: 'position', label: 'POS.', colClassName: 'app-results-table__col--position' },
    {
        key: 'team',
        label: 'Écurie',
        colClassName: 'app-results-table__col--team',
        className: 'app-results-table__cell--align-left',
    },
    { key: 'points', label: 'PTS.', colClassName: 'app-results-table__col--points' },
];

export const GP_RESULTS_COLUMNS = [
    { key: 'position', label: 'POS.', colClassName: 'app-results-table__col--position' },
    { key: 'grid', label: 'GRILLE', colClassName: 'app-results-table__col--grid' },
    { key: 'number', label: 'NO.', colClassName: 'app-results-table__col--number' },
    {
        key: 'driver',
        label: 'Driver',
        colClassName: 'app-results-table__col--driver',
        className: 'app-results-table__cell--align-left',
    },
    {
        key: 'team',
        label: 'Écurie',
        colClassName: 'app-results-table__col--team',
        className:
            'app-results-table__cell--align-left app-results-table__cell--team-logo-only-mobile',
    },
    { key: 'points', label: 'PTS.', colClassName: 'app-results-table__col--points' },
];
