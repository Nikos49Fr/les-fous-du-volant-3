import { useEffect, useMemo, useState } from 'react';
import './AdminDriversPanel.scss';
import {
    buildDefaultDriverDraft,
    buildDriverDraftFromRow,
    buildSuggestedDriverId,
} from '../../../utils/adminPermissionsApi';
import { getDriverLifecycleLabel } from '../../../utils/driverAvailability';

export default function AdminDriversPanel({
    drivers,
    teams,
    gpSchedule,
    saveError,
    isSaving,
    onCreateDriver,
    onUpdateDriver,
}) {
    const [selectedDriverId, setSelectedDriverId] = useState('');
    const [draft, setDraft] = useState(() => buildDefaultDriverDraft());
    const [isCreating, setIsCreating] = useState(false);
    const [driverIdTouched, setDriverIdTouched] = useState(false);

    const selectedDriver = useMemo(
        () => drivers.find((driver) => driver.driverId === selectedDriverId) ?? null,
        [drivers, selectedDriverId],
    );
    const gpOptions = useMemo(
        () =>
            (gpSchedule ?? []).map((gp) => ({
                value: gp.id,
                label: `${gp.id}. ${gp.country}`,
            })),
        [gpSchedule],
    );
    const abandonmentGpOptions = useMemo(
        () =>
            gpOptions.filter(
                (gp) => Number(gp.value) >= Number(draft.activeFromGpRound ?? 1),
            ),
        [draft.activeFromGpRound, gpOptions],
    );

    useEffect(() => {
        if (drivers.length === 0) {
            setSelectedDriverId('');
            setDraft(buildDefaultDriverDraft());
            setIsCreating(true);
            return;
        }

        if (isCreating) {
            return;
        }

        if (!selectedDriverId || !selectedDriver) {
            const nextSelectedDriver = drivers[0];
            setSelectedDriverId(nextSelectedDriver.driverId);
            setDraft(buildDriverDraftFromRow(nextSelectedDriver));
            setDriverIdTouched(true);
            return;
        }

        setDraft(buildDriverDraftFromRow(selectedDriver));
        setDriverIdTouched(true);
    }, [drivers, isCreating, selectedDriver, selectedDriverId]);

    useEffect(() => {
        if (!isCreating || driverIdTouched) {
            return;
        }

        setDraft((current) => ({
            ...current,
            driverId: buildSuggestedDriverId(current.displayName),
        }));
    }, [draft.displayName, driverIdTouched, isCreating]);

    function handleCreateClick() {
        setIsCreating(true);
        setSelectedDriverId('');
        setDraft(buildDefaultDriverDraft());
        setDriverIdTouched(false);
    }

    function handleSelectDriver(driver) {
        setIsCreating(false);
        setSelectedDriverId(driver.driverId);
        setDraft(buildDriverDraftFromRow(driver));
        setDriverIdTouched(true);
    }

    function updateDraft(patch) {
        setDraft((current) => ({ ...current, ...patch }));
    }

    async function handleSave() {
        if (isCreating) {
            const createdDriver = await onCreateDriver(draft);
            setIsCreating(false);
            setSelectedDriverId(createdDriver.driverId);
            setDraft(buildDriverDraftFromRow(createdDriver));
            setDriverIdTouched(true);
            return;
        }

        const savedDriver = await onUpdateDriver(draft);
        setDraft(buildDriverDraftFromRow(savedDriver));
    }

    return (
        <div className="app-admin-drivers">
            <div className="app-admin-drivers__list">
                <div className="app-admin-drivers__list-toolbar">
                    <button
                        className="app-admin-drivers__action"
                        type="button"
                        onClick={handleCreateClick}
                    >
                        Nouveau pilote
                    </button>
                </div>

                <div className="app-admin-drivers__table-wrap">
                    <table className="app-admin-drivers__table">
                        <thead>
                            <tr>
                                <th>Pilote</th>
                                <th>Écurie</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map((driver) => (
                                <tr
                                    key={driver.driverId}
                                    className={
                                        !isCreating &&
                                        driver.driverId === selectedDriverId
                                            ? 'app-admin-drivers__row app-admin-drivers__row--active'
                                            : 'app-admin-drivers__row'
                                    }
                                    onClick={() => handleSelectDriver(driver)}
                                >
                                    <td>
                                        <div className="app-admin-drivers__driver-name-wrap">
                                            <span className="app-admin-drivers__driver-name">
                                                {driver.displayName}
                                            </span>
                                            <span className="app-admin-drivers__driver-meta">
                                                #{driver.racingNumber}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{driver.teamName || '—'}</td>
                                    <td>{getDriverLifecycleLabel(driver.status)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="app-admin-drivers__editor">
                <div className="app-admin-drivers__editor-header">
                    <h3>
                        {isCreating
                            ? 'Créer un pilote'
                            : `Modifier ${selectedDriver?.displayName ?? 'le pilote'}`}
                    </h3>
                    <button
                        className="app-admin-drivers__action"
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>

                <div className="app-admin-drivers__form-grid">
                    <label className="app-admin-drivers__field">
                        <span>Nom affiché</span>
                        <input
                            type="text"
                            value={draft.displayName}
                            onChange={(event) =>
                                updateDraft({ displayName: event.target.value })
                            }
                        />
                    </label>

                    <label className="app-admin-drivers__field">
                        <span>Identifiant technique</span>
                        <input
                            type="text"
                            value={draft.driverId}
                            disabled={!isCreating}
                            onChange={(event) => {
                                setDriverIdTouched(true);
                                updateDraft({
                                    driverId: event.target.value
                                        .trim()
                                        .toLowerCase(),
                                });
                            }}
                        />
                    </label>

                    <label className="app-admin-drivers__field">
                        <span>Numéro</span>
                        <input
                            type="text"
                            value={draft.racingNumber}
                            onChange={(event) =>
                                updateDraft({ racingNumber: event.target.value })
                            }
                        />
                    </label>

                    <label className="app-admin-drivers__field">
                        <span>Écurie actuelle</span>
                        <select
                            value={draft.teamId}
                            onChange={(event) =>
                                updateDraft({ teamId: event.target.value })
                            }
                        >
                            <option value="">Choisir</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="app-admin-drivers__field">
                        <span>Statut</span>
                        <select
                            value={draft.status}
                            onChange={(event) => {
                                const nextStatus = event.target.value;
                                updateDraft({
                                    status: nextStatus,
                                    abandonedAfterGpRound:
                                        nextStatus === 'abandoned'
                                            ? draft.abandonedAfterGpRound
                                            : null,
                                });
                            }}
                        >
                            <option value="draft">Brouillon</option>
                            <option value="active">Actif</option>
                            <option value="abandoned">Abandon</option>
                        </select>
                    </label>

                    <label className="app-admin-drivers__field">
                        <span>Premier GP disponible</span>
                        <select
                            value={draft.activeFromGpRound}
                            onChange={(event) => {
                                const nextActiveFromGpRound = Number(
                                    event.target.value,
                                );
                                updateDraft({
                                    activeFromGpRound: nextActiveFromGpRound,
                                    abandonedAfterGpRound:
                                        draft.abandonedAfterGpRound != null &&
                                        draft.abandonedAfterGpRound <
                                            nextActiveFromGpRound
                                            ? null
                                            : draft.abandonedAfterGpRound,
                                });
                            }}
                        >
                            {gpOptions.map((gp) => (
                                <option key={gp.value} value={gp.value}>
                                    {gp.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="app-admin-drivers__field">
                        <span>A abandonné après ce GP</span>
                        <select
                            value={draft.abandonedAfterGpRound ?? ''}
                            disabled={draft.status !== 'abandoned'}
                            onChange={(event) =>
                                updateDraft({
                                    abandonedAfterGpRound: event.target.value
                                        ? Number(event.target.value)
                                        : null,
                                })
                            }
                        >
                            <option value="">Choisir</option>
                            {abandonmentGpOptions.map((gp) => (
                                <option key={gp.value} value={gp.value}>
                                    {gp.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="app-admin-drivers__field app-admin-drivers__field--full">
                        <span>Bio</span>
                        <textarea
                            rows="5"
                            value={draft.bio}
                            onChange={(event) =>
                                updateDraft({ bio: event.target.value })
                            }
                        />
                    </label>

                    <label className="app-admin-drivers__checkbox">
                        <input
                            type="checkbox"
                            checked={draft.isStreamer === true}
                            onChange={(event) =>
                                updateDraft({ isStreamer: event.target.checked })
                            }
                        />
                        <span>Streameur</span>
                    </label>
                </div>

                {saveError ? (
                    <p className="app-admin-drivers__error">{saveError}</p>
                ) : null}
            </div>
        </div>
    );
}
