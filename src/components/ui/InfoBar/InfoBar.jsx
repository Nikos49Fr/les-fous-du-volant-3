import './InfoBar.scss';

export default function InfoBar() {
    return (
        <div className="app-header__info-bar">
            <time dateTime="2026-03-08T20:30:00+01:00">
                Dimanche 8 mars 20h30
            </time>
            <p>Bahreïn</p>
            <time dateTime="2026-03-08T20:30:00+01:00">
                3 Jours 10 Heure 54 min
            </time>
        </div>
    );
}
