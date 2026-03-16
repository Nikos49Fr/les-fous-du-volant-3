import './ResultsTable.scss';
import ResultsTableRow from './ResultsTableRow';

export default function ResultsTable({
    title,
    columns,
    rows,
    emptyLabel = 'Aucune donnée disponible.',
    className = '',
}) {
    const hasTags = rows.some((row) => row.tag);

    return (
        <section className={`app-results-table ${className}`.trim()}>
            <div className="app-results-table__frame">
                {title ? <h3 className="app-results-table__title">{title}</h3> : null}

                {rows.length > 0 ? (
                    <table className="app-results-table__table">
                        <colgroup>
                            {columns.map((column) => (
                                <col
                                    key={column.key}
                                    style={{
                                        '--column-width': column.width ?? 'auto',
                                        '--column-width-mobile':
                                            column.mobileWidth ?? column.width ?? 'auto',
                                    }}
                                />
                            ))}
                            {hasTags ? <col className="app-results-table__tag-col" /> : null}
                        </colgroup>
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={`app-results-table__head-cell ${column.className ?? ''}`.trim()}
                                        scope="col"
                                    >
                                        {column.label}
                                    </th>
                                ))}
                                {hasTags ? (
                                    <th
                                        className="app-results-table__head-cell app-results-table__head-cell--tag"
                                        scope="col"
                                    />
                                ) : null}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <ResultsTableRow
                                    key={row.id}
                                    columns={columns}
                                    row={row}
                                    hasTagColumn={hasTags}
                                />
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="app-results-table__empty">{emptyLabel}</p>
                )}
            </div>
        </section>
    );
}
