import './Home.scss';
import { NavLink } from 'react-router-dom';
import logo from '../../../assets/brand/Logo_FDV.webp';
import Title from '../../ui/Title/Title';

const TRAILER_URL = 'https://www.youtube.com/watch?v=81RPgyxn-Pk';
const TRAILER_EMBED_URL = 'https://www.youtube-nocookie.com/embed/81RPgyxn-Pk';

export default function Home() {
    return (
        <section className="app-section app-home">
            <Title title="Les Fous du volant" subtitle="Saison 3" />

            <div className="app-home__trailer">
                <div className="app-home__trailer-frame">
                    <a
                        className="app-home__trailer-link"
                        href={TRAILER_URL}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <iframe
                        className="app-home__trailer-embed"
                        src={TRAILER_EMBED_URL}
                        title="Tournoi des Fous du Volant - Saison 3 | Trailer officiel"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        />
                    </a>
                </div>
            </div>
            <div className="app-home__logo">
                <img
                    className="app-home__logo-image"
                    src={logo}
                    alt="Logo Les Fous du Volant Saison 3"
                />
            </div>
            <article className="app-home__article">
                <p>
                    <strong>Les Fous du Volant</strong> est un championnat sur
                    le jeu <strong>F1 25</strong> réunissant
                    <strong> 18 pilotes</strong> répartis par tirage au sort
                    dans 9 écuries. La compétition se déroule sur
                    <strong> 12 circuits en 12 semaines</strong>, à raison d'un
                    grand prix tous les 15 jours le
                    <strong> dimanche à 20h30</strong>.
                </p>
                <p>
                    <em>
                        (
                        <NavLink className="nav-link" to="/calendar">
                            Voir le calendrier
                        </NavLink>
                        )
                    </em>
                </p>
                <p>
                    Les grands prix s'enchaîneront avec une
                    <strong> difficulté progressive</strong>, valorisant
                    <strong> l'endurance et la régularité</strong> des pilotes
                    au fil des courses. La <strong> météo aléatoire</strong>{' '}
                    viendra ajouter une dimension stratégique supplémentaire à
                    la gestion de course.
                    <br />
                    Afin de garantir une équité entre tous les participants,
                    <strong> les volants ne sont pas autorisés</strong>, le
                    tournoi étant conçu pour être joué
                    <strong> à la manette ou au clavier/souris</strong>.
                </p>
            </article>
            <article className="app-home__article">
                <p>
                    Chaque Grand Prix se déroulera le dimanche à ces horaires :
                </p>

                <ul>
                    <li>
                        <strong>20h30</strong> : Qualifications Sprint (18 min)
                    </li>
                    <li>
                        <strong>20h50 : Course Sprint 50 %</strong> (20 min)
                    </li>
                    <li>
                        <strong>21h10</strong> :{' '}
                        <em> Re-création du lobby + pause (5 à 10 min)</em>
                    </li>
                    <li>
                        <strong>21h25</strong> : Qualifications complètes (Q1 18
                        min + Q2 15 min + Q3 12 min)
                    </li>
                    <li>
                        <strong>22h20 : Course 50 %</strong> (50 min)
                    </li>
                    <li>
                        <strong>23h10</strong> : Débrief
                    </li>
                </ul>
            </article>
        </section>
    );
}
