import './Title.scss';

export default function Title({ title, subtitle }) {
    return (
        <div className="app-title">
            <span className="app-title__slash" aria-hidden="true" />
            <span className="app-title__slash" aria-hidden="true" />
            <h2 className="app-title__content">{title}</h2>
            <span className="app-title__slash" aria-hidden="true" />
            <span className="app-title__slash" aria-hidden="true" />
            {subtitle ? (
                <>
                    <h3 className="app-title__content">{subtitle}</h3>
                    <span className="app-title__slash" aria-hidden="true" />
                    <span className="app-title__slash" aria-hidden="true" />
                </>
            ) : null}
        </div>
    );
}
