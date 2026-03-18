import './Flag.scss';
import { FLAG_ASSETS } from './flagAssets';

export default function Flag({
    code,
    className = '',
    alt = '',
    title,
    decorative = true,
}) {
    const src = FLAG_ASSETS[String(code ?? '').trim().toLowerCase()];
    if (!src) {
        return null;
    }

    return (
        <img
            className={['app-flag', className].filter(Boolean).join(' ')}
            src={src}
            alt={decorative ? '' : alt}
            title={title}
            aria-hidden={decorative ? 'true' : undefined}
        />
    );
}
