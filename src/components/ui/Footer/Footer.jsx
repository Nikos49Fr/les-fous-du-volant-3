import { forwardRef } from 'react';
import './Footer.scss';
import { NavLink } from 'react-router-dom';
import AuthButton from '../AuthButton/AuthButton.jsx';

const getFooterNavLinkClass = ({ isActive }) =>
    `app-footer__nav-link${isActive ? ' app-footer__nav-link--active' : ''}`;

const Footer = forwardRef(function Footer(_props, ref) {
    return (
        <footer className="app-footer" ref={ref}>
            <div className="app-footer__bar">
                <div className="app-footer__auth">
                    <AuthButton />
                </div>
                <div className="app-footer__nav">
                    <NavLink className={getFooterNavLinkClass} to="/contact">
                        Contact
                    </NavLink>
                    <NavLink className={getFooterNavLinkClass} to="/credits">
                        Crédits
                    </NavLink>
                </div>
            </div>
        </footer>
    );
});

export default Footer;

