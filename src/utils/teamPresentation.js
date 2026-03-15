import { resolveJsonAsset } from './assetResolver';

const TEAM_LOGO_ASSET_PATHS = {
    alpine: '/src/assets/icons/2025alpinelogowhite.avif',
    'aston-martin': '/src/assets/icons/2025astonmartinlogowhite.avif',
    ferrari: '/src/assets/icons/2025ferrarilogowhite.avif',
    haas: '/src/assets/icons/2025haasf1teamlogowhite.avif',
    'kick-sauber': '/src/assets/icons/2025kicksauberlogowhite.avif',
    mclaren: '/src/assets/icons/2025mclarenlogowhite.avif',
    mercedes: '/src/assets/icons/2025mercedeslogowhite.avif',
    'racing-bulls': '/src/assets/icons/2025racingbullslogowhite.avif',
    'red-bull': '/src/assets/icons/2025redbullracinglogowhite.avif',
    williams: '/src/assets/icons/2025williamslogowhite.avif',
};

export function getTeamPresentation(team) {
    if (!team) {
        return {
            colorModifier: 'neutral',
            logoUrl: '',
        };
    }

    const colorModifier = String(team.colorKey ?? team.id ?? 'neutral')
        .trim()
        .toLowerCase();
    const logoUrl = resolveJsonAsset(TEAM_LOGO_ASSET_PATHS[team.logoKey] ?? '');

    return {
        colorModifier,
        logoUrl,
    };
}
