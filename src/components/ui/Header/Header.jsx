import { NavLink } from 'react-router-dom';
import './Header.scss';

export default function Header() {
  return (
    <header className="app-header">
      <nav className="app-header__nav">
        <NavLink to="/">Accueil</NavLink>
      </nav>
      <div className="app-header__brand">Place holder - bannière FDV3</div>
    </header>
  );
}
