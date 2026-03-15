import './AuthButton.scss';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import LogoutIcon from '../../../assets/icons/arrow-right-from-bracket-solid-full.svg?react';
import LoginIcon from '../../../assets/icons/arrow-right-to-bracket-solid-full.svg?react';
import TwitchIcon from '../../../assets/icons/twitch-brands-solid-full.svg?react';
import {
    fetchCurrentViewer,
    signInWithTwitch,
    signOut,
    subscribeToAuthChanges,
} from '../../../utils/authApi';

export default function AuthButton() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const loadUser = async () => {
            try {
                const viewer = await fetchCurrentViewer();
                if (active) {
                    setUser(viewer);
                }
            } catch {
                if (active) setUser(null);
            } finally {
                if (active) setLoading(false);
            }
        };

        loadUser();
        const unsubscribe = subscribeToAuthChanges(async (session) => {
            if (!active) return;

            if (!session) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const viewer = await fetchCurrentViewer();
                if (active) {
                    setUser(viewer);
                }
            } catch {
                if (active) {
                    setUser(null);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    if (loading) {
        return (
            <div className="app-auth">
                <span className="app-auth__status">Connexion...</span>
            </div>
        );
    }

    if (user) {
        return (
            <div className="app-auth app-auth--connected">
                <div className="app-auth__chip app-auth__chip--user">
                    <img
                        className="app-auth__avatar"
                        src={user.profile_image_url}
                        alt={`Avatar ${user.display_name}`}
                    />
                    <span className="app-auth__name">{user.display_name}</span>
                </div>
                {user.isSuperAdmin ? (
                    <NavLink
                        className="app-auth__button app-auth__chip app-auth__chip--admin"
                        to="/admin/permissions"
                    >
                        Admin
                    </NavLink>
                ) : null}
                <button
                    className="app-auth__button app-auth__button--logout app-auth__chip app-auth__chip--logout"
                    type="button"
                    onClick={async () => {
                        try {
                            await signOut();
                        } finally {
                            setUser(null);
                            window.location.href = '/';
                        }
                    }}
                >
                    <LogoutIcon
                        className="app-auth__icon app-auth__icon--logout"
                        aria-hidden="true"
                        focusable="false"
                    />
                    Se déconnecter
                </button>
            </div>
        );
    }

    return (
        <div className="app-auth">
            <button
                className="app-auth__button app-auth__chip app-auth__chip--login"
                type="button"
                onClick={async () => {
                    try {
                        await signInWithTwitch();
                    } catch {
                        setUser(null);
                    }
                }}
            >
                <LoginIcon
                    className="app-auth__icon app-auth__icon--login"
                    aria-hidden="true"
                    focusable="false"
                />
                Se connecter
                <TwitchIcon
                    className="app-auth__icon app-auth__icon--twitch"
                    aria-hidden="true"
                    focusable="false"
                />
            </button>
        </div>
    );
}
