import './Nav.scss';
import { NavLink } from 'react-router-dom';

const getNavLinkClass = ({ isActive }) =>
    `app-header__nav-link${isActive ? ' app-header__nav-link--active' : ''}`;

export default function Nav() {
    return (
        <nav className="app-header__nav">
            <NavLink className={getNavLinkClass} to="/">
                Accueil
            </NavLink>
            <NavLink className={getNavLinkClass} to="/drivers">
                Pilotes
            </NavLink>
            <NavLink className={getNavLinkClass} to="/calendar">
                Calendrier
            </NavLink>
            <NavLink className={getNavLinkClass} to="/circuits">
                Circuits
            </NavLink>
            <NavLink className={getNavLinkClass} to="/results">
                Résultats
            </NavLink>
            <NavLink className={getNavLinkClass} to="/multi-twitch">
                Multi-Twitch
            </NavLink>
            <NavLink className={getNavLinkClass} to="/lobby-setup">
                Réglages
            </NavLink>
        </nav>
    );
}
