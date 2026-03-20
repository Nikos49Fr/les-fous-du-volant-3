import ChevronLeftIcon from '../../../assets/icons/angle-left-solid-full.svg?react';
import ChevronRightIcon from '../../../assets/icons/angle-right-solid-full.svg?react';
import TwitchChatEmbed from '../../ui/TwitchChatEmbed/TwitchChatEmbed.jsx';
import MultiTwitchPanelToggle from './MultiTwitchPanelToggle.jsx';

export default function MultiTwitchChatPanel({
    isExpanded,
    onTogglePanel,
    selectedEntries,
    activeChatEntry,
    onPreviousChat,
    onNextChat,
}) {
    return (
        <aside
            className={`app-multi-twitch__panel app-multi-twitch__panel--right${
                isExpanded ? '' : ' app-multi-twitch__panel--collapsed'
            }`}
        >
            <div className="app-multi-twitch__panel-header">
                <MultiTwitchPanelToggle
                    isExpanded={isExpanded}
                    expandLabel="Afficher le tchat"
                    collapseLabel="Masquer le tchat"
                    onClick={onTogglePanel}
                    side="right"
                />
                {isExpanded ? (
                    <div className="app-multi-twitch__panel-title-wrap app-multi-twitch__panel-title-wrap--chat">
                        <h3>Tchat</h3>
                    </div>
                ) : null}
            </div>

            <div className="app-multi-twitch__panel-body">
                <div className="app-multi-twitch__chat-carousel">
                    <button
                        className="app-multi-twitch__chat-arrow"
                        type="button"
                        aria-label="Tchat précédent"
                        onClick={onPreviousChat}
                        disabled={selectedEntries.length === 0}
                    >
                        <ChevronLeftIcon aria-hidden="true" focusable="false" />
                    </button>
                    <div className="app-multi-twitch__chat-channel">
                        {activeChatEntry?.displayName ?? 'Aucun POV'}
                    </div>
                    <button
                        className="app-multi-twitch__chat-arrow"
                        type="button"
                        aria-label="Tchat suivant"
                        onClick={onNextChat}
                        disabled={selectedEntries.length === 0}
                    >
                        <ChevronRightIcon aria-hidden="true" focusable="false" />
                    </button>
                </div>
                <div className="app-multi-twitch__chat-frame">
                    <TwitchChatEmbed
                        channel={
                            activeChatEntry?.activeTwitchLogin ||
                            activeChatEntry?.twitchLogin ||
                            ''
                        }
                        title={activeChatEntry?.displayName ?? ''}
                    />
                </div>
            </div>
        </aside>
    );
}
