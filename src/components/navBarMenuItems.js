import { applicationURLs, chairsInfo, emailsAllowedToUpdateData } from './../shared.js';


export const navBarMenutemplate = () => {
    let authChair = chairsInfo.map(({email})=>email).indexOf(JSON.parse(localStorage.parms).login)!==-1;
    let authAdmin = emailsAllowedToUpdateData.includes(JSON.parse(localStorage.parms).login);
    console.log(authAdmin);
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
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#about/description" id="aboutConfluenceDes">Description of Studies</a>
                <!--<a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#about/confluence" id="aboutConfluenceCon">Description of Confluence</a>-->
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#join/overview" id="resourcesConfluence">Participating Consortium</a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#join/description" id="resourcesConfluenceDes">Consortium DACC Chairs</a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#contact" id="contactConfluence">Contact</a>
            </div>
        </div>
        <div class="grid-elements dropdown">
            <button class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" title="Confluence" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Events
            </button>
            <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#events/meetings" id="events">Meetings</a>
            </div>
        </div>
        <div class="grid-elements dropdown">
            <button class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Explore Data
            </button>
            <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links pl-4" href="#data_exploration/dictionary" title="Data Dictionary" id="dataDictionary">
                    Dictionary
                </a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links pl-4" href="#data_exploration/summary" title="Summary Statistics" id="dataSummary">
                    Summary Statistics
                </a>
                ${
                    location.origin.match(applicationURLs.prod) ? 
                    ``:
                    `
                        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links pl-4" href="#data_exploration/subset" title="Subset Statistics" id="dataSummarySubset">
                            Subset Statistics
                        </a>
                    `
                }
                <div id="myProjectsNav" class="grid-elements"></div>
            </div>
        </div>
        <div class="grid-elements dropdown">
            <button class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Data Access
            </button>
            <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_access" title="Data Access" id="dataRequest">Data Access Process</a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_form" title="Data Form" id="dataForm"> Submit Concept Form </a>
            </div>
        </div>
        
        <div class="grid-elements dropdown">
            <button class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Projects
            </button>
            <div class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                ${
                    authChair ? (
                        `<a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#chair_menu" title="Chair Menu" id="chairMenu"> DACC Chair Menu </a>`
                    ) :''
                }
                ${
                    authAdmin ? (
                        `<a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#auth_table" title="Admin Table" id="authTable"> Admin Table </a>`
                    ) :''
                }
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#accepted_forms" title="Accepted Projects" id="acceptedForms"> Accepted Data Requests </a>
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_submission" title="Data Submitted" id="dataSubmission"> 
                    Submitted
                </a>
                <div id="governanceNav" class="grid-elements"></div>
            </div>
        </div>

        <div class="grid-elements">
            <a class="nav-link nav-menu-links white-font" rel="noopener" target="_blank" rel="noopener noreferrer" href="https://github.com/episphere/confluence/issues" title="Confluence github issues">
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