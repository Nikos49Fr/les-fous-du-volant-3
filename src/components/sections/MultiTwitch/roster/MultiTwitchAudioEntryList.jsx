import './MultiTwitchAudioEntryList.scss';

export default function MultiTwitchAudioEntryList({
    entries,
    selectedEntryId,
    onSelectEntry,
    disabled,
}) {
    if (entries.length === 0) {
        return null;
    }

    return (
        <div className="app-multi-twitch__audio-entry-list" role="radiogroup">
            {entries.map((entry) => {
                const isChecked = entry.id === selectedEntryId;

                return (
                    <label
                        key={entry.id}
                        className={`app-multi-twitch__audio-entry-option${
                            isChecked
                                ? ' app-multi-twitch__audio-entry-option--selected'
                                : ''
                        }`}
                    >
                        <input
                            className="app-multi-twitch__audio-entry-radio"
                            type="radio"
                            name="multi-twitch-master-entry"
                            checked={isChecked}
                            disabled={disabled}
                            onChange={() => onSelectEntry(entry.id)}
                        />
                        <span
                            className="app-multi-twitch__audio-entry-radio-mark"
                            aria-hidden="true"
                        />
                        <span className="app-multi-twitch__audio-entry-name">
                            {entry.displayName}
                        </span>
                    </label>
                );
            })}
        </div>
    );
}
