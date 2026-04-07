import MultiTwitchPovTile from './MultiTwitchPovTile.jsx';
import './MultiTwitchPovGrid.scss';

function getStageClassName(selectedCount) {
    if (selectedCount <= 0) {
        return 'app-multi-twitch__pov-grid--empty';
    }

    const boundedCount = Math.min(selectedCount, 6);
    return `app-multi-twitch__pov-grid--${boundedCount}`;
}

export default function MultiTwitchPovGrid({
    selectedEntries,
    getEntryVolume,
    onEntryVolumeChange,
    onToggleEntryMute,
    draggingEntryId,
    dragOverEntryId,
    onPovDragStart,
    onPovDragEnter,
    onPovDragEnd,
    onPovDrop,
}) {
    const selectedCount = selectedEntries.length;
    const orderById = new Map(
        selectedEntries.map((entry, index) => [entry.id, index]),
    );

    if (selectedCount <= 0) {
        return null;
    }

    return (
        <div
            className={`app-multi-twitch__pov-grid ${getStageClassName(selectedCount)}${
                draggingEntryId ? ' app-multi-twitch__pov-grid--dragging' : ''
            }`}
        >
            {[...selectedEntries]
                .slice(0, 6)
                .sort((leftEntry, rightEntry) =>
                    leftEntry.id.localeCompare(rightEntry.id, 'fr', {
                        sensitivity: 'base',
                    }),
                )
                .map((entry) => (
                <MultiTwitchPovTile
                    key={entry.id}
                    entry={entry}
                    entryVolume={getEntryVolume(entry.id)}
                    onEntryVolumeChange={onEntryVolumeChange}
                    onToggleEntryMute={onToggleEntryMute}
                    slotIndex={orderById.get(entry.id) ?? 0}
                    totalCount={selectedCount}
                    isDragging={draggingEntryId === entry.id}
                    isDragOver={dragOverEntryId === entry.id}
                    onDragStart={onPovDragStart}
                    onDragEnter={onPovDragEnter}
                    onDragEnd={onPovDragEnd}
                    onDrop={onPovDrop}
                />
            ))}
        </div>
    );
}
