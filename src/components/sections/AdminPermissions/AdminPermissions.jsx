import './AdminPermissions.scss';
import { useEffect, useMemo, useState } from 'react';
import Title from '../../ui/Title/Title';
import AdminCapabilitiesPanel from './AdminCapabilitiesPanel';
import AdminDriverLinksPanel from './AdminDriverLinksPanel';
import {
    fetchAdminPermissions,
    linkDriverToUser,
    setUserCapability,
} from '../../../utils/adminPermissionsApi';

const BASE_CAPABILITIES = [
    'calendar.write',
    'multi_twitch.test_channels.view',
    'results.write',
];
const ADMIN_TAB_CAPABILITIES = 'capabilities';
const ADMIN_TAB_DRIVERS = 'drivers';

function normalizeCapabilityId(value) {
    return String(value ?? '')
        .trim()
        .toLowerCase();
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
    const [drivers, setDrivers] = useState([]);
    const [customCapabilities, setCustomCapabilities] = useState([]);
    const [newCapability, setNewCapability] = useState('');
    const [activeTab, setActiveTab] = useState(ADMIN_TAB_CAPABILITIES);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saveError, setSaveError] = useState('');
    const [linkError, setLinkError] = useState('');
    const [savingCells, setSavingCells] = useState({});
    const [linkingDriverId, setLinkingDriverId] = useState('');

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            setLoadError('');

            try {
                const data = await fetchAdminPermissions();
                if (!active) return;
                setUsers(Array.isArray(data.users) ? data.users : []);
                setDrivers(Array.isArray(data.drivers) ? data.drivers : []);
            } catch (error) {
                if (!active) return;
                if (error.status === 403) {
                    setLoadError('Accès refusé. Section réservée.');
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

    const orderedDrivers = useMemo(() => {
        return [...drivers].sort((a, b) =>
            a.displayName.localeCompare(b.displayName),
        );
    }, [drivers]);

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

    async function handleLinkDriver(driverId, linkedUserId) {
        setLinkError('');
        setLinkingDriverId(driverId);

        try {
            const result = await linkDriverToUser({ driverId, linkedUserId });

            setDrivers((currentDrivers) =>
                currentDrivers.map((driver) =>
                    driver.driverId === driverId
                        ? {
                              ...driver,
                              linkedUserId: result.linkedUserId,
                              linkedUserDisplayName: result.linkedUserDisplayName,
                          }
                        : driver,
                ),
            );
        } catch (error) {
            setLinkError(error.message ?? 'Liaison impossible');
        } finally {
            setLinkingDriverId('');
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
                        <div className="app-admin-permissions__tabs">
                            <button
                                className={`app-admin-permissions__tab${
                                    activeTab === ADMIN_TAB_CAPABILITIES
                                        ? ' app-admin-permissions__tab--active'
                                        : ''
                                }`}
                                type="button"
                                onClick={() => setActiveTab(ADMIN_TAB_CAPABILITIES)}
                            >
                                Permissions
                            </button>
                            <button
                                className={`app-admin-permissions__tab${
                                    activeTab === ADMIN_TAB_DRIVERS
                                        ? ' app-admin-permissions__tab--active'
                                        : ''
                                }`}
                                type="button"
                                onClick={() => setActiveTab(ADMIN_TAB_DRIVERS)}
                            >
                                Lier un pilote au profil Twitch
                            </button>
                        </div>

                        <div className="app-admin-permissions__panel">
                            {activeTab === ADMIN_TAB_CAPABILITIES ? (
                                <AdminCapabilitiesPanel
                                    users={orderedUsers}
                                    capabilityIds={capabilityIds}
                                    newCapability={newCapability}
                                    saveError={saveError}
                                    savingCells={savingCells}
                                    onCapabilityInputChange={setNewCapability}
                                    onAddCapability={addCapabilityColumn}
                                    onToggleCapability={toggleCapability}
                                />
                            ) : (
                                <AdminDriverLinksPanel
                                    drivers={orderedDrivers}
                                    users={orderedUsers}
                                    linkError={linkError}
                                    linkingDriverId={linkingDriverId}
                                    onLinkDriver={handleLinkDriver}
                                />
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </section>
    );
}
