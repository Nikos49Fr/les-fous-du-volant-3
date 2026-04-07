import './MultiTwitchViewportNotice.scss';

export default function MultiTwitchViewportNotice({ hiddenCount }) {
    if (hiddenCount <= 0) {
        return null;
    }

    return (
        <p className="app-multi-twitch__viewport-notice">
            {hiddenCount} POV masquée{hiddenCount > 1 ? 's' : ''} sur cet écran.
        </p>
    );
}
