const SUPER_ADMIN_CONFIGURABLE_CAPABILITY = 'multi_twitch.test_channels.view';

﻿function getCapabilityEnabled(user, capabilityId) {
    if (!Array.isArray(user.capabilities)) {
        return false;
    }

    const capability = user.capabilities.find(
        (item) => item.capabilityId === capabilityId,
    );

    return capability?.enabled === true;
}

export default function AdminCapabilitiesPanel({
    users,
    capabilityIds,
    newCapability,
    saveError,
    savingCells,
    onCapabilityInputChange,
    onAddCapability,
    onToggleCapability,
}) {
    return (
        <>
            <div className="app-admin-permissions__toolbar">
                <label
                    className="app-admin-permissions__toolbar-label"
                    htmlFor="new-capability"
                >
                    Ajouter une permission
                </label>
                <div className="app-admin-permissions__toolbar-row">
                    <input
                        id="new-capability"
                        className="app-admin-permissions__toolbar-input"
                        type="text"
                        placeholder="ex: results.write"
                        value={newCapability}
                        onChange={(event) =>
                            onCapabilityInputChange(event.target.value)
                        }
                    />
                    <button
                        className="app-admin-permissions__toolbar-button"
                        type="button"
                        onClick={onAddCapability}
                    >
                        Ajouter
                    </button>
                </div>
            </div>

            {saveError ? (
                <p className="app-admin-permissions__message app-admin-permissions__message--error">
                    {saveError}
                </p>
            ) : null}

            <div className="app-admin-permissions__table-wrap">
                <table className="app-admin-permissions__table">
                    <thead>
                        <tr>
                            <th>Utilisateur</th>
                            {capabilityIds.map((capabilityId) => (
                                <th key={capabilityId}>{capabilityId}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.userId}>
                                <td className="app-admin-permissions__user-cell">
                                    <div className="app-admin-permissions__user">
                                        {user.profileImageUrl ? (
                                            <img
                                                className="app-admin-permissions__avatar"
                                                src={user.profileImageUrl}
                                                alt={`Avatar ${user.displayName || user.login}`}
                                            />
                                        ) : null}
                                        <div className="app-admin-permissions__user-meta">
                                            <span className="app-admin-permissions__user-name">
                                                {user.displayName || user.login}
                                            </span>
                                            {user.isSuperAdmin ? (
                                                <span className="app-admin-permissions__badge">
                                                    super-admin
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </td>

                                {capabilityIds.map((capabilityId) => {
                                    const cellKey = `${user.userId}:${capabilityId}`;
                                    const isSuperAdminCapabilityOverride =
                                        user.isSuperAdmin &&
                                        capabilityId ===
                                            SUPER_ADMIN_CONFIGURABLE_CAPABILITY;
                                    const checked =
                                        user.isSuperAdmin &&
                                        !isSuperAdminCapabilityOverride
                                            ? true
                                            : getCapabilityEnabled(
                                                  user,
                                                  capabilityId,
                                              );
                                    const disabled =
                                        (user.isSuperAdmin &&
                                            !isSuperAdminCapabilityOverride) ||
                                        savingCells[cellKey] === true;

                                    return (
                                        <td key={cellKey}>
                                            <label className="app-admin-permissions__toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={disabled}
                                                    onChange={(event) =>
                                                        onToggleCapability(
                                                            user,
                                                            capabilityId,
                                                            event.target.checked,
                                                        )
                                                    }
                                                />
                                            </label>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
