const assetModules = import.meta.glob('/src/assets/**/*', {
    eager: true,
    import: 'default',
});

export const resolveJsonAsset = (assetPath) => {
    if (!assetPath) {
        return '';
    }
    const cleaned = assetPath.replace(/^\/+/, '');
    const withLeadingSlash = `/${cleaned}`;
    return assetModules[assetPath] ?? assetModules[withLeadingSlash] ?? '';
};
