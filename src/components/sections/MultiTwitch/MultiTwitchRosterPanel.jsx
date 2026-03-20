import ArrowRotateRightIcon from '../../../assets/icons/arrow-rotate-right-solid-full.svg?react';
import { getTeamPresentation } from '../../../utils/teamPresentation';
import MultiTwitchPanelToggle from './MultiTwitchPanelToggle.jsx';

const CASTER_ID = 'guygui_onlive';

function MultiTwitchRosterItem({ item, isSelected, isDisabled, onToggle }) {
    const teamPresentation = item.team ? getTeamPresentation(item.team) : null;

    return (
        <label
            className={`app-multi-twitch__roster-item${
                isSelected ? ' app-multi-twitch__roster-item--selected' : ''
            }${
                isDisabled ? ' app-multi-twitch__roster-item--disabled' : ''
            }${
                item.id === CASTER_ID
                    ? ' app-multi-twitch__roster-item--caster'
                    : teamPresentation
                      ? ` app-multi-twitch__roster-item--${teamPresentation.colorModifier}`
                      : ''
            }`}
        >
            <input
                className="app-multi-twitch__checkbox"
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => onToggle(item.id)}
            />
            <span className="app-multi-twitch__checkbox-mark" aria-hidden="true" />
            <span className="app-multi-twitch__roster-name">{item.displayName}</span>
        </label>
    );
}

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
                    <div className="app-multi-twitch__refresh-row">
                        <span className="app-multi-twitch__refresh-label">
                            {refreshLabel}
                        </span>
                        <button
                            className={`app-multi-twitch__refresh-button app-multi-twitch__refresh-button--${refreshState}`}
                            type="button"
                            aria-label="Forcer l'actualisation des lives"
                            onClick={onManualRefresh}
                            disabled={isRefreshButtonDisabled}
                        >
                            <ArrowRotateRightIcon aria-hidden="true" focusable="false" />
                        </button>
                    </div>
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
                    <>
                        {hasLiveEntries ? (
                            <div className="app-multi-twitch__roster-list">
                                {liveEntries.map((entry) => {
                                    const isSelected = selectedIds.has(entry.id);
                                    const isDisabled =
                                        !isSelected && selectedIds.size >= maxSelected;

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
                    </>
                )}
            </div>
        </aside>
    );
}
