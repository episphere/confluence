import template from './src/components/navBarMenuItems.js';
import { template as homePage, homePageVisualization, confluenceLogo } from './src/pages/homePage.js';
import { template as dataSubmissionTemplate, lazyload } from './src/pages/dataSubmission.js';
import { template as dataSummary, getSummary } from './src/pages/dataExploration.js';
import { template as dataRequestTemplate } from './src/pages/dataRequest.js';
import { footerTemplate } from './src/components/footer.js';
import { checkAccessTokenValidity, loginAppDev, loginAppProd, logOut } from './src/manageAuthentication/index.js';
import { storeAccessToken, removeActiveClass, showAnimation, getparameters, getCurrentUser, inactivityTime, filterConsortiums, getFolderItems, filterProjects, amIViewer, getCollaboration, hideAnimation } from './src/shared.js';
import { addEventConsortiaSelect, addEventCreateStudyForm, addEventUploadStudyForm, addEventStudyRadioBtn, addEventDataGovernanceNavBar, addEventMyProjects } from './src/event.js';
import { dataAnalysisTemplate } from './src/pages/dataAnalysis.js';

export const confluence = async () => {
    let confluenceDiv = document.getElementById('confluenceDiv');
    let confluenceLogoElement = document.getElementById('confluenceLogo');
    let navBarOptions = document.getElementById('navBarOptions');

    document.getElementById('loginBoxAppDev').onclick = loginAppDev;
    document.getElementById('loginBoxAppProd').onclick = loginAppProd;
    
    confluenceLogoElement.innerHTML = confluenceLogo();
    const footer = document.getElementById('footer');
    footer.innerHTML = footerTemplate();
    
    if(localStorage.parms && JSON.parse(localStorage.parms).access_token) {
        const response = await getCurrentUser();

        if(response){
            const lclStr = JSON.parse(localStorage.parms);
            localStorage.parms = JSON.stringify({...lclStr, ...response});
        };
        navBarOptions.innerHTML = template();
        document.getElementById('logOutBtn').addEventListener('click', logOut);

        const dataSubmissionElement = document.getElementById('dataSubmission');
        const dataSummaryElement = document.getElementById('dataSummary');
        const dataRequestElement = document.getElementById('dataRequest');
        const dataAnalysisElement = document.getElementById('dataAnalysis');

        dataSubmissionElement.addEventListener('click', async () => {
            if(dataSubmissionElement.classList.contains('navbar-active')) return;
            showAnimation();
            removeActiveClass('nav-menu-links', 'navbar-active');
            dataSubmissionElement.classList.add('navbar-active');
            confluenceDiv.innerHTML = await dataSubmissionTemplate();
            lazyload();
            addEventStudyRadioBtn();
            addEventConsortiaSelect();
            addEventUploadStudyForm();
            hideAnimation();
        });
        dataSummaryElement.addEventListener('click', () => {
            if(dataSummaryElement.classList.contains('navbar-active')) return;
            showAnimation();
            removeActiveClass('nav-menu-links', 'navbar-active');
            dataSummaryElement.classList.add('navbar-active');
            confluenceDiv.innerHTML = dataSummary();
            getSummary();
        });
        dataRequestElement.addEventListener('click', () => {
            if(dataRequestElement.classList.contains('navbar-active')) return;
            showAnimation();
            removeActiveClass('nav-menu-links', 'navbar-active');
            dataRequestElement.classList.add('navbar-active');
            confluenceDiv.innerHTML = dataRequestTemplate();
            hideAnimation();
        });
        
        dataAnalysisElement.addEventListener('click', () => {
            if(dataAnalysisElement.classList.contains('navbar-active')) return;
            showAnimation();
            removeActiveClass('nav-menu-links', 'navbar-active');
            dataAnalysisElement.classList.add('navbar-active');
            confluenceDiv.innerHTML = dataAnalysisTemplate();
            hideAnimation();
        });

        const folders = await getFolderItems(0);
        const array = filterConsortiums(folders.entries);
        const projectArray = filterProjects(folders.entries);
        let showProjects = false;
        for(let obj of projectArray){
            if(showProjects === false) {
                const bool = amIViewer(await getCollaboration(obj.id, `${obj.type}s`), JSON.parse(localStorage.parms).login);
                if(bool === true) showProjects = true;
            }
        }
        if(array.length > 0 && projectArray.length > 0 && showProjects === true){
            document.getElementById('governanceNav').innerHTML = `
                
                <div class="nav-item  grid-elements">
                    <a class="nav-link nav-menu-links" data-toggle="collapse" data-target=".navbar-collapse.show" href="#data_governance" title="Data Governance" id="dataGovernance"><i class="fas fa-database"></i> Data Governance</a>
                </div>
            `;
            document.getElementById('myProjectsNav').innerHTML = `
                
                <div class="nav-item  grid-elements">
                    <a class="nav-link nav-menu-links" data-toggle="collapse" data-target=".navbar-collapse.show" href="#my_projects" title="My Projects" id="myProjects"><i class="fas fa-project-diagram"></i> My Projects</a>
                </div>
            `;
            addEventDataGovernanceNavBar(true);
            addEventMyProjects(projectArray);
        }
        else if(array.length > 0) {
            document.getElementById('governanceNav').innerHTML = `
                
                <div class="nav-item  grid-elements">
                    <a class="nav-link nav-menu-links" data-toggle="collapse" data-target=".navbar-collapse.show" href="#data_governance" title="Data Governance" id="dataGovernance"><i class="fas fa-database"></i> Data Governance</a>
                </div>
            `;
            addEventDataGovernanceNavBar(true);
        }
        else if(projectArray.length > 0 && showProjects === true){
            document.getElementById('myProjectsNav').innerHTML = `
                
                <div class="nav-item  grid-elements">
                    <a class="nav-link nav-menu-links" data-toggle="collapse" data-target=".navbar-collapse.show" href="#my_projects" title="My Projects" id="myProjects"><i class="fas fa-project-diagram"></i> My Projects</a>
                </div>
            `;
            addEventMyProjects(projectArray);
        }
        manageHash();
    }
    if(localStorage.parms === undefined){
        window.location.hash = '#';
        confluenceDiv.innerHTML = homePage();
        homePageVisualization();
        if(location.origin.match('localhost')) loginBoxAppDev.hidden = false;
        if(location.origin.match('episphere')) loginBoxAppProd.hidden = false;
        storeAccessToken();
    }
}

const manageHash = () => {
    const hash = decodeURIComponent(window.location.hash);
    if(hash === '' || hash === '#' || hash === '#data_exploration') {
        const element = document.getElementById('dataSummary');
        if(!element) return;
        if(element.classList.contains('navbar-active')) return;
        showAnimation();
        element.click();
    }
    else if (hash === '#data_analysis') {
        const element = document.getElementById('dataAnalysis');
        if(element.classList.contains('navbar-active')) return;
        showAnimation();
        element.click();
    }
    else if (hash === '#data_request') {
        const element = document.getElementById('dataRequest');
        if(element.classList.contains('navbar-active')) return;
        showAnimation();
        element.click();
    }
    else if (hash === '#data_submission') {
        const element = document.getElementById('dataSubmission');
        if(element.classList.contains('navbar-active')) return;
        showAnimation();
        element.click();
    }
    else if (hash === '#data_governance') {
        const element = document.getElementById('dataGovernance');
        if (element) {
            if(element.classList.contains('navbar-active')) return;
            showAnimation();
            element.click();
        }
        else window.location.hash = '#';
    }
    else if (hash === '#my_projects') {
        const element = document.getElementById('myProjects');
        if (element) {
            if(element.classList.contains('navbar-active')) return;
            showAnimation();
            element.click();
        }
        else window.location.hash = '#';
    }
    else if (hash === '#logout'){
        const element = document.getElementById('logOutBtn');
        element.click();
    }
    else window.location.hash = '#';
}

window.onload = async () => {
    confluenceDiv.innerHTML = "";
    if(localStorage.parms && JSON.parse(localStorage.parms).access_token){
        await checkAccessTokenValidity();
        inactivityTime();
    }
    confluence();
}

window.onhashchange = () => {
    manageHash();
}