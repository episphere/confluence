import { dataManagersInfo } from "../shared.js";

export const getTestDataManager = () => {
    const email = String(JSON.parse(localStorage.parms || "{}").login || "").toLowerCase();
    return dataManagersInfo.find(manager => manager.isTest && manager.email.toLowerCase() === email) || null;
};

export const renderTestDataManagerBanner = () => getTestDataManager() ? `
    <div class="alert alert-info">
        <strong>TEST data-manager mode</strong>
        <div>Current concepts are available for simulated approval in TEST. Decisions, notes, and uploads stay in your test workspace. These pages enforce data-manager permissions; your normal admin access remains available from the Admin menu.</div>
        <div class="d-flex flex-wrap gap-3 mt-2"><a href="#data_managers">Test requests</a><a href="#data_manager_study_access">Initiate and monitor test rounds</a><a href="#opt_in_out">Submit test study decisions</a></div>
    </div>` : "";
