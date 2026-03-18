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

const TEAM_CAR_ASSET_PATHS = {
    alpine: '/src/assets/images/cars/alpine.webp',
    'aston-martin': '/src/assets/images/cars/aston-martin.webp',
    ferrari: '/src/assets/images/cars/ferrari.webp',
    haas: '/src/assets/images/cars/haas.webp',
    'kick-sauber': '/src/assets/images/cars/kick-sauber.webp',
    mclaren: '/src/assets/images/cars/mclaren.webp',
    mercedes: '/src/assets/images/cars/mercedes.webp',
    'red-bull': '/src/assets/images/cars/red-bull.webp',
    williams: '/src/assets/images/cars/williams.webp',
};

export function getTeamPresentation(team) {
    if (!team) {
        return {
            colorModifier: 'neutral',
            logoUrl: '',
            carUrl: '',
        };
    }

    const colorModifier = String(team.colorKey ?? team.id ?? 'neutral')
        .trim()
        .toLowerCase();
    const logoUrl = resolveJsonAsset(TEAM_LOGO_ASSET_PATHS[team.logoKey] ?? '');
    const carUrl = resolveJsonAsset(TEAM_CAR_ASSET_PATHS[colorModifier] ?? '');

    return {
        colorModifier,
        logoUrl,
        carUrl,
    };
}
