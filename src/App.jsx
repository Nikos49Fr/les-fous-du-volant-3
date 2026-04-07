import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/ui/Header/Header.jsx';
import Footer from './components/ui/Footer/Footer.jsx';

const Home = lazy(() => import('./components/sections/Home/Home.jsx'));
const Drivers = lazy(() => import('./components/sections/Drivers/Drivers.jsx'));
const Calendar = lazy(() => import('./components/sections/Calendar/Calendar.jsx'));
const Circuits = lazy(() => import('./components/sections/Circuits/Circuits.jsx'));
const Results = lazy(() => import('./components/sections/Results/Results.jsx'));
const MultiTwitch = lazy(() => import('./components/sections/MultiTwitch/MultiTwitch.jsx'));
const LobbySetup = lazy(() => import('./components/sections/LobbySetup/LobbySetup.jsx'));
const AdminPermissions = lazy(
    () => import('./components/sections/AdminPermissions/AdminPermissions.jsx'),
);
const Contact = lazy(() => import('./components/sections/Contact/Contact.jsx'));
const Credits = lazy(() => import('./components/sections/Credits/Credits.jsx'));

function AppShell() {
    const location = useLocation();
    const headerRef = useRef(null);
    const footerRef = useRef(null);
    const [isBannerExpanded, setIsBannerExpanded] = useState(true);

    useEffect(() => {
        if (location.pathname === '/multi-twitch') {
            setIsBannerExpanded(false);
        }
    }, [location.pathname]);

    useLayoutEffect(() => {
        const header = headerRef.current;
        const footer = footerRef.current;
        const headerChildren = header ? Array.from(header.children) : [];

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
        const rafId = requestAnimationFrame(update);
        const timeoutId = window.setTimeout(update, 260);

        const ro = new ResizeObserver(update);
        if (header) ro.observe(header);
        headerChildren.forEach((child) => ro.observe(child));
        if (footer) ro.observe(footer);

        header?.addEventListener('transitionrun', update);
        header?.addEventListener('transitionend', update);
        window.addEventListener('resize', update);
        return () => {
            ro.disconnect();
            cancelAnimationFrame(rafId);
            window.clearTimeout(timeoutId);
            header?.removeEventListener('transitionrun', update);
            header?.removeEventListener('transitionend', update);
            window.removeEventListener('resize', update);
        };
    }, [isBannerExpanded, location.pathname]);

    return (
        <div className="app-layout">
            <Header
                ref={headerRef}
                isBannerExpanded={isBannerExpanded}
                onToggleBanner={() => setIsBannerExpanded((current) => !current)}
            />
            <main className="app-main">
                <Suspense fallback={<div className="app-route-loading">Chargement...</div>}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/drivers" element={<Drivers />} />
                        <Route path="/calendar" element={<Calendar />} />
                        <Route path="/circuits" element={<Circuits />} />
                        <Route path="/results" element={<Results />} />
                        <Route path="/multi-twitch" element={<MultiTwitch />} />
                        <Route path="/lobby-setup" element={<LobbySetup />} />
                        <Route
                            path="/admin/permissions"
                            element={<AdminPermissions />}
                        />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/credits" element={<Credits />} />
                        <Route path="*" element={<Home />} />
                    </Routes>
                </Suspense>
            </main>
            <Footer ref={footerRef} />
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppShell />
        </BrowserRouter>
    );
}
