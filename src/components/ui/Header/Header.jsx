import { forwardRef } from 'react';
import './Header.scss';
import banner from '../../../assets/brand/banner_fdv.webp';
import Nav from '../Nav/Nav';
import GpStatusBar from '../GpStatusBar/GpStatusBar';

const Header = forwardRef(function Header(
    { isBannerExpanded, onToggleBanner },
    ref,
) {
    return (
        <header className="app-header" ref={ref}>
            <GpStatusBar />
            <div
                className={`app-header__brand-shell${
                    isBannerExpanded ? '' : ' app-header__brand-shell--collapsed'
                }`}
            >
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
            </div>
            <Nav
                isBannerExpanded={isBannerExpanded}
                onToggleBanner={onToggleBanner}
            />
        </header>
    );
});

export default Header;
