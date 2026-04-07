import MoonIcon from '../../../../assets/icons/moon-solid-full.svg?react';
import SunIcon from '../../../../assets/icons/sun-solid-full.svg?react';
import './ChatThemeToggle.scss';

export default function ChatThemeToggle({ theme, onToggle }) {
    const ThemeIcon = theme === 'dark' ? MoonIcon : SunIcon;

    return (
        <button
            className={`app-multi-twitch__theme-toggle app-multi-twitch__theme-toggle--${theme}`}
            type="button"
            aria-label={
                theme === 'dark'
                    ? 'Passer le tchat en thème clair'
                    : 'Passer le tchat en thème sombre'
            }
            onClick={onToggle}
        >
            <span className="app-multi-twitch__theme-toggle-thumb">
                <ThemeIcon
                    className="app-multi-twitch__theme-toggle-icon"
                    aria-hidden="true"
                    focusable="false"
                />
            </span>
        </button>
    );
}
