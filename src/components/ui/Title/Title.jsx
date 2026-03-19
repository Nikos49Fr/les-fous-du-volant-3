import './Title.scss';

export default function Title({ title }) {
    return (
        <div className="app-title">
            <div className="app-title__inner">
                <h2 className="app-title__content">{title}</h2>
            </div>
        </div>
    );
}
