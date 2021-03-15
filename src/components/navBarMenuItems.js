export const navBarMenutemplate = (dictionary) => {
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
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#about/overview" id="aboutConfluence">Learn about Confluence</a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#join" id="resourcesConfluence">Join a Participating Consortia</a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#contact" id="contactConfluence">Contact</a>
            </div>
        </div>
        <div class="grid-elements dropdown">
            <button class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Data
            </button>
            <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                <h6 class="dropdown-header dropdown-header-bg font-bold">Explore Data</h6>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links pl-4" href="#data_exploration/summary" title="Summary Statistics" id="dataSummary">
                    Summary Statistics
                </a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links pl-4" href="#data_exploration/subset" title="Subset Statistics" id="dataSummarySubset">
                    Subset Statistics
                </a>
                ${dictionary ? `
                    <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links pl-4" href="#data_exploration/dictionary" title="Data Dictionary" id="dataDictionary">
                        Dictionary
                    </a>
                `:``}
                
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_submission" title="Data Submission" id="dataSubmission"> 
                    Submit
                </a>
                <div id="governanceNav" class="grid-elements"></div>
                <div id="myProjectsNav" class="grid-elements"></div>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_analysis" title="Data Analysis" id="dataAnalysis">
                    Analyze
                </a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_request" title="Data Request" id="dataRequest">
                    Request
                </a>
            </div>
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