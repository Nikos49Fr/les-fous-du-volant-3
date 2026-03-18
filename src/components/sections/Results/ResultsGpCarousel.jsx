import './shared/table/ResultsTable.scss';
import AngleLeftIcon from '../../../assets/icons/angle-left-solid-full.svg?react';
import AngleRightIcon from '../../../assets/icons/angle-right-solid-full.svg?react';
import AnglesLeftIcon from '../../../assets/icons/angles-left-solid-full.svg?react';
import AnglesRightIcon from '../../../assets/icons/angles-right-solid-full.svg?react';

export default function ResultsGpCarousel({
    schedule,
    activeGpRound,
    onSelect,
}) {
    const canGoFirst = activeGpRound > 1;
    const canGoPrev = activeGpRound > 1;
    const canGoNext = activeGpRound < schedule.length;
    const canGoLast = activeGpRound < schedule.length;
    const activeGp = schedule.find((gp) => gp.id === activeGpRound) ?? null;

    return (
        <div className="app-results-carousel">
            <button
                className="app-results-carousel__nav"
                type="button"
                onClick={() => canGoFirst && onSelect(1)}
                disabled={!canGoFirst}
                aria-label="Premier Grand Prix"
            >
                <AnglesLeftIcon aria-hidden="true" focusable="false" />
            </button>

            <button
                className="app-results-carousel__nav"
                type="button"
                onClick={() => canGoPrev && onSelect(activeGpRound - 1)}
                disabled={!canGoPrev}
                aria-label="Grand Prix précédent"
            >
                <AngleLeftIcon aria-hidden="true" focusable="false" />
            </button>

            <div className="app-results-carousel__current" aria-live="polite">
                <div className="app-results-carousel__line app-results-carousel__line--top">
                    {activeGp?.flag ? (
                        <span className={`app-results-carousel__flag fi fi-${activeGp.flag}`} />
                    ) : null}
                    <span className="app-results-carousel__country">
                        {activeGp?.country || `GP ${activeGpRound}`}
                    </span>
                    {activeGp?.name ? (
                        <>
                            <span className="app-results-carousel__separator">-</span>
                            <span className="app-results-carousel__circuit">{activeGp.name}</span>
                        </>
                    ) : null}
                </div>
            </div>

            <button
                className="app-results-carousel__nav"
                type="button"
                onClick={() => canGoNext && onSelect(activeGpRound + 1)}
                disabled={!canGoNext}
                aria-label="Grand Prix suivant"
            >
                <AngleRightIcon aria-hidden="true" focusable="false" />
            </button>

            <button
                className="app-results-carousel__nav"
                type="button"
                onClick={() => canGoLast && onSelect(schedule.length)}
                disabled={!canGoLast}
                aria-label="Dernier Grand Prix"
            >
                <AnglesRightIcon aria-hidden="true" focusable="false" />
            </button>
        </div>
    );
}
