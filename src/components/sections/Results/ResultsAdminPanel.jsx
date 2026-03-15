import './ResultsAdminPanel.scss';
import { useEffect, useMemo, useState } from 'react';
import ChevronDownIcon from '../../../assets/icons/chevron-down-solid-full.svg?react';
import FloppyDiskIcon from '../../../assets/icons/floppy-disk-regular-full.svg?react';
import PenToSquareIcon from '../../../assets/icons/pen-to-square-regular-full.svg?react';
import XmarkIcon from '../../../assets/icons/xmark-solid-full.svg?react';
import ResultsDeleteConfirmModal from './ResultsDeleteConfirmModal';
import ResultsSessionEditor from './ResultsSessionEditor';
import { deleteResultsGp, saveResultsSession } from '../../../utils/resultsApi';
import {
    buildEditorPayload,
    createEditorState,
    getLastStartedGpRound,
    getResultsSessionLabel,
    RESULTS_SESSION_TYPES,
} from '../../../utils/resultsHelpers';

export default function ResultsAdminPanel({
    drivers,
    schedule,
    sessionsByRound,
    onSessionSaved,
    onGpDeleted,
}) {
    const [selectedGpRound, setSelectedGpRound] = useState(() =>
        getLastStartedGpRound(),
    );
    const [activeSessionType, setActiveSessionType] = useState('sprint_qualifying');
    const [isOptionListOpen, setIsOptionListOpen] = useState(false);
    const [draftsBySessionType, setDraftsBySessionType] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        if (!schedule.length) return;

        setSelectedGpRound((current) => {
            const currentExists = schedule.some((gp) => gp.id === current);
            return currentExists ? current : getLastStartedGpRound();
        });
    }, [schedule]);

    useEffect(() => {
        const roundSessions = sessionsByRound[selectedGpRound] ?? {};
        const nextDrafts = {};

        RESULTS_SESSION_TYPES.forEach((sessionType) => {
            nextDrafts[sessionType] = createEditorState(
                drivers,
                roundSessions[sessionType],
            );
        });

        setDraftsBySessionType(nextDrafts);
        setSaveError('');
    }, [drivers, selectedGpRound, sessionsByRound]);

    const selectedGp = useMemo(
        () => schedule.find((gp) => gp.id === selectedGpRound) ?? schedule[0],
        [schedule, selectedGpRound],
    );

    const activeDraft = useMemo(
        () => draftsBySessionType[activeSessionType] ?? createEditorState(drivers),
        [activeSessionType, draftsBySessionType, drivers],
    );

    async function handleSave() {
        setIsSaving(true);
        setSaveError('');

        try {
            const payload = buildEditorPayload(drivers, activeDraft);
            const savedSession = await saveResultsSession({
                gpRound: selectedGpRound,
                sessionType: activeSessionType,
                entries: payload,
                fastestLapDriverId: activeDraft.fastestLapDriverId,
            });
            onSessionSaved(savedSession);
            setDraftsBySessionType((current) => ({
                ...current,
                [activeSessionType]: createEditorState(drivers, savedSession),
            }));
        } catch (error) {
            setSaveError(error.message ?? 'Sauvegarde impossible');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteGp() {
        setIsDeleting(true);
        setSaveError('');

        try {
            await deleteResultsGp(selectedGpRound);
            onGpDeleted?.(selectedGpRound);

            const roundSessions = {};
            const nextDrafts = {};

            RESULTS_SESSION_TYPES.forEach((sessionType) => {
                nextDrafts[sessionType] = createEditorState(
                    drivers,
                    roundSessions[sessionType],
                );
            });

            setDraftsBySessionType(nextDrafts);
            setIsDeleteModalOpen(false);
        } catch (error) {
            setSaveError(error.message ?? 'Suppression impossible');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className="app-results-panel">
            <div className="app-results-panel__tabs" role="tablist" aria-label="Saisie des résultats">
                <div className="app-results-panel__tabs-main">
                    {RESULTS_SESSION_TYPES.map((sessionType) => (
                        <button
                            key={sessionType}
                            className={`app-results-panel__tab${
                                activeSessionType === sessionType
                                    ? ' app-results-panel__tab--active'
                                    : ''
                            }`}
                            type="button"
                            role="tab"
                            aria-selected={activeSessionType === sessionType}
                            onClick={() => setActiveSessionType(sessionType)}
                        >
                            {getResultsSessionLabel(sessionType)}
                        </button>
                    ))}
                </div>

                <div className="app-results-panel__select">
                    <button
                        className="app-results-panel__select-trigger"
                        type="button"
                        onClick={() => setIsOptionListOpen((open) => !open)}
                        aria-haspopup="listbox"
                        aria-expanded={isOptionListOpen}
                    >
                        <span className="app-results-panel__select-trigger-content">
                            <span className="app-results-panel__select-trigger-main">
                                {selectedGp?.flag ? (
                                    <span
                                        className={`app-results-panel__select-flag fi fi-${selectedGp.flag}`}
                                    />
                                ) : null}
                                <span className="app-results-panel__select-label">
                                    {selectedGp?.country || `GP ${selectedGpRound}`}
                                </span>
                            </span>
                            <ChevronDownIcon
                                className="app-results-panel__select-chevron"
                                aria-hidden="true"
                                focusable="false"
                            />
                        </span>
                    </button>

                    {isOptionListOpen ? (
                        <ul className="app-results-panel__select-menu" role="listbox">
                            {schedule.map((gp) => (
                                <li key={gp.id}>
                                    <button
                                        className={`app-results-panel__select-option${
                                            gp.id === selectedGpRound
                                                ? ' app-results-panel__select-option--active'
                                                : ''
                                        }`}
                                        type="button"
                                        onClick={() => {
                                            setSelectedGpRound(gp.id);
                                            setIsOptionListOpen(false);
                                        }}
                                    >
                                        {gp.flag ? (
                                            <span
                                                className={`app-results-panel__select-flag fi fi-${gp.flag}`}
                                            />
                                        ) : null}
                                        <span className="app-results-panel__select-label">
                                            {gp.country || `GP ${gp.id}`}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                <button
                    className="app-results-panel__tab app-results-panel__tab--action app-results-panel__tab--danger"
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    disabled={isSaving || isDeleting}
                    aria-label="Effacer les résultats du GP"
                >
                    <span>Effacer</span>
                    <XmarkIcon aria-hidden="true" focusable="false" />
                </button>

                <button
                    className="app-results-panel__tab app-results-panel__tab--action"
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || isDeleting}
                    aria-label="Sauvegarder la session"
                >
                    <span>Sauvegarder</span>
                    <FloppyDiskIcon aria-hidden="true" focusable="false" />
                </button>
            </div>

            <div className="app-results-panel__content">
                <ResultsSessionEditor
                    drivers={drivers}
                    editorState={activeDraft}
                    onChange={(nextDraft) =>
                        setDraftsBySessionType((current) => ({
                            ...current,
                            [activeSessionType]: nextDraft,
                        }))
                    }
                    sessionType={activeSessionType}
                />
            </div>

            {saveError ? <p className="app-results-panel__error">{saveError}</p> : null}

            {isDeleteModalOpen ? (
                <ResultsDeleteConfirmModal
                    gp={selectedGp}
                    isDeleting={isDeleting}
                    onCancel={() => !isDeleting && setIsDeleteModalOpen(false)}
                    onConfirm={handleDeleteGp}
                />
            ) : null}
        </div>
    );
}

export function ResultsAdminTabTrigger({ onClick, isActive = false }) {
    return (
        <button
            className={`app-results__tab app-results__tab--edit${
                isActive ? ' app-results__tab--active' : ''
            }`}
            type="button"
            onClick={onClick}
            aria-label="Saisir les résultats"
        >
            <span>Saisir les résultats</span>
            <PenToSquareIcon aria-hidden="true" focusable="false" />
        </button>
    );
}
