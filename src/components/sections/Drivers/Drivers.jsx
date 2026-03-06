import './Drivers.scss';
import Wip from '../../ui/Wip/Wip';
import Title from '../../ui/Title/Title';

export default function Drivers() {
    return (
        <section className="app-section app-drivers">
            <Title title="Pilotes & Staff" />
            <div className="app-drivers-content">
                <Wip />
            </div>
        </section>
    );
}
