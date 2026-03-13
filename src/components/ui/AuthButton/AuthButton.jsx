import './AuthButton.scss';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import LogoutIcon from '../../../assets/icons/arrow-right-from-bracket-solid-full.svg?react';
import LoginIcon from '../../../assets/icons/arrow-right-to-bracket-solid-full.svg?react';
import TwitchIcon from '../../../assets/icons/twitch-brands-solid-full.svg?react';

const AUTH_ME_URL = '/api/auth/twitch/me';
const AUTH_LOGIN_URL = '/api/auth/twitch/login';
const AUTH_LOGOUT_URL = '/api/auth/twitch/logout';

export default function AuthButton() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const loadUser = async () => {
            try {
                const res = await fetch(AUTH_ME_URL, {
                    credentials: 'include',
                });

                if (!active) return;

                if (!res.ok) {
                    setUser(null);
                    return;
                }

                const data = await res.json();
                setUser(data.user ?? null);
            } catch {
                if (active) setUser(null);
            } finally {
                if (active) setLoading(false);
            }
        };

        loadUser();
        return () => {
            active = false;
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
                            await fetch(AUTH_LOGOUT_URL, {
                                method: 'POST',
                                credentials: 'include',
                            });
                        } finally {
                            setUser(null);
                            window.location.href = '/';
                        }
                    }}
                >
                    <LogoutIcon className="app-auth__icon app-auth__icon--logout" aria-hidden="true" focusable="false" />
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
                onClick={() => {
                    window.location.href = AUTH_LOGIN_URL;
                }}
            >
                <LoginIcon className="app-auth__icon app-auth__icon--login" aria-hidden="true" focusable="false" />
                Se connecter
                <TwitchIcon className="app-auth__icon app-auth__icon--twitch" aria-hidden="true" focusable="false" />
            </button>
        </div>
    );
}
