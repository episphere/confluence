const template = () => {
    return `
        <div class="grid-border"></div>
        <div class="nav-item grid-elements">
            <a class="nav-link nav-menu-links" href="#" title="Data Exploration" id="dataSummary"><i class="fas fa-chart-bar"></i> Data Exploration</a>
        </div>
        <div class="grid-border"></div>
        <div class="nav-item grid-elements">
            <a class="nav-link nav-menu-links" href="#" title="Data Submission"  id="dataSubmission"><i class="fas fa-upload"></i> Data Submission</a>
        </div>
        <div class="grid-border"></div>
        <div class="nav-item pages-coming-soon grid-elements">
            <a class="nav-link nav-menu-links" href="#" title="Data Governance"  id="dataGovernance"><i class="fas fa-database"></i> Data Governance</a>
        </div>
        <div class="grid-border"></div>
        <div class="nav-item pages-coming-soon grid-elements">
            <a class="nav-link nav-menu-links" href="#" title="Data Request"  id="dataRequest"><i class="fas fa-database"></i> Data Request</a>
        </div>
        <div class="grid-border"></div>
        <div class="nav-item pages-coming-soon grid-elements">
            <a class="nav-link nav-menu-links" href="#" title="Data Analysis"  id="dataAnalysis"><i class="fas fa-database"></i> Data Analysis</a>
        </div>
        <div class="grid-border"></div>
    `;
}

export default template;