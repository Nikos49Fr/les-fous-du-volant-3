import './ResultsTable.scss';
import ChevronLeftIcon from '../../../assets/icons/chevron-down-solid-full.svg?react';
import ChevronRightIcon from '../../../assets/icons/chevron-up-solid-full.svg?react';

export default function ResultsGpCarousel({
    schedule,
    activeGpRound,
    onSelect,
}) {
    const canGoPrev = activeGpRound > 1;
    const canGoNext = activeGpRound < schedule.length;

    return (
        <div className="app-results-carousel">
            <button
                className="app-results-carousel__nav app-results-carousel__nav--prev"
                type="button"
                onClick={() => canGoPrev && onSelect(activeGpRound - 1)}
                disabled={!canGoPrev}
                aria-label="Grand Prix précédent"
            >
                <ChevronLeftIcon aria-hidden="true" focusable="false" />
            </button>

            <div className="app-results-carousel__track">
                {schedule.map((gp) => (
                    <button
                        key={gp.id}
                        className={`app-results-carousel__item${
                            gp.id === activeGpRound
                                ? ' app-results-carousel__item--active'
                                : ''
                        }`}
                        type="button"
                        onClick={() => onSelect(gp.id)}
                    >
                        {gp.flag ? (
                            <span
                                className={`app-results-carousel__flag fi fi-${gp.flag}`}
                            />
                        ) : null}
                        <span className="app-results-carousel__label">
                            {gp.country || `GP ${gp.id}`}
                        </span>
                    </button>
                ))}
            </div>

            <button
                className="app-results-carousel__nav app-results-carousel__nav--next"
                type="button"
                onClick={() => canGoNext && onSelect(activeGpRound + 1)}
                disabled={!canGoNext}
                aria-label="Grand Prix suivant"
            >
                <ChevronRightIcon aria-hidden="true" focusable="false" />
            </button>
        </div>
    );
}
