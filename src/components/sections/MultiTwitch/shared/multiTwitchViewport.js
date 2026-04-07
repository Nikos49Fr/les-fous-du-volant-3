export const MULTI_TWITCH_VIEWPORT_BREAKPOINTS = {
    single: 560,
    quad: 769,
    hexa: 1024,
};

export function getMultiTwitchViewportMaxPov(viewportWidth) {
    if (viewportWidth < MULTI_TWITCH_VIEWPORT_BREAKPOINTS.single) {
        return 1;
    }

    if (viewportWidth < MULTI_TWITCH_VIEWPORT_BREAKPOINTS.quad) {
        return 2;
    }

    if (viewportWidth < MULTI_TWITCH_VIEWPORT_BREAKPOINTS.hexa) {
        return 4;
    }

    return 6;
}
