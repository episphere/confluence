import template from './src/components/navBarMenuItems.js';
import { template as homePage } from './src/Pages/homePage.js';
import { template as dataSubmission } from './src/Pages/dataSubmission.js';
import { template as dataSummary, getSummary, countSpecificStudy } from './src/Pages/dataSummary.js';
import { footerTemplate } from './src/components/footer.js';
import { checkAccessTokenValidity, loginObs, loginAppDev, loginAppProd, logOut } from './src/manageAuthentication/index.js';
import { generateViz } from './src/visulization.js';
import { storeAccessToken } from './src/shared.js';

const confluence=function(){
    let confluenceDiv=document.getElementById('confluenceDiv');
    let summaryDiv = document.getElementById('summaryDiv');
    let navBarOptions = document.getElementById('navBarOptions');

    document.getElementById('loginBoxObs').onclick = loginObs;
    document.getElementById('loginBoxAppDev').onclick = loginAppDev;
    document.getElementById('loginBoxAppProd').onclick = loginAppProd;
    document.getElementById('logOutBtn').addEventListener('click', logOut);
    const footer = document.getElementById('footer');
    footer.innerHTML = footerTemplate();
    
    if(localStorage.parms === undefined){
        confluenceDiv.innerHTML = homePage();
        if(location.origin.match('localhost')) loginBoxAppDev.hidden=false;
        if(location.origin.match('episphere')) loginBoxAppProd.hidden=false;
        storeAccessToken();
    }
    
    if(localStorage.parms && JSON.parse(localStorage.parms).access_token) {
        const access_token = JSON.parse(localStorage.parms).access_token;
        navBarOptions.innerHTML = template();
        const dataExplorationElement = document.getElementById('dataExploration');
        const dataSubmissionElement = document.getElementById('dataSubmission');
        const dataSummaryElement = document.getElementById('dataSummary');
        
        dataExplorationElement.addEventListener('click', async () => {
            removeActiveClass('nav-menu-links');
            dataExplorationElement.classList.add('active');
            await generateViz(access_token);
        });
        dataSubmissionElement.addEventListener('click', () => {
            removeActiveClass('nav-menu-links');
            dataSubmissionElement.classList.add('active');
            summaryDiv.innerHTML = '';
            confluenceDiv.innerHTML = dataSubmission();
        });
        dataSummaryElement.addEventListener('click', () => {
            removeActiveClass('nav-menu-links');
            dataSummaryElement.classList.add('active');
            summaryDiv.innerHTML = '';
            confluenceDiv.innerHTML = dataSummary(access_token);
            getSummary(access_token);
            let consortiaOption = document.getElementById('consortiaOption');
            consortiaOption.addEventListener('change', () => {
                if(consortiaOption.value === "") return;
                countSpecificStudy(parseInt(consortiaOption.value));
            });
        });
        dataSummaryElement.click();
        logOutBtn.hidden = false
    }

    // index.html events
    if(typeof(hideIndividualReports)){
        document.getElementById('hideIndividualReports').addEventListener('click',function(){
            if(this.textContent=="[-]"){
                this.textContent="[+]"
                this.style.color="green"
                confluenceDiv.hidden=true
            }else{
                this.textContent="[-]"
                this.style.color="orange"
                confluenceDiv.hidden=false
            }
        })
    }
}

const removeActiveClass = (className) => {
    let fileIconElement = document.getElementsByClassName(className);
    Array.from(fileIconElement).forEach(elm => {
        elm.classList.remove('active');
    });
}

window.onload=async function(){
    if(localStorage.parms && JSON.parse(localStorage.parms).access_token){
        const access_token = JSON.parse(localStorage.parms).access_token;
        await checkAccessTokenValidity(access_token);
    }
    confluence();
}
