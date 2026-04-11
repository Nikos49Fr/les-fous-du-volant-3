export const DRIVER_STATUS_DRAFT = 'draft';
export const DRIVER_STATUS_ACTIVE = 'active';
export const DRIVER_STATUS_ABANDONED = 'abandoned';

export const DRIVER_STATUS_OPTIONS = [
    DRIVER_STATUS_DRAFT,
    DRIVER_STATUS_ACTIVE,
    DRIVER_STATUS_ABANDONED,
];

export function normalizeDriverStatus(value) {
    const normalizedValue = String(value ?? '')
        .trim()
        .toLowerCase();

    if (DRIVER_STATUS_OPTIONS.includes(normalizedValue)) {
        return normalizedValue;
    }

    return DRIVER_STATUS_ACTIVE;
}

export function normalizeDriverGpRound(value, fallbackValue = 1) {
    const parsedValue = Number.parseInt(value, 10);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
        return fallbackValue;
    }

    return parsedValue;
}

export function isDriverDraft(driver) {
    return normalizeDriverStatus(driver?.status) === DRIVER_STATUS_DRAFT;
}

export function isDriverAvailableForGp(driver, gpRound) {
    if (!driver || !Number.isInteger(gpRound) || gpRound < 1) {
        return false;
    }

    const status = normalizeDriverStatus(driver.status);
    if (status === DRIVER_STATUS_DRAFT) {
        return false;
    }

    const activeFromGpRound = normalizeDriverGpRound(driver.activeFromGpRound, 1);
    if (gpRound < activeFromGpRound) {
        return false;
    }

    const abandonedAfterGpRound = Number.isInteger(driver.abandonedAfterGpRound)
        ? driver.abandonedAfterGpRound
        : normalizeDriverGpRound(driver.abandonedAfterGpRound, null);

    if (
        status === DRIVER_STATUS_ABANDONED &&
        Number.isInteger(abandonedAfterGpRound) &&
        gpRound > abandonedAfterGpRound
    ) {
        return false;
    }

    return true;
}

export function isDriverPubliclyVisible(driver, currentGpRound, driverHasResults) {
    if (!driver) {
        return false;
    }

    if (isDriverDraft(driver)) {
        return false;
    }

    if (driverHasResults) {
        return true;
    }

    const activeFromGpRound = normalizeDriverGpRound(driver.activeFromGpRound, 1);
    return currentGpRound >= activeFromGpRound;
}

export function getDriverLifecycleLabel(status) {
    switch (normalizeDriverStatus(status)) {
        case DRIVER_STATUS_DRAFT:
            return 'Brouillon';
        case DRIVER_STATUS_ABANDONED:
            return 'Abandon';
        case DRIVER_STATUS_ACTIVE:
        default:
            return 'Actif';
    }
}
