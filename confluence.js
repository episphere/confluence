import template from './src/components/navBarMenuItems.js';
import { template as homePage, homePageVisualization } from './src/pages/homePage.js';
import { template as dataSubmissionTemplate, dataSubmission } from './src/pages/dataSubmission.js';
import { template as dataSummary, getSummary, countSpecificStudy } from './src/pages/dataSummary.js';
import { footerTemplate } from './src/components/footer.js';
import { checkAccessTokenValidity, loginObs, loginAppDev, loginAppProd, logOut } from './src/manageAuthentication/index.js';
import { storeAccessToken, removeActiveClass } from './src/shared.js';
// import { template as dataExplorationTemplate, dataExploration, dataExplorationCountSpecificStudy } from './src/pages/dataExploration.js';

const confluence=function(){
    let confluenceDiv = document.getElementById('confluenceDiv');
    let navBarOptions = document.getElementById('navBarOptions');

    document.getElementById('loginBoxObs').onclick = loginObs;
    document.getElementById('loginBoxAppDev').onclick = loginAppDev;
    document.getElementById('loginBoxAppProd').onclick = loginAppProd;
    document.getElementById('logOutBtn').addEventListener('click', logOut);
    const footer = document.getElementById('footer');
    footer.innerHTML = footerTemplate();
    
    if(localStorage.parms && JSON.parse(localStorage.parms).access_token) {
        navBarOptions.innerHTML = template();
        const dataSubmissionElement = document.getElementById('dataSubmission');
        const dataSummaryElement = document.getElementById('dataSummary');
        
        // const dataExplorationElement = document.getElementById('dataExploration');
        // dataExplorationElement.addEventListener('click', async () => {
        //     if(dataExplorationElement.classList.contains('navbar-active')) return;
        //     if(localStorage.data_summary === undefined) return;
        //     removeActiveClass('nav-menu-links');
        //     dataExplorationElement.classList.add('navbar-active');
        //     confluenceDiv.innerHTML = dataExplorationTemplate();
        //     dataExploration();
        //     let consortiaOption = document.getElementById('dataExplorationConsortiaOption');
        //     consortiaOption.addEventListener('change', () => {
        //         if(consortiaOption.value === "") return;
        //         dataExplorationCountSpecificStudy(parseInt(consortiaOption.value));
        //     });
        // });
        dataSubmissionElement.addEventListener('click', () => {
            if(dataSubmissionElement.classList.contains('navbar-active')) return;
            if(localStorage.data_summary === undefined) return;
            removeActiveClass('nav-menu-links');
            dataSubmissionElement.classList.add('navbar-active');
            confluenceDiv.innerHTML = dataSubmissionTemplate();
            dataSubmission();
        });
        dataSummaryElement.addEventListener('click', () => {
            if(dataSummaryElement.classList.contains('navbar-active')) return;
            removeActiveClass('nav-menu-links');
            dataSummaryElement.classList.add('navbar-active');
            confluenceDiv.innerHTML = dataSummary();
            getSummary();
            let consortiaOption = document.getElementById('consortiaOption');
            consortiaOption.addEventListener('change', () => {
                if(consortiaOption.value === "") return;
                countSpecificStudy(parseInt(consortiaOption.value));
            });
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
