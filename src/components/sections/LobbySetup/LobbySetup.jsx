import './LobbySetup.scss';
import Wip from '../../ui/Wip/Wip';
import Title from '../../ui/Title/Title';

export default function LobbySetup() {
  return (
    <section className="app-section app-lobby-setup">
      <Title title="Les réglages du lobby" />
      <Wip />
    </section>
  );
}
