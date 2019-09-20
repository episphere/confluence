import template from './src/components/navBarMenuItems.js';
import { template as homePage, homePageVisualization, confluenceLogo } from './src/pages/homePage.js';
import { template as dataSubmissionTemplate, dataSubmission } from './src/pages/dataSubmission.js';
import { template as dataSummary, getSummary, countSpecificStudy } from './src/pages/dataExploration.js';
import { template as dataRequestTemplate } from './src/pages/dataRequest.js';
import { footerTemplate } from './src/components/footer.js';
import { checkAccessTokenValidity, loginObs, loginAppDev, loginAppProd, logOut } from './src/manageAuthentication/index.js';
import { storeAccessToken, removeActiveClass } from './src/shared.js';
import { addEventConsortiaSelect, addEventCreateStudyForm, addEventUploadStudyForm } from './src/event.js';

const confluence=function(){
    let confluenceDiv = document.getElementById('confluenceDiv');
    let confluenceLogoElement = document.getElementById('confluenceLogo');
    let navBarOptions = document.getElementById('navBarOptions');

    document.getElementById('loginBoxObs').onclick = loginObs;
    document.getElementById('loginBoxAppDev').onclick = loginAppDev;
    document.getElementById('loginBoxAppProd').onclick = loginAppProd;
    document.getElementById('logOutBtn').addEventListener('click', logOut);
    confluenceLogoElement.innerHTML = confluenceLogo();
    const footer = document.getElementById('footer');
    footer.innerHTML = footerTemplate();
    
    if(localStorage.parms && JSON.parse(localStorage.parms).access_token) {
        navBarOptions.innerHTML = template();
        const dataSubmissionElement = document.getElementById('dataSubmission');
        const dataSummaryElement = document.getElementById('dataSummary');
        const dataRequestElement = document.getElementById('dataRequest');

        dataSubmissionElement.addEventListener('click', () => {
            if(dataSubmissionElement.classList.contains('navbar-active')) return;
            if(localStorage.data_summary === undefined) return;
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
            let consortiaCheckBox = document.getElementsByName('consortiaCheckBox');
            Array.from(consortiaCheckBox).forEach((element, index) => {
                element.addEventListener('click', () => {
                    if(element.value === "") return;
                    if(index === consortiaCheckBox.length -1) countSpecificStudy(parseInt(element.value));
                });
            });
        });
        dataRequestElement.addEventListener('click', () => {
            if(dataRequestElement.classList.contains('navbar-active')) return;
            removeActiveClass('nav-menu-links', 'navbar-active');
            dataRequestElement.classList.add('navbar-active');
            confluenceDiv.innerHTML = dataRequestTemplate();
        });
        dataSummaryElement.click();
        logOutBtn.hidden = false
    }
    if(localStorage.parms === undefined){
        confluenceDiv.innerHTML = homePage();
        homePageVisualization();
        if(location.origin.match('localhost')) loginBoxAppDev.hidden=false;
        if(location.origin.match('episphere')) loginBoxAppProd.hidden=false;
        storeAccessToken();
    }
}

window.onload=async function(){
    confluenceDiv.innerHTML = "";
    if(localStorage.parms && JSON.parse(localStorage.parms).access_token){
        await checkAccessTokenValidity();
    }
    confluence();
}
