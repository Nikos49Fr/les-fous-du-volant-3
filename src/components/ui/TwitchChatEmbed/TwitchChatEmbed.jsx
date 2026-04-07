import { useMemo } from 'react';
import './TwitchChatEmbed.scss';

function getParentHosts() {
    if (typeof window === 'undefined') {
        return ['localhost'];
    }

    const hostnames = new Set([window.location.hostname || 'localhost']);

    if (window.location.hostname === 'localhost') {
        hostnames.add('127.0.0.1');
    }

    return [...hostnames];
}

export default function TwitchChatEmbed({ channel, title, theme = 'dark' }) {
    const embedSrc = useMemo(() => {
        if (!channel) {
            return '';
        }

        const params = new URLSearchParams();
        if (theme === 'dark') {
            params.append('darkpopout', '');
        }
        for (const host of getParentHosts()) {
            params.append('parent', host);
        }

        return `https://www.twitch.tv/embed/${channel}/chat?${params.toString()}`;
    }, [channel, theme]);

    if (!channel) {
        return (
            <div className="app-twitch-chat-embed app-twitch-chat-embed--empty">
                <span>Aucun tchat disponible.</span>
            </div>
        );
    }

    return (
        <div className="app-twitch-chat-embed">
            <iframe
                className="app-twitch-chat-embed__frame"
                src={embedSrc}
                title={title ? `Tchat Twitch ${title}` : 'Tchat Twitch'}
            />
        </div>
    );
}
