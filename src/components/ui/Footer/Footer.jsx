import { forwardRef } from 'react';
import './Footer.scss';
import { NavLink } from 'react-router-dom';
import AuthButton from '../AuthButton/AuthButton.jsx';

const Footer = forwardRef(function Footer(_props, ref) {
    return (
        <footer className="app-footer" ref={ref}>
            <div className="app-footer__bar">
                <div className="app-footer__auth">
                    <AuthButton />
                </div>
                <div className="app-footer__nav">
                    <NavLink className="app-footer__nav-link" to="/contact">
                        Contact
                    </NavLink>
                    <NavLink className="app-footer__nav-link" to="/credits">
                        Crédits
                    </NavLink>
                </div>
            </div>
        </footer>
    );
});

export default Footer;
