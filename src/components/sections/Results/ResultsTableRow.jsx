export default function ResultsTableRow({ row, columns, gridTemplateColumns }) {
    return (
        <div
            className={`app-results-table__row app-results-table__row--team-${row.teamModifier ?? 'neutral'}`}
        >
            <div
                className="app-results-table__row-grid"
                style={{ gridTemplateColumns }}
            >
                {columns.map((column) => (
                    <div
                        key={`${row.id}-${column.key}`}
                        className={`app-results-table__cell ${column.className ?? ''} ${row.cellClassNames?.[column.key] ?? ''}`.trim()}
                    >
                        {row.cells[column.key]}
                    </div>
                ))}
            </div>
            {row.tag ? <div className="app-results-table__tag-wrap">{row.tag}</div> : null}
        </div>
    );
}
