import './Nav.scss';
import { NavLink } from 'react-router-dom';

export default function Nav() {
    return (
        <nav className="app-header__nav">
            <NavLink className="app-header__nav-link" to="/">
                Accueil
            </NavLink>
            <NavLink className="app-header__nav-link" to="/drivers">
                Pilotes
            </NavLink>
            <NavLink className="app-header__nav-link" to="/calendar">
                Calendrier
            </NavLink>
            <NavLink className="app-header__nav-link" to="/circuits">
                Circuits
            </NavLink>
            <NavLink className="app-header__nav-link" to="/results">
                Résultats
            </NavLink>
            <NavLink className="app-header__nav-link" to="/multi-twitch">
                Multi-Twitch
            </NavLink>
            <NavLink className="app-header__nav-link" to="/lobby-setup">
                Réglages Lobby
            </NavLink>
        </nav>
    );
}
