import { forwardRef } from 'react';
import './Header.scss';
import banner from '../../../assets/brand/banner_fdv.webp';
import Nav from '../Nav/Nav';
import InfoBar from '../InfoBar/InfoBar';

const Header = forwardRef(function Header(_props, ref) {
    return (
        <header className="app-header" ref={ref}>
            <InfoBar />
            <div className="app-header__brand">
                <img
                    className="app-header__brand-bg"
                    src={banner}
                    alt="Bannière Fou du Volant"
                />
                <div className="app-header__brand-text">
                    <h1>Les Fous du Volant</h1>
                    <p>Saison 3</p>
                </div>
            </div>
            <Nav />
        </header>
    );
});

export default Header;
