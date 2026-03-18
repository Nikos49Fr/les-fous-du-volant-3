const DRIVER_PROFILE_IMAGES = import.meta.glob(
    '../assets/images/profils/*.webp',
    {
        eager: true,
        import: 'default',
    },
);

export const DRIVER_PROFILE_IMAGE_BY_ID = Object.fromEntries(
    Object.entries(DRIVER_PROFILE_IMAGES).map(([path, url]) => [
        path.split('/').pop().replace('.webp', ''),
        url,
    ]),
);
