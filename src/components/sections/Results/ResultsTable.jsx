import './ResultsTable.scss';
import ResultsTableRow from './ResultsTableRow';

export default function ResultsTable({
    title,
    columns,
    rows,
    emptyLabel = 'Aucune donnée disponible.',
    className = '',
}) {
    const gridTemplateColumns = columns.map((column) => column.width ?? '1fr').join(' ');

    return (
        <section className={`app-results-table ${className}`.trim()}>
            {title ? <h3 className="app-results-table__title">{title}</h3> : null}

            <div className="app-results-table__frame">
                <div
                    className="app-results-table__head"
                    style={{ gridTemplateColumns }}
                >
                    {columns.map((column) => (
                        <span
                            key={column.key}
                            className={`app-results-table__head-cell ${column.className ?? ''}`.trim()}
                        >
                            {column.label}
                        </span>
                    ))}
                </div>

                {rows.length > 0 ? (
                    <div className="app-results-table__body">
                        {rows.map((row) => (
                            <ResultsTableRow
                                key={row.id}
                                columns={columns}
                                row={row}
                                gridTemplateColumns={gridTemplateColumns}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="app-results-table__empty">{emptyLabel}</p>
                )}
            </div>
        </section>
    );
}
