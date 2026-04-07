import './shared/MultiTwitchPanelShell.scss';
import './roster/MultiTwitchRosterPanel.scss';
import MultiTwitchAudioControls from './roster/MultiTwitchAudioControls.jsx';
import MultiTwitchRefreshControl from './roster/MultiTwitchRefreshControl.jsx';
import MultiTwitchRosterItem from './roster/MultiTwitchRosterItem.jsx';
import MultiTwitchPanelToggle from './MultiTwitchPanelToggle.jsx';

export default function MultiTwitchRosterPanel({
    isExpanded,
    onTogglePanel,
    errorMessage,
    isLoading,
    liveEntries,
    endedSelectedEntries,
    selectedIds,
    onToggleEntry,
    refreshLabel,
    refreshState,
    onManualRefresh,
    isRefreshButtonDisabled,
    maxSelected,
    selectedEntries,
    primaryAudioEntryId,
    onPrimaryAudioEntryChange,
    primaryAudioVolume,
    onPrimaryAudioVolumeChange,
    onTogglePrimaryAudioMute,
    onToggleMuteAll,
    areAllSelectedEntriesMuted,
}) {
    const hasLiveEntries = liveEntries.length > 0;
    const hasEndedSelectedEntries = endedSelectedEntries.length > 0;

    return (
        <aside
            className={`app-multi-twitch__panel app-multi-twitch__panel--left${
                isExpanded ? '' : ' app-multi-twitch__panel--collapsed'
            }`}
        >
            <div className="app-multi-twitch__panel-header">
                {isExpanded ? (
                    <div className="app-multi-twitch__panel-title-wrap">
                        <h3>Sélection des POV</h3>
                        <p>{maxSelected} max</p>
                    </div>
                ) : (
                    <span />
                )}
                <MultiTwitchPanelToggle
                    isExpanded={isExpanded}
                    expandLabel="Afficher la liste des POV"
                    collapseLabel="Masquer la liste des POV"
                    onClick={onTogglePanel}
                    side="left"
                />
            </div>

            <div className="app-multi-twitch__panel-body">
                {isExpanded ? (
                    <MultiTwitchRefreshControl
                        label={refreshLabel}
                        state={refreshState}
                        onManualRefresh={onManualRefresh}
                        disabled={isRefreshButtonDisabled}
                    />
                ) : null}

                {errorMessage ? (
                    <p className="app-multi-twitch__message app-multi-twitch__message--error">
                        {errorMessage}
                    </p>
                ) : null}

                {isLoading ? (
                    <p className="app-multi-twitch__message">
                        Chargement des chaînes...
                    </p>
                ) : (
                    <div className="app-multi-twitch__roster-content">
                        <div className="app-multi-twitch__roster-scroll">
                            {hasLiveEntries ? (
                                <div className="app-multi-twitch__roster-list">
                                    {liveEntries.map((entry) => {
                                        const isSelected = selectedIds.has(entry.id);
                                        const isDisabled =
                                            !isSelected &&
                                            selectedIds.size >= maxSelected;

                                        return (
                                            <MultiTwitchRosterItem
                                                key={entry.id}
                                                item={entry}
                                                isSelected={isSelected}
                                                isDisabled={isDisabled}
                                                onToggle={onToggleEntry}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="app-multi-twitch__message">
                                    Aucune chaîne en direct.
                                </p>
                            )}

                            {hasEndedSelectedEntries ? (
                                <div className="app-multi-twitch__ended-section">
                                    <p className="app-multi-twitch__ended-title">
                                        Live terminé
                                    </p>
                                    <div className="app-multi-twitch__roster-list">
                                        {endedSelectedEntries.map((entry) => (
                                            <MultiTwitchRosterItem
                                                key={entry.id}
                                                item={entry}
                                                isSelected={selectedIds.has(entry.id)}
                                                isDisabled={false}
                                                onToggle={onToggleEntry}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <MultiTwitchAudioControls
                            selectedEntries={selectedEntries}
                            primaryAudioEntryId={primaryAudioEntryId}
                            onPrimaryAudioEntryChange={onPrimaryAudioEntryChange}
                            primaryAudioVolume={primaryAudioVolume}
                            onPrimaryAudioVolumeChange={onPrimaryAudioVolumeChange}
                            onTogglePrimaryAudioMute={onTogglePrimaryAudioMute}
                            onToggleMuteAll={onToggleMuteAll}
                            areAllSelectedEntriesMuted={
                                areAllSelectedEntriesMuted
                            }
                        />
                    </div>
                )}
            </div>
        </aside>
    );
}
