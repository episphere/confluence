import { applicationURLs, chairsInfo, emailsAllowedToUpdateData, getFile } from './../shared.js';

export const navBarMenutemplate = () => {
    let authChair = chairsInfo.map(({email})=>email).indexOf(JSON.parse(localStorage.parms).login)!==-1;
    let authAdmin = emailsAllowedToUpdateData.includes(JSON.parse(localStorage.parms).login);

    return `
        <ul class="navbar-nav me-auto mb-lg-0" id="navBarOptions">
            <li class="nav-item grid-elements">
                <a class="nav-link nav-menu-links white-font" rel="noopener" href="#home" title="Confluence Home" id="homePage">
                    Home
                </a>
            </li>
            <li class="nav-item dropdown grid-elements">
                <a class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" href="#" id="navbarDropdown" role="button" title="Confluence" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    About Confluence
                </a>
                <ul class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                    <li><a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#about/overview" id="aboutConfluence">Learn about Confluence</a></li>
                    <li><a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#about/description" id="aboutConfluenceDes">Description of Studies</a></li>
                    <!--<li><a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#about/confluence" id="aboutConfluenceCon">Description of Confluence</a></li>-->
                    <li><a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#join/overview" id="resourcesConfluence">Participating Consortium</a></li>
                    <li><a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#join/description" id="resourcesConfluenceDes">Participating DACCs</a></li>
                    <li><a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#contact" id="contactConfluence">Contact</a></li>
                </ul>
            </li>
            <li class="nav-item dropdown grid-elements">
                <a class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" href="#" id="navbarDropdown2" role="button" title="Confluence" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Events
                </a>
                <ul class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                    <li><a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#events/meetings" id="events">Meetings</a></li>
                </ul>
            </li>
            <li class="nav-item dropdown grid-elements">
                <a class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" href="#" id="navbarDropdown3" role="button" title="Confluence" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Data
                </a>
                <ul class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                    <li>
                        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links pl-4" href="#data_exploration/dictionary" title="Data Dictionary" id="dataDictionary">
                            Dictionary
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links pl-4" href="#data_exploration/summary" title="Summary Statistics" id="dataSummary">
                            Summary Statistics
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_access" title="Data Access" id="dataRequest">
                            Data Access Process
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_form" title="Data Form" id="dataForm">
                            Submit Concept Form
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#accepted_forms" title="Accepted Projects" id="acceptedForms">
                            Approved Confluence Concepts
                        </a>
                    </li>
                    <!--${
                        location.origin.match(applicationURLs.prod) ? `` : `
                            <li>
                                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links pl-4" href="#data_exploration/subset" title="Subset Statistics" id="dataSummarySubset">
                                    Subset Statistics
                                </a>
                            </li>
                        `
                    }-->
                    <!--<li>
                        <div id="myProjectsNav" class="grid-elements"></div>
                    </li>-->
                </ul>
            </li>
            <!--<li class="nav-item dropdown grid-elements">
                <a class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" href="#" id="navbarDropdown3" role="button" title="Confluence" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    Data Access
                </a>
                <ul class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                    <li><a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_access" title="Data Access" id="dataRequest">Data Access Process</a></li>
                    <li><a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_form" title="Data Form" id="dataForm"> Submit Concept Form </a></li>
                    <li><a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#accepted_forms" title="Accepted Projects" id="acceptedForms"> Approved Confluence Concepts </a></li>
                </ul>
            </li>-->
            ${
                (authChair || authAdmin) ? (
                    `<li class="nav-item dropdown grid-elements">
                        <a class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" href="#" id="navbarDropdown4" role="button" title="Confluence" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            DACC Menu
                        </a>
                        <ul class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                            ${
                                authChair ? (
                                    `<li>
                                        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#chair_menu" title="Chair Menu" id="chairMenu">
                                            DACC Chair Menu
                                        </a>
                                    </li>`
                                ) : ''
                            }
                            ${
                                authAdmin ? (
                                    `<li>
                                        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#auth_table" title="Admin Table" id="authTable">
                                            Admin Table
                                        </a>
                                    </li>`
                                ) : ''
                            }
                            <!--<a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#accepted_forms" title="Accepted Projects" id="acceptedForms"> Accepted Data Requests </a>-->
                            <!--<li>
                                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_submission" title="Data Submitted" id="dataSubmission"> 
                                    Submitted
                                </a>
                            </li>-->
                            <!--<li>
                                <div id="governanceNav" class="grid-elements"></div>
                            </li>-->
                        </ul>
                    </li>
                `) :''
            }
            <li class="grid-elements">
                <a class="nav-link nav-menu-links white-font" rel="noopener" target="_blank" rel="noopener noreferrer" href="https://github.com/episphere/confluence/issues" title="Confluence github issues">
                    Report issue
                </a>
            </li>
        </ul>
        <ul class="navbar-nav ml-auto" id="navBarOptions2">
            ${localStorage.parms && JSON.parse(localStorage.parms).name ? `
                <li class="nav-item dropdown grid-elements d-flex">
                    <a class="nav-link nav-menu-links dropdown-toggle dropdown-btn white-font" href="#" id="navbarDropdown5" role="button" title="Confluence" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                        ${JSON.parse(localStorage.parms).name}
                    </a>
                    <ul class="dropdown-menu navbar-dropdown" aria-labelledby="navbarDropdown">
                        <li>
                            <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#logout" id="logOutBtn">
                                Log Out
                            </a>
                        </li>
                    </ul>
                </li>
                ` : `
                <li class="grid-elements">
                    <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#logout" id="logOutBtn">
                        Log Out
                    </a>
                </li>
            `}
            </div>
        </ul>
    `;
};