import ChevronLeftIcon from '../../../../assets/icons/angle-left-solid-full.svg?react';
import ChevronRightIcon from '../../../../assets/icons/angle-right-solid-full.svg?react';
import './MultiTwitchChatCarousel.scss';

export default function MultiTwitchChatCarousel({
    selectedEntries,
    activeChatEntry,
    onPreviousChat,
    onNextChat,
}) {
    return (
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
    );
}
