import CircleQuestionIcon from '../../../../assets/icons/circle-question-solid-full.svg?react';
import './MultiTwitchAudioInfoTooltip.scss';

export default function MultiTwitchAudioInfoTooltip() {
    return (
        <div className="app-multi-twitch__audio-tooltip">
            <button
                className="app-multi-twitch__audio-tooltip-trigger"
                type="button"
                aria-label="Aide sur les contrôles audio"
            >
                <CircleQuestionIcon aria-hidden="true" focusable="false" />
            </button>
            <div className="app-multi-twitch__audio-tooltip-bubble" role="tooltip">
                <p>Fonctionnalité exclusive pour les Fous du volant.</p>
                <p>
                    Le master volume te permet de régler le volume du live principal que
                    tu veux écouter. En sélectionnant une des POV en dessous, le son sera
                    réglé automatiquement à cette valeur, et toutes les autres à 1%.
                </p>
                <p>
                    Tu peux aussi mute ou restore (unmute) toutes les POV d'un seul clic.
                </p>
                <p>
                    Tu peux toujours régler le volume individuellement de chaque live
                    directement sur la POV, ou dans la barre de titre de chaque POV.
                </p>
                <p className="app-multi-twitch__audio-tooltip-question">
                    Pourquoi 1% et pas 0 ?
                </p>
                <p>
                    Twitch prend en compte ta vue uniquement si le son n'est pas à 0, et
                    que tu lâches un petit message de temps en temps. Alors soutiens les
                    streameurs qui t'offrent ce spectacle en gardant le son à 1% minimum
                    et en faisant un petit coucou dans chaque tchat.
                </p>
            </div>
        </div>
    );
}
