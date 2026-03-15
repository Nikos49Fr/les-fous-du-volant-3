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

        return (
            <div
                key={driver.id}
                className={`app-results-session-editor__driver-row app-results-session-editor__driver-row--team-${teamPresentation.colorModifier}`}
                draggable={draggable}
                onDragStart={() => draggable && setDraggingDriverId(driver.id)}
                onDragEnd={() => setDraggingDriverId(null)}
                onDragOver={(event) => draggable && event.preventDefault()}
                onDrop={() => draggable && handleDrop(driver.id)}
            >
                <span className="app-results-session-editor__driver-grip">
                    <GripIcon aria-hidden="true" focusable="false" />
                </span>
                <span className="app-results-session-editor__driver-position">
                    {positionLabel}
                </span>
                <span className="app-results-session-editor__driver-number">
                    {driver.racingNumber}
                </span>
                <span className="app-results-session-editor__driver-main">
                    {teamPresentation.logoUrl ? (
                        <img
                            className="app-results-session-editor__driver-logo"
                            src={teamPresentation.logoUrl}
                            alt={driver.team.name}
                        />
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
                        >
                            {status}
                        </button>
                    ))}
                </div>
                {supportsFastestLap ? (
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
            </div>
        );
    }

    return (
        <div className="app-results-session-editor">
            <div className="app-results-session-editor__header">
                <span>POS.</span>
                <span>NO.</span>
                <span>DRIVER</span>
                <span>STATUT</span>
                {supportsFastestLap ? <span>MT</span> : null}
            </div>

            <div className="app-results-session-editor__section">
                {classifiedDrivers.map((driver, index) =>
                    renderDriverRow(driver, index + 1, true),
                )}
            </div>

            {statusGroups.length > 0 ? (
                <div className="app-results-session-editor__statuses-wrap">
                    {statusGroups.map((group) => (
                        <div
                            key={group.status}
                            className="app-results-session-editor__status-group"
                        >
                            <h4 className="app-results-session-editor__status-group-title">
                                {group.status}
                            </h4>
                            <div className="app-results-session-editor__section">
                                {group.drivers.map((driver) =>
                                    renderDriverRow(driver, group.status, false),
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
