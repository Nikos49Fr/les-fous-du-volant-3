import './AdminPermissions.scss';
import { useEffect, useState } from 'react';
import LinkIcon from '../../../assets/icons/link-solid-full.svg?react';
import LinkSlashIcon from '../../../assets/icons/link-slash-solid-full.svg?react';

function buildSelectOptions(users) {
    return [
        { value: '', label: 'Aucun profil lié' },
        ...users.map((user) => ({
            value: user.userId,
            label: user.displayName || user.login || user.userId,
        })),
    ];
}

export default function AdminDriverLinksPanel({
    drivers,
    users,
    linkError,
    linkingDriverId,
    onLinkDriver,
}) {
    const [selectedByDriverId, setSelectedByDriverId] = useState({});
    const options = buildSelectOptions(users);

    useEffect(() => {
        setSelectedByDriverId(
            Object.fromEntries(
                drivers.map((driver) => [driver.driverId, driver.linkedUserId ?? '']),
            ),
        );
    }, [drivers]);

    function getSelectedUserId(driver) {
        return selectedByDriverId[driver.driverId] ?? driver.linkedUserId ?? '';
    }

    async function handleAction(driver) {
        if (driver.linkedUserId) {
            await onLinkDriver(driver.driverId, null);
            return;
        }

        const nextLinkedUserId = getSelectedUserId(driver) || null;
        if (!nextLinkedUserId) {
            return;
        }

        await onLinkDriver(driver.driverId, nextLinkedUserId);
    }

    return (
        <div className="app-admin-permissions__table-wrap">
            <table className="app-admin-permissions__table app-admin-permissions__table--drivers">
                <thead>
                    <tr>
                        <th>Pilote</th>
                        <th>Profil Twitch lié</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {drivers.map((driver) => {
                        const isLinked = !!driver.linkedUserId;
                        const selectedUserId = getSelectedUserId(driver);
                        const isPendingLink = !isLinked && !!selectedUserId;
                        const actionClassName = isLinked
                            ? 'app-admin-permissions__link-action app-admin-permissions__link-action--unlink'
                            : isPendingLink
                              ? 'app-admin-permissions__link-action app-admin-permissions__link-action--link-ready'
                              : 'app-admin-permissions__link-action app-admin-permissions__link-action--link-idle';

                        return (
                            <tr key={driver.driverId}>
                                <td className="app-admin-permissions__driver-cell">
                                    <div className="app-admin-permissions__driver-meta">
                                        <span className="app-admin-permissions__driver-name">
                                            {driver.displayName}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <select
                                        className="app-admin-permissions__select"
                                        value={selectedUserId}
                                        onChange={(event) =>
                                            setSelectedByDriverId((current) => ({
                                                ...current,
                                                [driver.driverId]: event.target.value,
                                            }))
                                        }
                                        disabled={linkingDriverId === driver.driverId}
                                    >
                                        {options.map((option) => (
                                            <option key={option.value || 'none'} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <button
                                        className={actionClassName}
                                        type="button"
                                        onClick={() => handleAction(driver)}
                                        disabled={
                                            linkingDriverId === driver.driverId ||
                                            (!isLinked && !selectedUserId)
                                        }
                                        aria-label={
                                            isLinked
                                                ? `Délier ${driver.displayName}`
                                                : `Lier ${driver.displayName}`
                                        }
                                    >
                                        {isLinked ? (
                                            <LinkSlashIcon aria-hidden="true" focusable="false" />
                                        ) : (
                                            <LinkIcon aria-hidden="true" focusable="false" />
                                        )}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {linkError ? (
                <p className="app-admin-permissions__message app-admin-permissions__message--error">
                    {linkError}
                </p>
            ) : null}
        </div>
    );
}
