import { template } from './src/components/navBarMenuItems.js';
import { infoDeck, infoDeckAfterLoggedIn } from './src/pages/homePage.js';
import { template as dataSubmissionTemplate, lazyload } from './src/pages/dataSubmission.js';
import { template as dataSummary, dataSummaryMissingTemplate, dataSummaryStatisticsTemplate } from './src/pages/dataExploration.js';
import { template as dataRequestTemplate } from './src/pages/dataRequest.js';
import { checkAccessTokenValidity, loginAppDev, loginAppProd, logOut } from './src/manageAuthentication.js';
import { storeAccessToken, removeActiveClass, showAnimation, getCurrentUser, inactivityTime, filterConsortiums, getFolderItems, filterProjects, amIViewer, getCollaboration, hideAnimation, assignNavbarActive } from './src/shared.js';
import { addEventConsortiaSelect, addEventUploadStudyForm, addEventStudyRadioBtn, addEventDataGovernanceNavBar, addEventMyProjects, addEventUpdateSummaryStatsData } from './src/event.js';
import { dataAnalysisTemplate } from './src/pages/dataAnalysis.js';
import { getFileContent } from './src/visualization.js';
import { aboutConfluence } from './src/pages/about.js';
import { confluenceResources } from './src/pages/join.js';
import { confluenceContactPage } from './src/pages/contact.js';
import { footerTemplate } from './src/components/footer.js';


export const confluence = async () => {
    if('serviceWorker' in navigator){
        try {
            navigator.serviceWorker.register('./serviceWorker.js');
        }
        catch (error) {
            console.log(error);
        }
    }

    const confluenceDiv = document.getElementById('confluenceDiv');
    const navBarOptions = document.getElementById('navBarOptions');

    document.getElementById('loginBoxAppDev').addEventListener('click', loginAppDev);
    document.getElementById('loginBoxAppProd').addEventListener('click', loginAppProd);

    if (localStorage.parms === undefined) {
        const loginBoxAppDev = document.getElementById('loginBoxAppDev');
        const loginBoxAppProd = document.getElementById('loginBoxAppProd');
        if (location.origin.match('localhost')) loginBoxAppDev.hidden = false;
        if (location.origin.match('episphere')) loginBoxAppProd.hidden = false;
        storeAccessToken();
        manageRouter();
    }
    if (localStorage.parms && JSON.parse(localStorage.parms).access_token) {
        const response = await getCurrentUser();
        showAnimation();
        if (response) {
            const lclStr = JSON.parse(localStorage.parms);
            localStorage.parms = JSON.stringify({...lclStr, ...response});
        }
        navBarOptions.innerHTML = template();
        document.getElementById('logOutBtn').addEventListener('click', logOut);

        const dataSubmissionElement = document.getElementById('dataSubmission');
        const dataSummaryElement = document.getElementById('dataSummary');
        const dataSummarySubsetElement = document.getElementById('dataSummarySubset');
        const dataRequestElement = document.getElementById('dataRequest');
        const platformTutorialElement = document.getElementById('platformTutorial');
        const dataAnalysisElement = document.getElementById('dataAnalysis');

        dataSubmissionElement.addEventListener('click', async () => {
            if (dataSubmissionElement.classList.contains('navbar-active')) return;
            showAnimation();
            assignNavbarActive(dataSubmissionElement, 1)
            document.title = 'Confluence - Data Submit';
            confluenceDiv.innerHTML = await dataSubmissionTemplate();
            lazyload();
            addEventStudyRadioBtn();
            addEventConsortiaSelect();
            addEventUploadStudyForm();
            hideAnimation();
        });
        dataSummaryElement.addEventListener('click', () => {
            if (dataSummaryElement.classList.contains('navbar-active')) return;
            showAnimation();
            assignNavbarActive(dataSummaryElement, 1)
            document.title = 'Confluence - Data Explore';
            confluenceDiv.innerHTML = dataSummary('Summary Statistics');
            addEventUpdateSummaryStatsData();
            dataSummaryStatisticsTemplate();
            if(document.getElementById('dataSummaryFilter')) document.getElementById('dataSummaryFilter').addEventListener('click', e => {
                e.preventDefault();
                const header = document.getElementById('confluenceModalHeader');
                const body = document.getElementById('confluenceModalBody');
                header.innerHTML = `<h5 class="modal-title">Filter summary data</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>`;
                body.innerHTML = `<span>Select Consortia or Studies to Display</span>`;
            })
            getFileContent();
        });
        dataSummarySubsetElement.addEventListener('click', () => {
            if (dataSummarySubsetElement.classList.contains('navbar-active')) return;
            const confluenceDiv = document.getElementById('confluenceDiv');
            showAnimation();
            assignNavbarActive(dataSummarySubsetElement, 1);
            document.title = 'Confluence - Data Explore';
            confluenceDiv.innerHTML = dataSummary('Subset Statistics');
            addEventUpdateSummaryStatsData();
            removeActiveClass('nav-link', 'active');
            document.querySelectorAll('[href="#data_exploration/subset"]')[1].classList.add('active');
            dataSummaryMissingTemplate();
        })
        dataRequestElement.addEventListener('click', () => {
            if (dataRequestElement.classList.contains('navbar-active')) return;
            showAnimation();
            assignNavbarActive(dataRequestElement, 1)
            document.title = 'Confluence - Data Request';
            confluenceDiv.innerHTML = dataRequestTemplate();
            hideAnimation();
        });
        platformTutorialElement.addEventListener('click', () => {
            if (platformTutorialElement.classList.contains('navbar-active')) return;
            showAnimation();
            assignNavbarActive(platformTutorialElement)
            document.title = 'Confluence Platform Tutorials';
            confluenceDiv.innerHTML = dataRequestTemplate();
            hideAnimation();
        });
        dataAnalysisElement.addEventListener('click', () => {
            if (dataAnalysisElement.classList.contains('navbar-active')) return;
            showAnimation();
            assignNavbarActive(dataAnalysisElement, 1);
            document.title = 'Confluence - Data Analysis';
            confluenceDiv.innerHTML = dataAnalysisTemplate();
            hideAnimation();
        });

        const folders = await getFolderItems(0);
        const array = filterConsortiums(folders.entries);
        const projectArray = filterProjects(folders.entries);
        let showProjects = false;
        for (let obj of projectArray) {
            if (showProjects === false) {
                const bool = amIViewer(await getCollaboration(obj.id, `${obj.type}s`), JSON.parse(localStorage.parms).login);
                if (bool === true) showProjects = true;
            }
        }
        if (array.length > 0 && projectArray.length > 0 && showProjects === true) {
            document.getElementById('governanceNav').innerHTML = `
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links navbar-active" href="#data_governance" title="Data Governance" id="dataGovernance">
                    Data Governance
                </a>
            `;
            document.getElementById('myProjectsNav').innerHTML = `
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#my_projects" title="My Projects" id="myProjects">
                    My Projects
                </a>
            `;
            addEventDataGovernanceNavBar(true);
            addEventMyProjects();
        } else if (array.length > 0) {
            document.getElementById('governanceNav').innerHTML = `
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links navbar-active" href="#data_governance" title="Data Governance" id="dataGovernance">
                    Data Governance
                </a>
            `;
            addEventDataGovernanceNavBar(true);
        } else if (projectArray.length > 0 && showProjects === true) {
            document.getElementById('myProjectsNav').innerHTML = `
                <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#my_projects" title="My Projects" id="myProjects">
                    My Projects
                </a>
            `;
            addEventMyProjects();
        }
        manageHash();
    }
};

const manageRouter = async () => {
    document.querySelector("[role='contentinfo']").innerHTML = footerTemplate();
    if(localStorage.parms !== undefined) return;
    const hash = decodeURIComponent(window.location.hash);
    if(!document.getElementById('navBarBtn').classList.contains('collapsed') && document.getElementById('navbarToggler').classList.contains('show')) document.getElementById('navBarBtn').click();
    if(hash === '#home'){
        const element = document.getElementById('homePage');
        if(!element) return;
        if(element.classList.contains('navbar-active')) return;
        document.title = 'Confluence Data Platform';
        assignNavbarActive(element)
        infoDeck();
        hideAnimation();
    }
    else if(hash === '#about'){
        const element = document.getElementById('aboutConfluence');
        if(!element) return;
        if(element.classList.contains('navbar-active')) return;
        document.title = 'Confluence - About';
        assignNavbarActive(element, 1);
        aboutConfluence();
    }
    else if(hash === '#join'){
        const element = document.getElementById('resourcesConfluence');
        if(!element) return;
        if(element.classList.contains('navbar-active')) return;
        document.title = 'Confluence - Resources';
        assignNavbarActive(element, 1);
        confluenceResources();
    }
    else if(hash === '#contact'){
        const element = document.getElementById('contactConfluence');
        if(!element) return;
        if(element.classList.contains('navbar-active')) return;
        document.title = 'Confluence - Contact';
        assignNavbarActive(element, 1);
        confluenceDiv.innerHTML = confluenceContactPage();
    }
    else window.location.hash = '#home';
}

const manageHash = () => {
    document.querySelector("[role='contentinfo']").innerHTML = footerTemplate();
    if(localStorage.parms === undefined) return;
    const hash = decodeURIComponent(window.location.hash);
    if(!document.getElementById('navBarBtn').classList.contains('collapsed') && document.getElementById('navbarToggler').classList.contains('show')) document.getElementById('navBarBtn').click();
    if(hash === '#data_exploration/summary') {
        const element = document.getElementById('dataSummary');
        if(!element) return;
        element.click();
    }
    else if(hash === '#data_exploration/subset') {
        const element = document.getElementById('dataSummarySubset');
        if(!element) return;
        element.click()
    }
    else if (hash === '#data_analysis') {
        const element = document.getElementById('dataAnalysis');
        element.click();
    }
    else if (hash === '#data_request') {
        const element = document.getElementById('dataRequest');
        element.click();
    }
    else if (hash === '#tutorials') {
        const element = document.getElementById('platformTutorial');
        element.click();
    }
    else if (hash === '#data_submission') {
        const element = document.getElementById('dataSubmission');
        element.click();
    }
    else if (hash === '#data_governance') {
        const element = document.getElementById('dataGovernance');
        if (element) {
            element.click();
        }
        else window.location.hash = '#';
    }
    else if (hash === '#my_projects') {
        const element = document.getElementById('myProjects');
        if (element) {
            element.click();
        } else window.location.hash = '#';
    } 
    else if (hash === '#logout') {
        const element = document.getElementById('logOutBtn');
        element.click();
    }
    else if(hash === '#home'){
        const element = document.getElementById('homePage');
        if(!element) return;
        if(element.classList.contains('navbar-active')) return;
        assignNavbarActive(element);
        document.title = 'Confluence Data Platform';
        infoDeckAfterLoggedIn();
        hideAnimation();
    }
    else if(hash === '#about'){
        const element = document.getElementById('aboutConfluence');
        if(!element) return;
        if(element.classList.contains('navbar-active')) return;
        assignNavbarActive(element, 1);
        document.title = 'Confluence - About';
        aboutConfluence();
        hideAnimation();
    }
    else if(hash === '#join'){
        const element = document.getElementById('resourcesConfluence');
        if(!element) return;
        if(element.classList.contains('navbar-active')) return;
        assignNavbarActive(element, 1);
        document.title = 'Confluence - Resources';
        confluenceResources();
        hideAnimation();
    }
    else if(hash === '#contact'){
        const element = document.getElementById('contactConfluence');
        if(!element) return;
        if(element.classList.contains('navbar-active')) return;
        assignNavbarActive(element, 1);
        document.title = 'Confluence - Contact';
        confluenceDiv.innerHTML = confluenceContactPage();
        hideAnimation();
    }
    else window.location.hash = '#data_exploration/summary';
};

window.onload = async () => {
    const confluenceDiv = document.getElementById('confluenceDiv');
    confluenceDiv.innerHTML = '';
    if (localStorage.parms && JSON.parse(localStorage.parms).access_token) {
        await checkAccessTokenValidity();
        inactivityTime();
    }
    await confluence();
};

window.onhashchange = () => {
    manageHash();
    manageRouter();
};

window.onstorage = () => {
    if(localStorage.parms === undefined) logOut();
    else {
        confluence();
        document.getElementById('loginBoxAppDev').hidden = true;
        document.getElementById('loginBoxAppProd').hidden = true;
    }
};
