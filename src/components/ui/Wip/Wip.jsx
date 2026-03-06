import './Wip.scss';
import wipRandyAtWork from '../../../assets/images/wip/wip_randy_at_work.webp';
import wipRandyVariant from '../../../assets/images/wip/wip_randy_variant.webp';
import wipRandyEndWork from '../../../assets/images/wip/wip_randy_end_work.webp';

export default function Wip() {
    return (
        <div className="app-wip">
            <p className="app-wip__text">Page en cours de construction</p>
            {/* <img
                className="app-wip__image"
                src={wipRandyAtWork}
                alt="Personnage en train de travailler"
            /> */}
            <img
                className="app-wip__image"
                src={wipRandyVariant}
                alt="Personnage en train de travailler, variante"
            />
            {/* <img
                className="app-wip__image"
                src={wipRandyEndWork}
                alt="Personnage en train de travailler"
            /> */}
            <p className="app-wip__text">Randy variant "at work"</p>
        </div>
    );
}
