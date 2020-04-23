export const template = () => {
    return `
        <div class="grid-elements dropdown">
            <button class="nav-link nav-menu-links dropdown-toggle dropdown-btn" title="Confluence" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="fas fa-home"></i> Confluence
            </button>
            <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                <a class="dropdown-item nav-link nav-menu-links" href="#home" id="homePage"> Home</a>
                <a class="dropdown-item nav-link nav-menu-links" href="#about" id="aboutConfluence"> About</a>
                <a class="dropdown-item nav-link nav-menu-links" href="#resources" id="resourcesConfluence"> Resources</a>
                <a class="dropdown-item nav-link nav-menu-links" href="#contact" id="contactConfluence"> Contact</a>
            </div>
        </div>
        <div class="grid-elements dropdown">
            <button class="nav-link nav-menu-links dropdown-toggle dropdown-btn" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="fas fa-database"></i> Data
            </button>
            <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                <a class="dropdown-item nav-link nav-menu-links" href="#data_exploration" title="Data Exploration" id="dataSummary">
                    <i class="fas fa-chart-bar"></i> Explore
                </a>
                <a class="dropdown-item nav-link nav-menu-links" href="#data_submission" title="Data Submission" id="dataSubmission"> 
                    <i class="fas fa-upload"></i> Submit
                </a>
                <div id="myProjectsNav"></div>
                <a class="dropdown-item nav-link nav-menu-links" href="#data_analysis" title="Data Analysis" id="dataAnalysis">
                    <i class="fas fa-database"></i> Analyze
                </a>
                <a class="dropdown-item nav-link nav-menu-links" href="#data_request" title="Data Request" id="dataRequest">
                    <i class="fas fa-database"></i> Request
                </a>
            </div>
        </div>
        <div id="governanceNav"></div>
        <div class="grid-elements">
            <a class="nav-link nav-menu-links" href="#tutorials" title="Confluence Tutorials" id="platformTutorial"><i class="fas fa-file-video">
                </i> Tutorials
            </a>
        </div>
        <div class="grid-elements">
            <a class="nav-link nav-menu-links" target="_blank" href="https://github.com/episphere/confluence/issues" title="Conluence github issues">
                <i class="fas fa-bug"></i> Report issue
            </a>
        </div>
        <div class="navbar-nav ml-auto">
            ${localStorage.parms && JSON.parse(localStorage.parms).name ? `
                <div class="grid-elements dropdown">
                    <a class="nav-link nav-menu-links dropdown-toggle"  title="Welcome, ${JSON.parse(localStorage.parms).name}!" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        <i class="fas fa-user"></i> ${JSON.parse(localStorage.parms).name}
                    </a>
                    <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item nav-link nav-menu-links" href="#logout" id="logOutBtn"><i class="fas fa-sign-out-alt"></i> Log Out</a>
                    </div>
                </div>
            ` : `
                <div class="grid-elements">
                    <a class="nav-link nav-menu-links" title="Log Out" href="#logout" id="logOutBtn"><i class="fas fa-sign-out-alt"></i> Log Out</a>
                </div>
            `}
            
        </div>
    `;
};