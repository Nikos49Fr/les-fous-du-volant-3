import './Nav.scss';
import { NavLink } from 'react-router-dom';
import ChevronDownIcon from '../../../assets/icons/chevron-down-solid-full.svg?react';

const getNavLinkClass = ({ isActive }) =>
    `app-header__nav-link${isActive ? ' app-header__nav-link--active' : ''}`;

export default function Nav({ isBannerExpanded, onToggleBanner }) {
    return (
        <nav className="app-header__nav">
            <div className="app-header__nav-links">
                <NavLink className={getNavLinkClass} to="/">
                    Accueil
                </NavLink>
                <NavLink className={getNavLinkClass} to="/drivers">
                    Participants
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
            </div>
            <button
                className={`app-header__nav-toggle${
                    isBannerExpanded
                        ? ' app-header__nav-toggle--expanded'
                        : ''
                }`}
                type="button"
                aria-label={
                    isBannerExpanded
                        ? 'Masquer la bannière'
                        : 'Afficher la bannière'
                }
                onClick={onToggleBanner}
            >
                <ChevronDownIcon aria-hidden="true" focusable="false" />
            </button>
        </nav>
    );
}
