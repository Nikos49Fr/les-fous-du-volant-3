import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/ui/Header/Header.jsx';
import Footer from './components/ui/Footer/Footer.jsx';
import Home from './components/sections/Home/Home.jsx';
import Drivers from './components/sections/Drivers/Drivers.jsx';
import Calendar from './components/sections/Calendar/Calendar.jsx';
import Circuits from './components/sections/Circuits/Circuits.jsx';
import Results from './components/sections/Results/Results.jsx';
import MultiTwitch from './components/sections/MultiTwitch/MultiTwitch.jsx';
import LobbySetup from './components/sections/LobbySetup/LobbySetup.jsx';
import AdminPermissions from './components/sections/AdminPermissions/AdminPermissions.jsx';
import Contact from './components/sections/Contact/Contact.jsx';
import Credits from './components/sections/Credits/Credits.jsx';
import { useLayoutEffect, useRef } from 'react';

export default function App() {
    const headerRef = useRef(null);
    const footerRef = useRef(null);

    useLayoutEffect(() => {
        const header = headerRef.current;
        const footer = footerRef.current;

        const update = () => {
            document.documentElement.style.setProperty(
                '--header-h',
                header ? `${header.offsetHeight}px` : '0px',
            );
            document.documentElement.style.setProperty(
                '--footer-h',
                footer ? `${footer.offsetHeight}px` : '0px',
            );
        };

        update();

        const ro = new ResizeObserver(update);
        if (header) ro.observe(header);
        if (footer) ro.observe(footer);

        window.addEventListener('resize', update);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', update);
        };
    }, []);

    return (
        <BrowserRouter>
            <div className="app-layout">
                <Header ref={headerRef} />
                <main className="app-main">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/drivers" element={<Drivers />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/circuits" element={<Circuits />} />
                        <Route path="/results" element={<Results />} />
                        <Route path="/multi-twitch" element={<MultiTwitch />} />
                        <Route path="/lobby-setup" element={<LobbySetup />} />
                        <Route path="/admin/permissions" element={<AdminPermissions />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/credits" element={<Credits />} />
                        <Route path="*" element={<Home />} />
                    </Routes>
                </main>
                <Footer ref={footerRef} />
            </div>
        </BrowserRouter>
    );
}
