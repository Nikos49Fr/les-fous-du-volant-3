import './Wip.scss';
import wipScene from '../../../assets/images/wip/wip_scene.webp';

export default function Wip() {
    return (
        <div className="app-wip">
            <p className="app-wip__text">🚧 Page en cours de construction 🚧 <br />
            Nous travaillons dur pour que cette section soit prête rapidement afin de vous offir la meilleure expérience.</p>
            <div className="app-wip__media-content">
                <img
                    className="app-wip__image"
                    src={wipScene}
                    alt="Personnage en train de travailler"
                />
            </div>
            <p className="app-wip__text"><em>Hommage à nos 2 organisateurs <strong>RandyComicsFr</strong> et <strong>Lord_Viserion</strong></em></p>
        </div>
    );
}
