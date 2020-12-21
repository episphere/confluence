export const template = () => {
    return `
        <div class="grid-elements">
            <a class="nav-link nav-menu-links white-font" href="#home" title="Confluence Home" id="homePage">
                Home
            </a>
        </div>
        <div class="grid-elements dropdown">
            <button class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" title="Confluence" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                About Confluence
            </button>
            <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#about" id="aboutConfluence">Learn about Confluence</a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#join" id="resourcesConfluence">Resources</a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#contact" id="contactConfluence">Contact</a>
            </div>
        </div>
        <div class="grid-elements dropdown">
            <button class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Data
            </button>
            <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_exploration/summary" title="Data Exploration" id="dataSummary">
                    Explore
                </a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_submission" title="Data Submission" id="dataSubmission"> 
                    Submit
                </a>
                <div id="myProjectsNav"></div>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_analysis" title="Data Analysis" id="dataAnalysis">
                    Analyze
                </a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_request" title="Data Request" id="dataRequest">
                    Request
                </a>
            </div>
        </div>
        <div id="governanceNav"></div>
        <div class="grid-elements">
            <a class="nav-link nav-menu-links white-font" href="#tutorials" title="Confluence Tutorials" id="platformTutorial">
                </i> Tutorials
            </a>
        </div>
        <div class="grid-elements">
            <a class="nav-link nav-menu-links white-font" rel="noopener" target="_blank" href="https://github.com/episphere/confluence/issues" title="Confluence github issues">
                Report issue
            </a>
        </div>
        <div class="navbar-nav ml-auto">
            ${localStorage.parms && JSON.parse(localStorage.parms).name ? `
                <div class="grid-elements dropdown">
                    <button class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font"  title="Welcome, ${JSON.parse(localStorage.parms).name}!" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        ${JSON.parse(localStorage.parms).name}
                    </button>
                    <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#logout" id="logOutBtn">Log Out</a>
                    </div>
                </div>
            ` : `
                <div class="grid-elements">
                    <a class="nav-link nav-menu-links" title="Log Out" href="#logout" id="logOutBtn">Log Out</a>
                </div>
            `}
            
        </div>
    `;
};