import './AdminPermissions.scss';
import { useEffect, useMemo, useState } from 'react';
import Title from '../../ui/Title/Title';
import {
    fetchAdminPermissions,
    setUserCapability,
} from '../../../utils/adminPermissionsApi';

const BASE_CAPABILITIES = ['calendar.write'];

function normalizeCapabilityId(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase();
}

function getCapabilityEnabled(user, capabilityId) {
    if (!Array.isArray(user.capabilities)) {
        return false;
    }

    const capability = user.capabilities.find(
        (item) => item.capabilityId === capabilityId,
    );

    return capability?.enabled === true;
}

function upsertCapability(user, capability) {
    const nextCapabilities = Array.isArray(user.capabilities)
        ? [...user.capabilities]
        : [];
    const index = nextCapabilities.findIndex(
        (item) => item.capabilityId === capability.capabilityId,
    );

    if (index >= 0) {
        nextCapabilities[index] = capability;
    } else {
        nextCapabilities.push(capability);
    }

    nextCapabilities.sort((a, b) =>
        a.capabilityId.localeCompare(b.capabilityId),
    );

    return {
        ...user,
        capabilities: nextCapabilities,
    };
}

export default function AdminPermissions() {
    const [users, setUsers] = useState([]);
    const [customCapabilities, setCustomCapabilities] = useState([]);
    const [newCapability, setNewCapability] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [savingCells, setSavingCells] = useState({});

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            setLoadError('');

            try {
                const data = await fetchAdminPermissions();
                if (!active) return;
                setUsers(Array.isArray(data.users) ? data.users : []);
            } catch (error) {
                if (!active) return;
                if (error.status === 403) {
                    setLoadError(
                        'Accès refusé. Section réservée au super-admin.',
                    );
                } else {
                    setLoadError(
                        "Chargement impossible. Vérifie l'authentification et réessaie.",
                    );
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        load();
        return () => {
            active = false;
        };
    }, []);

    const capabilityIds = useMemo(() => {
        const ids = new Set(BASE_CAPABILITIES);
        customCapabilities.forEach((id) => ids.add(id));
        users.forEach((user) => {
            (user.capabilities ?? []).forEach((capability) => {
                if (capability?.capabilityId) {
                    ids.add(capability.capabilityId);
                }
            });
        });

        return Array.from(ids).sort((a, b) => a.localeCompare(b));
    }, [users, customCapabilities]);

    const orderedUsers = useMemo(() => {
        return [...users].sort((a, b) =>
            (a.login || a.displayName || a.userId).localeCompare(
                b.login || b.displayName || b.userId,
            ),
        );
    }, [users]);

    function addCapabilityColumn() {
        const capabilityId = normalizeCapabilityId(newCapability);
        if (!capabilityId) {
            return;
        }

        setCustomCapabilities((current) =>
            current.includes(capabilityId)
                ? current
                : [...current, capabilityId].sort((a, b) => a.localeCompare(b)),
        );
        setNewCapability('');
    }

    async function toggleCapability(user, capabilityId, enabled) {
        const cellKey = `${user.userId}:${capabilityId}`;
        setSaveError('');
        setSavingCells((current) => ({ ...current, [cellKey]: true }));

        try {
            const result = await setUserCapability({
                targetUserId: user.userId,
                capabilityId,
                enabled,
            });

            setUsers((currentUsers) =>
                currentUsers.map((item) => {
                    if (item.userId !== user.userId) return item;
                    return upsertCapability(item, result.capability);
                }),
            );
        } catch (error) {
            setSaveError(error.message ?? 'Modification refusée');
        } finally {
            setSavingCells((current) => ({ ...current, [cellKey]: false }));
        }
    }

    return (
        <section className="app-section app-admin-permissions">
            <Title title="Admin - Permissions" />

            <div className="app-admin-permissions__content">
                {isLoading ? <p>Chargement des permissions...</p> : null}

                {!isLoading && loadError ? (
                    <p className="app-admin-permissions__message app-admin-permissions__message--error">
                        {loadError}
                    </p>
                ) : null}

                {!isLoading && !loadError ? (
                    <>
                        <div className="app-admin-permissions__toolbar">
                            <label
                                className="app-admin-permissions__toolbar-label"
                                htmlFor="new-capability"
                            >
                                Ajouter une capacité
                            </label>
                            <div className="app-admin-permissions__toolbar-row">
                                <input
                                    id="new-capability"
                                    className="app-admin-permissions__toolbar-input"
                                    type="text"
                                    placeholder="ex: results.write"
                                    value={newCapability}
                                    onChange={(event) =>
                                        setNewCapability(event.target.value)
                                    }
                                />
                                <button
                                    className="app-admin-permissions__toolbar-button"
                                    type="button"
                                    onClick={addCapabilityColumn}
                                >
                                    Ajouter
                                </button>
                            </div>
                        </div>

                        {saveError ? (
                            <p className="app-admin-permissions__message app-admin-permissions__message--error">
                                {saveError}
                            </p>
                        ) : null}

                        <div className="app-admin-permissions__table-wrap">
                            <table className="app-admin-permissions__table">
                                <thead>
                                    <tr>
                                        <th>Utilisateur</th>
                                        {capabilityIds.map((capabilityId) => (
                                            <th key={capabilityId}>
                                                {capabilityId}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderedUsers.map((user) => (
                                        <tr key={user.userId}>
                                            <td className="app-admin-permissions__user-cell">
                                                <div className="app-admin-permissions__user">
                                                    {user.profileImageUrl ? (
                                                        <img
                                                            className="app-admin-permissions__avatar"
                                                            src={
                                                                user.profileImageUrl
                                                            }
                                                            alt={`Avatar ${user.displayName || user.login}`}
                                                        />
                                                    ) : null}
                                                    <div className="app-admin-permissions__user-meta">
                                                        <span className="app-admin-permissions__user-name">
                                                            {user.displayName ||
                                                                user.login}
                                                        </span>
                                                        {user.isSuperAdmin ? (
                                                            <span className="app-admin-permissions__badge">
                                                                super-admin
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>

                                            {capabilityIds.map(
                                                (capabilityId) => {
                                                    const cellKey = `${user.userId}:${capabilityId}`;
                                                    const checked =
                                                        user.isSuperAdmin
                                                            ? true
                                                            : getCapabilityEnabled(
                                                                  user,
                                                                  capabilityId,
                                                              );
                                                    const disabled =
                                                        user.isSuperAdmin ||
                                                        savingCells[cellKey] ===
                                                            true;

                                                    return (
                                                        <td key={cellKey}>
                                                            <label className="app-admin-permissions__toggle">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        checked
                                                                    }
                                                                    disabled={
                                                                        disabled
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        toggleCapability(
                                                                            user,
                                                                            capabilityId,
                                                                            event
                                                                                .target
                                                                                .checked,
                                                                        )
                                                                    }
                                                                />
                                                            </label>
                                                        </td>
                                                    );
                                                },
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : null}
            </div>
        </section>
    );
}
