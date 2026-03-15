import './Calendar.scss';
import { useEffect, useMemo, useState } from 'react';
import { GP_NAMES } from '../../../data/dataGP';
import { getGpSchedule } from '../../../utils/gpHelpers';
import {
    fetchCalendarData,
    updateRevealedGpIds,
} from '../../../utils/calendarApi';
import Title from '../../ui/Title/Title';

const GP_OPTIONS = [
    { id: 0, country: '', flag: '', name: 'Circuit non révélé' },
    ...GP_NAMES.filter((gp) => gp.id > 0).map((gp) => {
        return {
            id: gp.id,
            country: gp.country,
            flag: gp.flag,
            name: gp.name,
        };
    }),
];

export default function Calendar() {
    const [revealedIds, setRevealedIds] = useState(null);
    const [canEdit, setCanEdit] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [selectedGpId, setSelectedGpId] = useState(0);
    const [isOptionListOpen, setIsOptionListOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        let active = true;

        const loadRevealed = async () => {
            try {
                const data = await fetchCalendarData();
                if (active) {
                    setRevealedIds(data.revealed);
                    setCanEdit(data.canEdit);
                    setHasError(false);
                }
            } catch {
                if (active) {
                    setHasError(true);
                }
            }
        };

        loadRevealed();
        return () => {
            active = false;
        };
    }, []);

    const schedule = useMemo(() => {
        if (!revealedIds) return [];
        return getGpSchedule(revealedIds);
    }, [revealedIds]);

    function openModal(index) {
        if (!revealedIds || !canEdit) return;
        setEditingIndex(index);
        setSelectedGpId(revealedIds[index] ?? 0);
        setIsOptionListOpen(false);
        setSaveError('');
    }

    function closeModal() {
        setEditingIndex(null);
        setSelectedGpId(0);
        setIsOptionListOpen(false);
        setSaveError('');
    }

    function handleBackdropMouseDown(event) {
        if (event.target === event.currentTarget) {
            closeModal();
        }
    }

    async function saveCurrentSlot() {
        if (editingIndex === null || !revealedIds) return;

        setIsSaving(true);
        setSaveError('');

        try {
            const next = [...revealedIds];
            next[editingIndex] = selectedGpId;
            const updated = await updateRevealedGpIds(next);
            setRevealedIds(updated);
            closeModal();
        } catch (error) {
            setSaveError(error.message ?? 'Sauvegarde impossible');
        } finally {
            setIsSaving(false);
        }
    }

    const selectedOption = useMemo(() => {
        return (
            GP_OPTIONS.find((option) => option.id === selectedGpId) ??
            GP_OPTIONS[0]
        );
    }, [selectedGpId]);

    return (
        <section className="app-section app-calendar">
            <Title title="Calendrier des Grands Prix" />
            <div className="app-calendar-content">
                <p>
                    Chaque circuit sera révélé à la fin du circuit précédent,
                    par une énigme à résoudre.
                </p>
                <p>
                    Voici les dates des Grands Prix pour la saison 3 des Fous
                    du Volant :
                </p>
                {hasError ? (
                    <p>Données calendrier indisponibles pour le moment.</p>
                ) : null}
                <ol className="app-calendar__gp-list">
                    {schedule.map((gp, index) => (
                        <li
                            className={`app-calendar__gp-item${
                                canEdit ? '' : ' app-calendar__gp-item--readonly'
                            }`}
                            key={gp.id}
                        >
                            {canEdit ? (
                                <span className="app-calendar__gp-item-edit-slot">
                                    <button
                                        className="app-calendar__edit-trigger"
                                        type="button"
                                        onClick={() => openModal(index)}
                                        aria-label={`Éditer le GP ${gp.id}`}
                                    >
                                        <span className="app-calendar__edit-trigger-icon" />
                                    </button>
                                </span>
                            ) : null}

                            <span className="app-calendar__gp-item-number">
                                {gp.id}
                            </span>
                            <span className="app-calendar__gp-item-country">
                                {gp.isKnown ? (
                                    <span className="app-calendar__gp-item-country-name">
                                        {gp.country}
                                    </span>
                                ) : null}
                                {gp.isKnown && gp.flag ? (
                                    <span
                                        className={`app-calendar__gp-item-flag fi fi-${gp.flag}`}
                                    />
                                ) : null}
                            </span>
                            <span
                                className={`app-calendar__gp-item-name${
                                    gp.isKnown
                                        ? ''
                                        : ' app-calendar__gp-item-name--unknown'
                                }`}
                            >
                                {gp.isKnown
                                    ? gp.name
                                    : 'Circuit révélé à la fin du précédent GP'}
                            </span>
                            <time
                                className="app-calendar__gp-item-date"
                                dateTime={gp.startDateTime}
                            >
                                <span className="app-calendar__gp-item-date-part">
                                    {gp.startLabel}
                                </span>
                            </time>
                        </li>
                    ))}
                </ol>
            </div>

            {editingIndex !== null ? (
                <div
                    className="app-calendar__modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    onMouseDown={handleBackdropMouseDown}
                >
                    <div className="app-calendar__modal">
                        <button
                            className="app-calendar__modal-close"
                            type="button"
                            onClick={closeModal}
                            aria-label="Fermer"
                        >
                            <span className="app-calendar__modal-close-icon" />
                        </button>

                        <div className="app-calendar__modal-row">
                            <div className="app-calendar__modal-select">
                                <button
                                    className="app-calendar__modal-select-trigger"
                                    type="button"
                                    onClick={() =>
                                        setIsOptionListOpen((open) => !open)
                                    }
                                    aria-haspopup="listbox"
                                    aria-expanded={isOptionListOpen}
                                >
                                    <span className="app-calendar__modal-select-trigger-content">
                                        {selectedOption.id > 0 ? (
                                            <span
                                                className={`app-calendar__modal-select-flag fi fi-${selectedOption.flag}`}
                                            />
                                        ) : null}
                                        <span className="app-calendar__modal-select-label">
                                            {selectedOption.id > 0
                                                ? `${selectedOption.country} - ${selectedOption.name}`
                                                : selectedOption.name}
                                        </span>
                                    </span>
                                </button>

                                {isOptionListOpen ? (
                                    <ul
                                        className="app-calendar__modal-select-menu"
                                        role="listbox"
                                    >
                                        {GP_OPTIONS.map((option) => (
                                            <li key={option.id}>
                                                <button
                                                    className={`app-calendar__modal-select-option${
                                                        selectedGpId === option.id
                                                            ? ' app-calendar__modal-select-option--active'
                                                            : ''
                                                    }`}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={selectedGpId === option.id}
                                                    onClick={() => {
                                                        setSelectedGpId(option.id);
                                                        setIsOptionListOpen(false);
                                                    }}
                                                >
                                                    {option.id > 0 ? (
                                                        <span
                                                            className={`app-calendar__modal-select-flag fi fi-${option.flag}`}
                                                        />
                                                    ) : null}
                                                    <span className="app-calendar__modal-select-label">
                                                        {option.id > 0
                                                            ? `${option.country} - ${option.name}`
                                                            : option.name}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>

                            <button
                                className="app-calendar__modal-save"
                                type="button"
                                onClick={saveCurrentSlot}
                                disabled={isSaving}
                                aria-label="Sauvegarder"
                            >
                                <span className="app-calendar__modal-save-icon" />
                            </button>
                        </div>

                        {saveError ? (
                            <p className="app-calendar__modal-error">{saveError}</p>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </section>
    );
}
