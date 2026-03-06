import './Calendar.scss';
import { GP_DATES, GP_NAMES, GP_REVEALED } from '../../../data/dataGP';
import Title from '../../ui/Title/Title';

export default function Calendar() {
    const gpById = Object.fromEntries(GP_NAMES.map((gp) => [gp.id, gp]));

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
                    {GP_DATES.map((gpDate, index) => {
                        const gpId = GP_REVEALED[index] ?? 0;
                        const gp = gpById[gpId];
                        const isKnown = gpId !== 0 && gp;
                        const timePart = gpDate.label.split(' ').slice(-1)[0];
                        const datePart = gpDate.label.replace(
                            ` ${timePart}`,
                            '',
                        );

                        return (
                            <li
                                className="app-calendar__gp-item"
                                key={gpDate.id}
                            >
                                <span className="app-calendar__gp-item-number">
                                    {gpDate.id}
                                </span>
                                <span className="app-calendar__gp-item-country">
                                    {isKnown ? (
                                        <span className="app-calendar__gp-item-country-name">
                                            {gp.country}
                                        </span>
                                    ) : null}
                                    {isKnown && gp.flag ? (
                                        <span
                                            className={`app-calendar__gp-item-flag fi fi-${gp.flag}`}
                                        />
                                    ) : null}
                                </span>
                                <span
                                    className={`app-calendar__gp-item-name${
                                        isKnown
                                            ? ''
                                            : ' app-calendar__gp-item-name--unknown'
                                    }`}
                                >
                                    {isKnown
                                        ? gp.name
                                        : 'Circuit révélé à la fin du précédent GP'}
                                </span>
                                <time
                                    className="app-calendar__gp-item-date"
                                    dateTime={gpDate.dateTime}
                                >
                                    <span className="app-calendar__gp-item-date-part">
                                        {datePart}
                                    </span>{' '}
                                    <span className="app-calendar__gp-item-time">
                                        {timePart}
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
