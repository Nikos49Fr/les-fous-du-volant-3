import { forwardRef } from 'react';
import './Footer.scss';
import { NavLink } from 'react-router-dom';

const Footer = forwardRef(function Footer(_props, ref) {
    return (
        <footer className="app-footer" ref={ref}>
            <div className="app-footer__nav">
                <NavLink className="app-footer__nav-link" to="/contact">
                    Contact
                </NavLink>
                <NavLink className="app-footer__nav-link" to="/credits">
                    Crédits
                </NavLink>
            </div>
        </footer>
    );
});

export default Footer;
