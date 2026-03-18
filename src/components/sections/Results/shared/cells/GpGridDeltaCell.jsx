import ChevronDownIcon from '../../../../../assets/icons/chevron-down-solid-full.svg?react';
import ChevronUpIcon from '../../../../../assets/icons/chevron-up-solid-full.svg?react';
import MinusIcon from '../../../../../assets/icons/minus-solid-full.svg?react';
import { getGridDelta } from '../../../../../utils/resultsHelpers';

export default function GpGridDeltaCell({ qualifyingEntry, resultEntry }) {
    if (qualifyingEntry?.position != null) {
        if (resultEntry?.position != null) {
            const delta = getGridDelta(resultEntry.position, qualifyingEntry.position);
            const DeltaIcon =
                delta.direction === 'up'
                    ? ChevronUpIcon
                    : delta.direction === 'down'
                      ? ChevronDownIcon
                      : MinusIcon;

            return (
                <span className={`app-results__grid app-results__grid--${delta.direction}`}>
                    <DeltaIcon aria-hidden="true" focusable="false" />
                    {delta.direction !== 'flat' ? (
                        <span>{delta.direction === 'up' ? `+${delta.value}` : `-${delta.value}`}</span>
                    ) : null}
                </span>
            );
        }

        return <span className="app-results__muted">({qualifyingEntry.position})</span>;
    }

    return null;
}
