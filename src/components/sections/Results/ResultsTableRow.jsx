export default function ResultsTableRow({ row, columns, hasTagColumn }) {
    return (
        <tr className={`app-results-table__row app-results-table__row--team-${row.teamModifier ?? 'neutral'}`}>
            {columns.map((column) => (
                <td
                    key={`${row.id}-${column.key}`}
                    className={`app-results-table__cell ${column.className ?? ''} ${row.cellClassNames?.[column.key] ?? ''}`.trim()}
                >
                    {row.cells[column.key]}
                </td>
            ))}
            {hasTagColumn ? (
                <td className="app-results-table__tag-wrap">{row.tag ?? null}</td>
            ) : null}
        </tr>
    );
}
