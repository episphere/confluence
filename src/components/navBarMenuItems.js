export const template = () => {
    return `

        <div class="nav-item grid-elements dropdown">
            <a class="nav-link nav-menu-links dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fas fa-database"></i> Data</a>
            <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                <a class="dropdown-item nav-link nav-menu-links" href="#data_exploration" title="Data Exploration" id="dataSummary" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <i class="fas fa-chart-bar"></i> Data Exploration
                </a>
                <a class="dropdown-item nav-link nav-menu-links" href="#data_submission" title="Data Submission" id="dataSubmission"> 
                    <i class="fas fa-upload"></i> Data Submission
                </a>
                <div id="myProjectsNav"></div>
                <a class="dropdown-item nav-link nav-menu-links" href="#data_analysis" title="Data Analysis" id="dataAnalysis"><i class="fas fa-database"></i> Data Analysis</a>
                <a class="dropdown-item nav-link nav-menu-links" href="#data_request" title="Data Request" id="dataRequest"><i class="fas fa-database"></i> Data Request</a>
            </div>
        </div>
        <div id="governanceNav"></div>
        <div class="nav-item grid-elements">
            <a class="nav-link nav-menu-links" title="Confluence Tutorials" id="platformTutorial"><i class="fas fa-file-video"></i> Tutorials</a>
        </div>
        <div class="navbar-nav ml-auto">
            ${localStorage.parms && JSON.parse(localStorage.parms).name ? `
                <div class="nav-item grid-elements dropdown">
                    <a class="nav-link nav-menu-links dropdown-toggle"  title="Welcome, ${JSON.parse(localStorage.parms).name}!" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <i class="fas fa-user"></i> ${JSON.parse(localStorage.parms).name}
                    </a>
                    <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item nav-link nav-menu-links" href="#logout" id="logOutBtn"><i class="fas fa-sign-out-alt"></i> Log Out</a>
                    </div>
                </div>
            ` : `
                <div class="nav-item grid-elements">
                    <a class="nav-link nav-menu-links" title="Log Out" href="#logout" id="logOutBtn"><i class="fas fa-sign-out-alt"></i> Log Out</a>
                </div>
            `}
            
        </div>
    `;
};