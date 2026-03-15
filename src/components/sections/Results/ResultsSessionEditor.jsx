import './ResultsSessionEditor.scss';
import { useMemo, useState } from 'react';
import GripIcon from '../../../assets/icons/grip-vertical-solid-full.svg?react';
import StopwatchIcon from '../../../assets/icons/stopwatch-solid-full.svg?react';
import { getTeamPresentation } from '../../../utils/teamPresentation';
import {
    RESULTS_STATUS_DISPLAY_ORDER,
    RESULTS_STATUS_OPTIONS,
    sessionSupportsFastestLap,
} from '../../../utils/resultsHelpers';

const STATUS_HELPERS = {
    DNS: 'Did Not Start. Ex. : Déconnexion avant le début de session',
    DNF: 'Did Not Finish. Ex. : accident, crash PC ou déconnexion pendant la session',
    DSQ: "Disqualifié. n'a pas été autorisé à participer à la session.",
    ABS: 'Absent. Indisponible pour la session.',
};

export default function ResultsSessionEditor({
    drivers,
    editorState,
    onChange,
    sessionType,
}) {
    const [draggingDriverId, setDraggingDriverId] = useState(null);
    const driverById = useMemo(
        () => new Map(drivers.map((driver) => [driver.id, driver])),
        [drivers],
    );
    const supportsFastestLap = sessionSupportsFastestLap(sessionType);

    const classifiedDrivers = editorState.classifiedDriverIds
        .map((driverId) => driverById.get(driverId))
        .filter(Boolean);

    const statusGroups = RESULTS_STATUS_DISPLAY_ORDER.map((status) => ({
        status,
        drivers: drivers.filter(
            (driver) => editorState.statusByDriverId[driver.id] === status,
        ),
    })).filter((group) => group.drivers.length > 0);

    function updateStatus(driverId, nextStatus) {
        const currentStatus = editorState.statusByDriverId[driverId] ?? null;
        const normalizedStatus = currentStatus === nextStatus ? null : nextStatus;
        const nextState = {
            ...editorState,
            classifiedDriverIds: [...editorState.classifiedDriverIds],
            statusByDriverId: { ...editorState.statusByDriverId },
            fastestLapDriverId:
                editorState.fastestLapDriverId === driverId && normalizedStatus
                    ? null
                    : editorState.fastestLapDriverId,
        };

        if (normalizedStatus) {
            nextState.classifiedDriverIds = nextState.classifiedDriverIds.filter(
                (id) => id !== driverId,
            );
            nextState.statusByDriverId[driverId] = normalizedStatus;
        } else {
            delete nextState.statusByDriverId[driverId];
            if (!nextState.classifiedDriverIds.includes(driverId)) {
                nextState.classifiedDriverIds.push(driverId);
            }
        }

        onChange(nextState);
    }

    function updateFastestLap(driverId) {
        if (!supportsFastestLap) return;
        if (editorState.statusByDriverId[driverId]) return;

        onChange({
            ...editorState,
            fastestLapDriverId:
                editorState.fastestLapDriverId === driverId ? null : driverId,
        });
    }

    function handleDrop(targetDriverId) {
        if (!draggingDriverId || draggingDriverId === targetDriverId) {
            return;
        }

        const currentIndex = editorState.classifiedDriverIds.indexOf(
            draggingDriverId,
        );
        const targetIndex = editorState.classifiedDriverIds.indexOf(targetDriverId);
        if (currentIndex < 0 || targetIndex < 0) {
            return;
        }

        const nextDriverIds = [...editorState.classifiedDriverIds];
        nextDriverIds.splice(currentIndex, 1);
        nextDriverIds.splice(targetIndex, 0, draggingDriverId);

        onChange({
            ...editorState,
            classifiedDriverIds: nextDriverIds,
        });
    }

    function renderDriverRow(driver, positionLabel, draggable = false) {
        const teamPresentation = getTeamPresentation(driver.team);
        const currentStatus = editorState.statusByDriverId[driver.id] ?? null;
        const isFastestLap = editorState.fastestLapDriverId === driver.id;
        const fastestLapDisabled = !!currentStatus || !supportsFastestLap;

        const rowContent = (
            <div
                className={`app-results-session-editor__driver-row app-results-session-editor__driver-row--team-${teamPresentation.colorModifier}${
                    draggable ? '' : ' app-results-session-editor__driver-row--status'
                }`}
                draggable={draggable}
                onDragStart={() => draggable && setDraggingDriverId(driver.id)}
                onDragEnd={() => setDraggingDriverId(null)}
                onDragOver={(event) => draggable && event.preventDefault()}
                onDrop={() => draggable && handleDrop(driver.id)}
            >
                <span className="app-results-session-editor__driver-grip">
                    <GripIcon aria-hidden="true" focusable="false" />
                </span>
                <span className="app-results-session-editor__driver-main">
                    {supportsFastestLap && draggable ? (
                        <button
                            className={`app-results-session-editor__fastest-lap${
                                isFastestLap
                                    ? ' app-results-session-editor__fastest-lap--active'
                                    : ''
                            }`}
                            type="button"
                            onClick={() => updateFastestLap(driver.id)}
                            disabled={fastestLapDisabled}
                            aria-label={`Meilleur tour ${driver.displayName}`}
                        >
                            <StopwatchIcon aria-hidden="true" focusable="false" />
                        </button>
                    ) : null}
                    {teamPresentation.logoUrl ? (
                        <span
                            className={`app-results-session-editor__driver-logo-pill app-results-session-editor__driver-logo-pill--team-${teamPresentation.colorModifier}`}
                        >
                            <img
                                className="app-results-session-editor__driver-logo"
                                src={teamPresentation.logoUrl}
                                alt={driver.team.name}
                            />
                        </span>
                    ) : null}
                    <span className="app-results-session-editor__driver-name">
                        {driver.displayName}
                    </span>
                </span>
                <div className="app-results-session-editor__driver-statuses">
                    {RESULTS_STATUS_OPTIONS.map((status) => (
                        <button
                            key={status}
                            className={`app-results-session-editor__status-toggle${
                                currentStatus === status
                                    ? ' app-results-session-editor__status-toggle--active'
                                    : ''
                            }`}
                            type="button"
                            onClick={() => updateStatus(driver.id, status)}
                            title={STATUS_HELPERS[status]}
                            aria-label={`${status}. ${STATUS_HELPERS[status]}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>
        );

        if (!draggable) {
            return <div key={driver.id}>{rowContent}</div>;
        }

        return (
            <div key={driver.id} className="app-results-session-editor__row-shell">
                <span className="app-results-session-editor__row-label">{positionLabel}</span>
                {rowContent}
            </div>
        );
    }

    return (
        <div className="app-results-session-editor">
            <div className="app-results-session-editor__panels">
                <section className="app-results-session-editor__panel">
                    <div className="app-results-session-editor__panel-header">
                        <h4 className="app-results-session-editor__panel-title">
                            Pilotes classés
                        </h4>
                    </div>

                    <div className="app-results-session-editor__section">
                        {classifiedDrivers.map((driver, index) =>
                            renderDriverRow(driver, index + 1, true),
                        )}
                    </div>
                </section>

                <section className="app-results-session-editor__panel app-results-session-editor__panel--statuses">
                    <div className="app-results-session-editor__panel-header">
                        <h4 className="app-results-session-editor__panel-title">
                            Pilotes non classés
                        </h4>
                    </div>

                    {statusGroups.length > 0 ? (
                        <div className="app-results-session-editor__statuses-wrap">
                            {statusGroups.map((group) => (
                                <div
                                    key={group.status}
                                    className="app-results-session-editor__status-group"
                                >
                                    <h4 className="app-results-session-editor__status-group-title">
                                        <span>{group.status}</span>
                                        <span className="app-results-session-editor__status-group-help">
                                            {STATUS_HELPERS[group.status]}
                                        </span>
                                    </h4>
                                    <div className="app-results-session-editor__section">
                                        {group.drivers.map((driver) =>
                                            renderDriverRow(driver, '', false),
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="app-results-session-editor__empty">
                            Aucun pilote avec statut pour le moment.
                        </p>
                    )}
                </section>
            </div>
        </div>
    );
}
