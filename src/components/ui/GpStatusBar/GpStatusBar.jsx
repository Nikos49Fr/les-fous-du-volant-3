import './GpStatusBar.scss';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getActiveGpDisplay } from '../../../utils/gpHelpers';

const USE_MOCK_NOW = false;
const MOCK_NOW_ISO = '2026-03-22T23:30:01+01:00';

export default function GpStatusBar() {
    const [now, setNow] = useState(
        USE_MOCK_NOW ? new Date(MOCK_NOW_ISO) : new Date(),
    );

    useEffect(() => {
        const intervalId = setInterval(() => {
            setNow(USE_MOCK_NOW ? new Date(MOCK_NOW_ISO) : new Date());
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const active = getActiveGpDisplay(now);

    if (active.phase === 'season-ended') {
        return (
            <div className={`gp-status gp-status--${active.phase}`}>
                <p className="gp-status__title">
                    La saison 3 des fous du volant est terminée.{' '}
                    <NavLink className="gp-status__link" to="/results">
                        Voir les résultats
                    </NavLink>
                </p>
            </div>
        );
    }

    return (
        <div className={`gp-status gp-status--${active.phase}`}>
            {active.phase === 'live' ? (
                <span className="gp-status__tag">Live</span>
            ) : active.phase === 'today' ? (
                <>
                    <span className="gp-status__title">
                        Grand Prix AUJOURD'HUI
                    </span>
                    <time
                        className="gp-status__time"
                        dateTime={active.dateTime}
                    >
                        {active.dateLabel}
                    </time>
                </>
            ) : (
                <>
                    <span className="gp-status__title">
                        Prochain Grand Prix
                    </span>
                    <time
                        className="gp-status__time"
                        dateTime={active.dateTime}
                    >
                        {active.dateLabel}
                    </time>
                </>
            )}

            <p className="gp-status__race">
                <span className="gp-status__country">{active.gpCountry}</span>
                {' '}
                {active.gp && active.gpFlag ? (
                    <span
                        className={`gp-status__flag fi fi-${active.gpFlag}`}
                    />
                ) : null}
                <span className="gp-status__name">{active.gpName}</span>
            </p>

            {active.phase === 'live' ? (
                <span className="gp-status__tag">Live</span>
            ) : (
                <span className="gp-status__state">
                    <span className="gp-status__label">
                        {active.statusLabel}
                    </span>
                </span>
            )}
        </div>
    );
}
