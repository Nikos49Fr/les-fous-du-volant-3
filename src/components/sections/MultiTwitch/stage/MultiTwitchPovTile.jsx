import GripIcon from '../../../../assets/icons/grip-vertical-solid-full.svg?react';
import VolumeControl from '../../../ui/VolumeControl/VolumeControl.jsx';
import TwitchPlayerEmbed from '../../../ui/TwitchPlayerEmbed/TwitchPlayerEmbed.jsx';
import './MultiTwitchPovTile.scss';

export default function MultiTwitchPovTile({
    entry,
    entryVolume,
    onEntryVolumeChange,
    onToggleEntryMute,
    slotIndex,
    totalCount,
    isDragging,
    isDragOver,
    onDragStart,
    onDragEnter,
    onDragEnd,
    onDrop,
}) {
    function handleDragStart(event) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', entry.id);
        onDragStart?.(entry.id);
    }

    return (
        <article
            className={`app-multi-twitch__pov-tile${
                isDragging ? ' app-multi-twitch__pov-tile--dragging' : ''
            }${
                isDragOver ? ' app-multi-twitch__pov-tile--drag-over' : ''
            }${
                totalCount === 3 && slotIndex === 2
                    ? ' app-multi-twitch__pov-tile--slot-3-last'
                    : ''
            }${
                totalCount === 5 && slotIndex === 3
                    ? ' app-multi-twitch__pov-tile--slot-5-fourth'
                    : ''
            }${
                totalCount === 5 && slotIndex === 4
                    ? ' app-multi-twitch__pov-tile--slot-5-fifth'
                    : ''
            }`}
            style={{ order: slotIndex }}
            onDragEnter={() => onDragEnter?.(entry.id)}
            onDragOver={(event) => event.preventDefault()}
            onDragEnd={() => onDragEnd?.()}
            onDrop={() => onDrop?.(entry.id)}
        >
            <header className="app-multi-twitch__pov-header">
                <span
                    className="app-multi-twitch__pov-drag-handle"
                    draggable
                    onDragStart={handleDragStart}
                    aria-label={`Déplacer ${entry.displayName}`}
                    title={`Déplacer ${entry.displayName}`}
                >
                    <GripIcon aria-hidden="true" focusable="false" />
                </span>
                <span className="app-multi-twitch__pov-title">
                    {entry.displayName}
                </span>
                <div className="app-multi-twitch__pov-volume">
                    <VolumeControl
                        value={entryVolume}
                        onChange={(nextVolume) =>
                            onEntryVolumeChange(entry.id, nextVolume)
                        }
                        onToggleMute={() => onToggleEntryMute(entry.id)}
                        ariaLabel={`Volume ${entry.displayName}`}
                        className="app-multi-twitch__pov-volume-control"
                    />
                </div>
            </header>
            <div className="app-multi-twitch__pov-body">
                <div className="app-multi-twitch__pov-body-frame">
                    <TwitchPlayerEmbed
                        channel={entry.activeTwitchLogin || entry.twitchLogin}
                        title={entry.displayName}
                        entryId={entry.id}
                        volumePercent={entryVolume}
                    />
                </div>
            </div>
        </article>
    );
}
