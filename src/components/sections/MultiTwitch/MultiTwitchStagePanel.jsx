import './stage/MultiTwitchStagePanel.scss';
import MultiTwitchPovGrid from './stage/MultiTwitchPovGrid.jsx';
import MultiTwitchViewportNotice from './stage/MultiTwitchViewportNotice.jsx';

export default function MultiTwitchStagePanel({
    selectedEntries,
    hiddenSelectedCount,
    maxVisiblePov,
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

    return (
        <section className="app-multi-twitch__stage">
            <MultiTwitchViewportNotice hiddenCount={hiddenSelectedCount} />
            {selectedCount > 0 ? (
                <MultiTwitchPovGrid
                    selectedEntries={selectedEntries}
                    getEntryVolume={getEntryVolume}
                    onEntryVolumeChange={onEntryVolumeChange}
                    onToggleEntryMute={onToggleEntryMute}
                    draggingEntryId={draggingEntryId}
                    dragOverEntryId={dragOverEntryId}
                    onPovDragStart={onPovDragStart}
                    onPovDragEnter={onPovDragEnter}
                    onPovDragEnd={onPovDragEnd}
                    onPovDrop={onPovDrop}
                />
            ) : (
                <div className="app-multi-twitch__empty-stage">
                    <p>Sélectionne jusqu'à {maxVisiblePov} POV pour commencer.</p>
                </div>
            )}
        </section>
    );
}
