import { ResultsAdminTabTrigger } from '../ResultsAdminPanel';

export default function ResultsTabs({ activeTab, tournamentTab, gpTab, adminTab, canEdit, onTabChange }) {
    return (
        <div className="app-results__tabs">
            <div className="app-results__tabs-main">
                <button
                    className={`app-results__tab${activeTab === tournamentTab ? ' app-results__tab--active' : ''}`}
                    type="button"
                    onClick={() => onTabChange(tournamentTab)}
                >
                    Tournoi
                </button>
                <button
                    className={`app-results__tab${activeTab === gpTab ? ' app-results__tab--active' : ''}`}
                    type="button"
                    onClick={() => onTabChange(gpTab)}
                >
                    Par course
                </button>
            </div>
            {canEdit ? (
                <ResultsAdminTabTrigger
                    isActive={activeTab === adminTab}
                    onClick={() => onTabChange(adminTab)}
                />
            ) : null}
        </div>
    );
}
