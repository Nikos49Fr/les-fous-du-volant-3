import './shared/MultiTwitchPanelShell.scss';
import './chat/MultiTwitchChatPanel.scss';
import TwitchChatEmbed from '../../ui/TwitchChatEmbed/TwitchChatEmbed.jsx';
import ChatThemeToggle from './chat/ChatThemeToggle.jsx';
import MultiTwitchChatCarousel from './chat/MultiTwitchChatCarousel.jsx';
import MultiTwitchPanelToggle from './MultiTwitchPanelToggle.jsx';

export default function MultiTwitchChatPanel({
    isExpanded,
    onTogglePanel,
    chatTheme,
    onToggleTheme,
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
                {isExpanded ? (
                    <ChatThemeToggle theme={chatTheme} onToggle={onToggleTheme} />
                ) : null}
            </div>

            <div className="app-multi-twitch__panel-body">
                <MultiTwitchChatCarousel
                    selectedEntries={selectedEntries}
                    activeChatEntry={activeChatEntry}
                    onPreviousChat={onPreviousChat}
                    onNextChat={onNextChat}
                />
                <div className="app-multi-twitch__chat-frame">
                    <TwitchChatEmbed
                        channel={
                            activeChatEntry?.activeTwitchLogin ||
                            activeChatEntry?.twitchLogin ||
                            ''
                        }
                        title={activeChatEntry?.displayName ?? ''}
                        theme={chatTheme}
                    />
                </div>
            </div>
        </aside>
    );
}

