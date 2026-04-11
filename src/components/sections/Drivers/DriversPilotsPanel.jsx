import './DriversPilotsPanel.scss';
import DriverProfileCard from './DriverProfileCard';

export default function DriversPilotsPanel({
    activeDrivers,
    inactiveDrivers,
    isLoading,
    loadError,
}) {
    if (isLoading) {
        return <p>Chargement des pilotes...</p>;
    }

    if (loadError) {
        return <p>{loadError}</p>;
    }

    return (
        <div className="app-drivers-pilots">
            <section className="app-drivers-pilots__section">
                <div className="app-drivers-pilots__list">
                    {activeDrivers.map((driver) => (
                        <DriverProfileCard
                            key={driver.id}
                            driver={driver}
                        />
                    ))}
                </div>
            </section>

            {inactiveDrivers.length > 0 ? (
                <section className="app-drivers-pilots__section">
                    <h2 className="app-drivers-pilots__title">
                        Pilotes ayant quitté le tournoi :
                    </h2>
                    <div className="app-drivers-pilots__list">
                        {inactiveDrivers.map((driver) => (
                            <DriverProfileCard
                                key={driver.id}
                                driver={driver}
                                retired
                            />
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
