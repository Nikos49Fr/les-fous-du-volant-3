import './AuthButton.scss';
import { useEffect, useState } from 'react';

const AUTH_ME_URL = '/api/auth/twitch/me';
const AUTH_LOGIN_URL = '/api/auth/twitch/login';

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
                <img
                    className="app-auth__avatar"
                    src={user.profile_image_url}
                    alt={`Avatar ${user.display_name}`}
                />
                <span className="app-auth__name">{user.display_name}</span>
            </div>
        );
    }

    return (
        <div className="app-auth">
            <button
                className="app-auth__button"
                type="button"
                onClick={() => {
                    window.location.href = AUTH_LOGIN_URL;
                }}
            >
                Connexion
            </button>
        </div>
    );
}
