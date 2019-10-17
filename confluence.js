import template from './src/components/navBarMenuItems.js';
import { template as homePage, homePageVisualization, confluenceLogo } from './src/pages/homePage.js';
import { template as dataSubmissionTemplate, dataSubmission } from './src/pages/dataSubmission.js';
import { template as dataSummary, getSummary } from './src/pages/dataExploration.js';
import { template as dataRequestTemplate } from './src/pages/dataRequest.js';
import { template as dataGovernanceTemplate, eventsDataSubmissions } from './src/pages/dataGovernance.js';
import { footerTemplate } from './src/components/footer.js';
import { checkAccessTokenValidity, loginAppDev, loginAppProd, logOut } from './src/manageAuthentication/index.js';
import { storeAccessToken, removeActiveClass, showAnimation, getparameters } from './src/shared.js';
import { addEventConsortiaSelect, addEventCreateStudyForm, addEventUploadStudyForm } from './src/event.js';

const confluence = () => {
    const hash = decodeURIComponent(window.location.hash);
    const index = hash.indexOf('?');
    const parameters = index !== -1 ? getparameters(hash.slice(index+1, hash.length)) : {};
    if(parameters.consortiaId){
        localStorage.boxFolderId = JSON.stringify({folderId : parameters.consortiaId});
    }
    
    let confluenceDiv = document.getElementById('confluenceDiv');
    let confluenceLogoElement = document.getElementById('confluenceLogo');
    let navBarOptions = document.getElementById('navBarOptions');

    document.getElementById('loginBoxAppDev').onclick = loginAppDev;
    document.getElementById('loginBoxAppProd').onclick = loginAppProd;
    document.getElementById('logOutBtn').addEventListener('click', logOut);
    confluenceLogoElement.innerHTML = confluenceLogo();
    const footer = document.getElementById('footer');
    footer.innerHTML = footerTemplate();
    
    if(localStorage.parms && JSON.parse(localStorage.parms).access_token) {
        logOutBtn.hidden = false
        navBarOptions.innerHTML = template();
        const dataSubmissionElement = document.getElementById('dataSubmission');
        const dataSummaryElement = document.getElementById('dataSummary');
        const dataRequestElement = document.getElementById('dataRequest');
        const dataGovernanceElement = document.getElementById('dataGovernance');
        const dataAnalysisElement = document.getElementById('dataAnalysis');

        dataSubmissionElement.addEventListener('click', () => {
            if(dataSubmissionElement.classList.contains('navbar-active')) return;
            removeActiveClass('nav-menu-links', 'navbar-active');
            dataSubmissionElement.classList.add('navbar-active');
            confluenceDiv.innerHTML = dataSubmissionTemplate();
            addEventConsortiaSelect();
            addEventCreateStudyForm();
            addEventUploadStudyForm();
            dataSubmission();
        });
        dataSummaryElement.addEventListener('click', () => {
            if(dataSummaryElement.classList.contains('navbar-active')) return;
            removeActiveClass('nav-menu-links', 'navbar-active');
            dataSummaryElement.classList.add('navbar-active');
            confluenceDiv.innerHTML = dataSummary();
            getSummary();
            showAnimation();
            
        });
        dataRequestElement.addEventListener('click', () => {
            if(dataRequestElement.classList.contains('navbar-active')) return;
            removeActiveClass('nav-menu-links', 'navbar-active');
            dataRequestElement.classList.add('navbar-active');
            confluenceDiv.innerHTML = dataRequestTemplate();
        });
        dataGovernanceElement.addEventListener('click', () => {
            if(dataGovernanceElement.classList.contains('navbar-active')) return;
            removeActiveClass('nav-menu-links', 'navbar-active');
            dataGovernanceElement.classList.add('navbar-active');
            confluenceDiv.innerHTML = dataGovernanceTemplate();
            eventsDataSubmissions();
        });
        dataAnalysisElement.addEventListener('click', () => {
            if(dataAnalysisElement.classList.contains('navbar-active')) return;
            removeActiveClass('nav-menu-links', 'navbar-active');
            dataAnalysisElement.classList.add('navbar-active');
            confluenceDiv.innerHTML = dataRequestTemplate();
        });
        dataSummaryElement.click();
    }
    if(localStorage.parms === undefined){
        confluenceDiv.innerHTML = homePage();
        homePageVisualization();
        if(location.origin.match('localhost')) loginBoxAppDev.hidden = false;
        if(location.origin.match('episphere')) loginBoxAppProd.hidden = false;
        storeAccessToken();
    }
}

window.onload = async () => {
    confluenceDiv.innerHTML = "";
    if(localStorage.parms && JSON.parse(localStorage.parms).access_token){
        await checkAccessTokenValidity();
    }
    confluence();
}
