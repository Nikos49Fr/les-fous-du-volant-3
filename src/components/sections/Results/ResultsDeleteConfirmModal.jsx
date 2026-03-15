import './ResultsDeleteConfirmModal.scss';
import { useEffect, useRef, useState } from 'react';

const HOLD_DURATION_MS = 2500;

export default function ResultsDeleteConfirmModal({
    gp,
    isDeleting = false,
    onCancel,
    onConfirm,
}) {
    const frameRef = useRef(null);
    const holdStartRef = useRef(null);
    const didConfirmRef = useRef(false);
    const previousDeletingRef = useRef(isDeleting);
    const [holdProgress, setHoldProgress] = useState(0);
    const [isHolding, setIsHolding] = useState(false);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    useEffect(() => {
        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (previousDeletingRef.current && !isDeleting) {
            resetHold();
        }

        previousDeletingRef.current = isDeleting;
    }, [isDeleting]);

    function resetHold() {
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
        holdStartRef.current = null;
        didConfirmRef.current = false;
        setIsHolding(false);
        setHoldProgress(0);
    }

    function stepHold(timestamp) {
        if (!holdStartRef.current) {
            holdStartRef.current = timestamp;
        }

        const elapsed = timestamp - holdStartRef.current;
        const progress = Math.min(elapsed / HOLD_DURATION_MS, 1);
        setHoldProgress(progress);

        if (progress >= 1) {
            frameRef.current = null;
            setIsHolding(false);
            didConfirmRef.current = true;
            onConfirm();
            return;
        }

        frameRef.current = requestAnimationFrame(stepHold);
    }

    function startHold() {
        if (isDeleting || isHolding) {
            return;
        }

        didConfirmRef.current = false;
        holdStartRef.current = null;
        setIsHolding(true);
        setHoldProgress(0);
        frameRef.current = requestAnimationFrame(stepHold);
    }

    function stopHold() {
        if (didConfirmRef.current || isDeleting) {
            return;
        }

        resetHold();
    }

    return (
        <div
            className="app-results-delete-modal"
            role="presentation"
            onClick={onCancel}
        >
            <div
                className="app-results-delete-modal__dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="results-delete-modal-title"
                onClick={(event) => event.stopPropagation()}
            >
                <h3
                    id="results-delete-modal-title"
                    className="app-results-delete-modal__title"
                >
                    ATTENTION ! Êtes-vous sûr de vouloir effacer les résultats du GP{' '}
                    {gp?.flag ? (
                        <span
                            className={`app-results-delete-modal__flag fi fi-${gp.flag}`}
                        />
                    ) : null}
                    <span>{gp?.country ?? ''}</span> ?
                </h3>

                <p className="app-results-delete-modal__message">
                    Cette action supprimera toutes les qualifications et courses
                    enregistrées pour ce Grand Prix.
                </p>

                <p className="app-results-delete-modal__hint">
                    Maintenez le bouton Oui pendant 2,5 secondes pour confirmer.
                </p>

                <div className="app-results-delete-modal__actions">
                    <button
                        className="app-results-delete-modal__button app-results-delete-modal__button--cancel"
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                    >
                        Non
                    </button>
                    <button
                        className={`app-results-delete-modal__button app-results-delete-modal__button--confirm${
                            isHolding || holdProgress > 0
                                ? ' app-results-delete-modal__button--confirm-holding'
                                : ''
                        }`}
                        type="button"
                        disabled={isDeleting}
                        style={{ '--hold-progress': holdProgress }}
                        onPointerDown={startHold}
                        onPointerUp={stopHold}
                        onPointerLeave={stopHold}
                        onPointerCancel={stopHold}
                        onBlur={stopHold}
                    >
                        <span>Oui</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
