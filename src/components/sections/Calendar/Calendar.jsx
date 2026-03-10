import './Calendar.scss';
import { getGpSchedule } from '../../../utils/gpHelpers';
import Title from '../../ui/Title/Title';

export default function Calendar() {
    const schedule = getGpSchedule();

    return (
        <section className="app-section app-calendar">
            <Title title="Calendrier des Grand Prix" />
            <div className="app-calendar-content">
                <p>
                    Chaque circuit sera révélé à la fin du circuit précédent,
                    par une énigme à résoudre.
                </p>
                <p>
                    Voici les dates des Grand Prix pour la saison 3 des fous de
                    volant :
                </p>
                <ol className="app-calendar__gp-list">
                    {schedule.map((gp) => {
                        return (
                            <li className="app-calendar__gp-item" key={gp.id}>
                                <span className="app-calendar__gp-item-number">
                                    {gp.id}
                                </span>
                                <span className="app-calendar__gp-item-country">
                                    {gp.isKnown ? (
                                        <span className="app-calendar__gp-item-country-name">
                                            {gp.country}
                                        </span>
                                    ) : null}
                                    {gp.isKnown && gp.flag ? (
                                        <span
                                            className={`app-calendar__gp-item-flag fi fi-${gp.flag}`}
                                        />
                                    ) : null}
                                </span>
                                <span
                                    className={`app-calendar__gp-item-name${
                                        gp.isKnown
                                            ? ''
                                            : ' app-calendar__gp-item-name--unknown'
                                    }`}
                                >
                                    {gp.isKnown
                                        ? gp.name
                                        : 'Circuit révélé à la fin du précédent GP'}
                                </span>
                                <time
                                    className="app-calendar__gp-item-date"
                                    dateTime={gp.startDateTime}
                                >
                                    <span className="app-calendar__gp-item-date-part">
                                        {gp.startLabel}
                                    </span>
                                </time>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}
