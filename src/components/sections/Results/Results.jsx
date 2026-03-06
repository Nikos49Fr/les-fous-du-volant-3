import './Results.scss';
import Wip from '../../ui/Wip/Wip';
import Title from '../../ui/Title/Title';

export default function Results() {
  return (
    <section className="app-section app-results">
      <Title title="Classements et Résultats" />
      <Wip />
    </section>
  );
}
