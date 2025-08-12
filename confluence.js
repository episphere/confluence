import { navBarMenutemplate } from './src/components/navBarMenuItems.js';
import { infoDeck, infoDeckAfterLoggedIn } from './src/pages/homePage.js';
import { dataSubmissionTemplate, lazyload } from './src/pages/dataSubmission.js';
import { dataSummary, dataSummaryMissingTemplate, dataSummaryStatisticsTemplate } from './src/pages/dataExploration.js';
import { template as dataRequestTemplate, templateAfterLogin as dataRequestTemplateAfterLogin} from './src/pages/dataRequest.js';
import { chairMenuTemplate, generateChairMenuFiles, authTableTemplate, generateAuthTableFiles, testingDataGov } from './src/pages/chairmenu.js';
import { formtemplate as dataFormTemplate, formFunctions, dataForm, uploaddataFormTemplate } from './src/pages/dataForm.js';
import { checkAccessTokenValidity, loginAppDev, loginObs, loginAppEpisphere, logOut, loginAppProd } from './src/manageAuthentication.js';
import { storeAccessToken, removeActiveClass, showAnimation, getCurrentUser, inactivityTime, filterConsortiums, getFolderItems, filterProjects, amIViewer, getCollaboration, hideAnimation, assignNavbarActive, getFileInfo, handleRangeRequests, applicationURLs, checkDataSubmissionPermissionLevel, studyDescriptions, submitterFolder } from './src/shared.js';
import { addEventConsortiaSelect, addEventUploadStudyForm, addEventStudyRadioBtn, addEventDataGovernanceNavBar, addEventMyProjects, addEventUpdateSummaryStatsData, addEventUpdateAllCollaborators } from './src/event.js';
import { dataAnalysisTemplate } from './src/pages/dataAnalysis.js';
import { getFileContent } from './src/visualization.js';
import { aboutConfluence, renderOverView, renderDataDescription } from './src/pages/about.js';
import { confluenceResources, confluenceResourcesDes, participatingConfluence } from './src/pages/join.js';
import { confluenceContactPage } from './src/pages/contact.js';
import { footerTemplate } from './src/components/footer.js';
import { renderDescription } from './src/pages/description.js';
import { dataDictionaryTemplate } from './src/pages/dictionary.js';
import { confluenceEventsPage, eventsBody } from './src/pages/events.js';
import { acceptedDocs, acceptedDocsView } from './src/pages/accepteddocs.js';

export const confluence = async () => {
    // handleRangeRequests();
    if (window.navigator && navigator.serviceWorker) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
                console.log("Service worker removed.")
            }
        });
    }
    
    if (window.location.href.includes("index.html")) {
        location.href = location.href.replace("index.html", "");
    };

    const confluenceDiv = document.getElementById('confluenceDiv');
    const navBarOptions = document.getElementById('navbarToggler');
    
    document.getElementById('loginBoxAppDev').addEventListener('click', loginAppDev);
    document.getElementById('loginBoxAppStage').addEventListener('click', loginObs);
    document.getElementById('loginBoxAppEpisphere').addEventListener('click', loginAppEpisphere);
    document.getElementById('loginBoxAppProd').addEventListener('click', loginAppProd);

    if (localStorage.parms === undefined) {
        const loginBoxAppDev = document.getElementById('loginBoxAppDev');
        const loginBoxAppEpisphere = document.getElementById('loginBoxAppEpisphere');
        const loginBoxAppProd = document.getElementById('loginBoxAppProd');
        const loginBoxAppStage = document.getElementById('loginBoxAppStage');
        if (location.origin.match('localhost')) loginBoxAppDev.hidden = false;
        // if (location.origin.match(applicationURLs.stage)) loginBoxAppStage.hidden = false;
        // if (location.origin.match(applicationURLs.prod)) loginBoxAppProd.hidden = false;
        if (applicationURLs.stage.includes(location.origin)) loginBoxAppStage.hidden = false;
        if (applicationURLs.prod.includes(location.origin)) loginBoxAppProd.hidden = false;
        if (location.origin.match('episphere')) loginBoxAppEpisphere.hidden = false;
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

        try {
            const permittedToUpload = checkDataSubmissionPermissionLevel(await getCollaboration(submitterFolder, 'folders'), JSON.parse(localStorage.parms).login);
            localStorage.uploadAccessGranted = permittedToUpload ? 'true' : 'false';
        } catch (error) {
            console.log("Don't have access");
            const permissionBanner = document.getElementById("permissionBanner");
            permissionBanner.style.display = 'block';
            localStorage.uploadAccessGranted = 'false';
        }

        let accessToUpload = localStorage.uploadAccessGranted === 'true';
        
        navBarOptions.innerHTML = navBarMenutemplate();
        document.getElementById('logOutBtn').addEventListener('click', logOut);

        // const dataSubmissionElement = document.getElementById('dataSubmission');
        const dataSummaryElement = document.getElementById('dataSummary');
        const dataSummarySubsetElement = document.getElementById('dataSummarySubset');
        const dataDictionaryElement = document.getElementById('dataDictionary');
        const dataRequestElement = document.getElementById('dataRequest');
        // const platformTutorialElement = document.getElementById('platformTutorial');
        const dataAnalysisElement = document.getElementById('dataAnalysis');
        const dataFormElement = document.getElementById('dataForm');
        // const uploaddataFormElement = document.getElementById('uploaddataForm');
        const chairMenuElement = document.getElementById('chairMenu');
        const authTableElement = document.getElementById('authTable');
        const acceptedFormsElement = document.getElementById('acceptedForms');

        // if (dataSubmissionElement) {
        //     dataSubmissionElement.addEventListener('click', async () => {
        //         if (dataSubmissionElement.classList.contains('navbar-active')) return;
                
        //         showAnimation();
        //         assignNavbarActive(dataSubmissionElement, 2);
        //         document.title = 'Confluence - Data Submit';
        //         confluenceDiv.innerHTML = await dataSubmissionTemplate();
        //         lazyload();
        //         addEventStudyRadioBtn();
        //         addEventConsortiaSelect();
        //         addEventUploadStudyForm();
        //         hideAnimation();
        //     });
        // }
        if (dataSummaryElement) {
            dataSummaryElement.addEventListener('click', () => {
                if (dataSummaryElement.classList.contains('navbar-active')) return;
                
                showAnimation();
                assignNavbarActive(dataSummaryElement, 2)
                document.title = 'Confluence - Summary Statistics';
                confluenceDiv.innerHTML = dataSummary('Summary Statistics', false, true);
                addEventUpdateSummaryStatsData();
                addEventUpdateAllCollaborators();
                dataSummaryStatisticsTemplate();
                
                if (document.getElementById('dataSummaryFilter')) document.getElementById('dataSummaryFilter').addEventListener('click', e => {
                    e.preventDefault();
                    const header = document.getElementById('confluenceModalHeader');
                    const body = document.getElementById('confluenceModalBody');
                    header.innerHTML = `<h5 class="modal-title">Filter summary data</h5>
                                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
                    body.innerHTML = `<span>Select Consortia or Studies to Display</span>`;
                })
                
                getFileContent();
            });
        }
        if (dataSummarySubsetElement) {
            dataSummarySubsetElement.addEventListener('click', () => {
                if (dataSummarySubsetElement.classList.contains('navbar-active')) return;
                
                const confluenceDiv = document.getElementById('confluenceDiv');
                showAnimation();
                assignNavbarActive(dataSummarySubsetElement, 2);
                document.title = 'Confluence - Subset Statistics';
                confluenceDiv.innerHTML = dataSummary('Subset Statistics', false, true);
                addEventUpdateSummaryStatsData();
                addEventUpdateAllCollaborators();
                removeActiveClass('nav-link', 'active');
                document.querySelectorAll('[href="#data_exploration/subset"]')[1].classList.add('active');
                dataSummaryMissingTemplate();
            });
        }
        if (dataDictionaryElement) {
            dataDictionaryElement.addEventListener('click', () => {
                if (dataDictionaryElement.classList.contains('navbar-active')) return;
                
                const confluenceDiv = document.getElementById('confluenceDiv');
                showAnimation();
                assignNavbarActive(dataDictionaryElement, 2);
                document.title = 'Confluence - Data Dictionary';
                confluenceDiv.innerHTML = dataSummary('Data Dictionary', true, false);
                addEventUpdateSummaryStatsData();
                addEventUpdateAllCollaborators();
                removeActiveClass('nav-link', 'active');
                document.querySelectorAll('[href="#data_exploration/dictionary"]')[1].classList.add('active');
                dataDictionaryTemplate();
            });
        }
        dataRequestElement.addEventListener('click', () => {
            if (dataRequestElement.classList.contains('navbar-active')) return;
            
            showAnimation();
            assignNavbarActive(dataRequestElement, 2)
            document.title = 'Confluence - Data Access';
            confluenceDiv.innerHTML = dataRequestTemplateAfterLogin();
            hideAnimation();
        });
        // platformTutorialElement.addEventListener('click', () => {
        //    if (platformTutorialElement.classList.contains('navbar-active')) return;
        //    showAnimation();
        //    assignNavbarActive(platformTutorialElement)
        //    document.title = 'Confluence Platform Tutorials';
        //    confluenceDiv.innerHTML = dataRequestTemplate();
        //    hideAnimation();
        // });
        if (dataAnalysisElement) {
            dataAnalysisElement.addEventListener('click', () => {
                if (dataAnalysisElement.classList.contains('navbar-active')) return;
                
                showAnimation();
                assignNavbarActive(dataAnalysisElement, 1);
                document.title = 'Confluence - Data Analysis';
                confluenceDiv.innerHTML = dataAnalysisTemplate();
                hideAnimation();
            });
        }
        if (dataFormElement) {
            dataFormElement.addEventListener('click', () => {
                if (dataFormElement.classList.contains('navbar-active')) return;
                
                showAnimation();
                assignNavbarActive(dataFormElement, 2);
                document.title = 'Confluence - Data Form';
                confluenceDiv.innerHTML = dataFormTemplate();
                dataForm();
                formFunctions();
                //setupFormValidation("analysisConceptForm");
                hideAnimation();
            });
        }
        // if(uploaddataFormElement) {
        //    uploaddataFormElement.addEventListener('click', () => {
        //        if (uploaddataFormElement.classList.contains('navbar-active')) return;
        //        showAnimation();
        //        assignNavbarActive(uploaddataFormElement, 1);
        //        document.title = 'Confluence - Data Form Upload';
        //        confluenceDiv.innerHTML = uploaddataFormTemplate();
        //        //uploaddataForm();
        //        //formFunctions();
        //        hideAnimation();
        //    });
        // }
        if (chairMenuElement) {
            chairMenuElement.addEventListener('click', () => {
                if (chairMenuElement.classList.contains('navbar-active')) return;
                
                const element = document.getElementById("chairMenu")
                showAnimation();
                assignNavbarActive(element, 2);
                document.title = 'Confluence - Chair Menu';
                confluenceDiv.innerHTML = chairMenuTemplate();
                generateChairMenuFiles();
                // uploaddataForm();
                // formFunctions();
                // hideAnimation();
             });
        }
        if (authTableElement) {
            authTableElement.addEventListener('click', () => {
                if (authTableElement.classList.contains('navbar-active')) return;
                
                const element = document.getElementById("authTable")
                showAnimation();
                assignNavbarActive(element, 2);
                document.title = 'Confluence - Admin Table';
                confluenceDiv.innerHTML = authTableTemplate();
                generateAuthTableFiles();
                authTableTemplate();
                testingDataGov();
            });
        }
        if (acceptedFormsElement) {
            acceptedFormsElement.addEventListener('click', () => {
                if (acceptedFormsElement.classList.contains('navbar-active')) return;
                
                const element = document.getElementById("acceptedForms")
                showAnimation();
                assignNavbarActive(element, 2);
                document.title = 'Confluence - Accepted Data Requests';
                // confluenceDiv.innerHTML = authTableTemplate();
                console.log("accepted forms");
                confluenceDiv.innerHTML = acceptedDocs();
                acceptedDocsView();
            });
        }
        
        const folders = await getFolderItems(0);
        const array = filterConsortiums(folders.entries);
        const projectArray = filterProjects(folders.entries);
        const getCollaborators = await getCollaboration(137304373658, 'folders');
        let getMyPermissionLevel = false;
        if (getCollaborators) getMyPermissionLevel = checkDataSubmissionPermissionLevel(getCollaborators, JSON.parse(localStorage.parms).login);
        let showProjects = false;
        
        // for (let obj of projectArray) {
        //    if (showProjects === false) {
        //        const bool = amIViewer(await getCollaboration(obj.id, `${obj.type}s`), JSON.parse(localStorage.parms).login);
        //        if (bool === true) showProjects = true;
        //    }
        // }
        // if (array.length > 0 && projectArray.length > 0 && showProjects === true) {
        //    document.getElementById('governanceNav').innerHTML = `
        //        ${getMyPermissionLevel ? `
        //            <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links navbar-active" href="#data_governance" title="Data Governance" id="dataGovernance">
        //                Data Governance
        //            </a>
        //        `: ``}
        //    `;
        //    document.getElementById('myProjectsNav').innerHTML = `
        //        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#my_projects" title="My Projects" id="myProjects">
        //            My Projects
        //        </a>
        //    `;
        //    addEventDataGovernanceNavBar(true);
        //    addEventMyProjects();
        // } else if (array.length > 0 && getMyPermissionLevel) {
        //    document.getElementById('governanceNav').innerHTML = `
        //        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links navbar-active" href="#data_governance" title="Data Governance" id="dataGovernance">
        //            Data Governance
        //        </a>
        //    `;
        //    addEventDataGovernanceNavBar(true);
        // } else if (projectArray.length > 0 && showProjects === true) {
        //    document.getElementById('myProjectsNav').innerHTML = `
        //        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#my_projects" title="My Projects" id="myProjects">
        //            My Projects
        //        </a>
        //    `;
        //    addEventMyProjects();
        // }
        // if (getMyPermissionLevel) {
        //    document.getElementById('governanceNav').innerHTML = `
        //        <a class="dropdown-item nav-link nav-menu-links dropdown-menu-links" href="#data_governance" title="Data Governance" id="dataGovernance">
        //            Data Governance
        //        </a>
        //    `;
        //    removeActiveClass('nav-link', 'active');
        //    addEventDataGovernanceNavBar(true);
        // }
        
        manageHash();
    }
};

const manageRouter = async () => {
    document.querySelector("[role='contentinfo']").innerHTML = footerTemplate();
    
    if (localStorage.parms !== undefined) return;
    let accessToUpload = localStorage.uploadAccessGranted === 'true';
    
    const hash = decodeURIComponent(window.location.hash);
    
    if (!document.getElementById('navBarBtn').classList.contains('collapsed') && document.getElementById('navbarToggler').classList.contains('show')) document.getElementById('navBarBtn').click();
    
    if (hash === '#home') {
        const element = document.getElementById('homePage');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        document.title = 'Confluence Data Platform';
        assignNavbarActive(element)
        infoDeck();
        hideAnimation();
    }
    else if (hash === '#about/overview') {
        const element = document.getElementById('aboutConfluence');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        document.title = 'Confluence - Overview';
        assignNavbarActive(element, 2);
        const fileInfo = await getFileInfo(studyDescriptions);
        aboutConfluence('description', fileInfo ? true : false, accessToUpload);
        renderOverView();
    }
    else if (hash === '#about/description') {
        const element = document.getElementById('aboutConfluence');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        document.title = 'Confluence - Study Description';
        assignNavbarActive(element, 1);
        const fileInfo = await getFileInfo(studyDescriptions);
        aboutConfluence('description', fileInfo ? true : false, accessToUpload);
        renderDescription(fileInfo['content_modified_at'])
        renderOverView();
    }
    else if (hash === '#about/confluence') {
        // console.log("this one clicked"); - Commenting out as this was used for debugging - JD
        const element = document.getElementById('aboutConfluenceCon');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        document.title = 'Confluence - Confluence Description';
        assignNavbarActive(element, 1);
        // const fileInfo = await getFileInfo(761599566277);
        // console.log(fileInfo);
        const fileInfo = await getFileInfo(studyDescriptions);
        aboutConfluence('description', fileInfo ? true : false, accessToUpload);
        renderDataDescription();
        // renderOverView();
        // console.log("everything passed"); - Commenting out as this was used for debugging - JD
    }
    else if (hash === '#join/overview') {
        const element = document.getElementById('resourcesConfluence');
        if (!element) return;
        // if (element.classList.contains('navbar-active')) return;
        
        document.title = 'Confluence - Resources';
        assignNavbarActive(element,2);
        participatingConfluence('overview', false, accessToUpload);
        confluenceResources();
        hideAnimation();
    }
    else if (hash === '#join/description') {
        const element = document.getElementById('resourcesConfluenceDes');
        if (!element) return;
        // if (element.classList.contains('navbar-active')) return;
        
        document.title = 'Confluence - Resources Description';
        assignNavbarActive(element,2);
        participatingConfluence('description', false, accessToUpload);
        confluenceResourcesDes();
        hideAnimation();
    }
    else if (hash === '#contact') {
        const element = document.getElementById('contactConfluence');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        document.title = 'Confluence - Contact';
        assignNavbarActive(element,2);
        confluenceDiv.innerHTML = confluenceContactPage(false, accessToUpload);
    }
    else if (hash === '#data_access') {
        const element = document.getElementById('dataRequest');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        document.title = 'Confluence - Data Access';
        assignNavbarActive(element, 2);
        confluenceDiv.innerHTML = dataRequestTemplate();
    }
    else if (hash === '#data_form') {
        const element = document.getElementById('dataForm');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        document.title = 'Confluence - Data Form';
        assignNavbarActive(element, 2);
        confluenceDiv.innerHTML = dataFormTemplate();
        dataForm();  
        formFunctions();
        //setupFormValidation("analysisConceptForm");
    }
    // else if (hash === '#upload_data_form') {
    //     const element = document.getElementById('uploaddataForm');
    //     if(!element) return;
    //     if(element.classList.contains('navbar-active')) return;
    //     document.title = 'Confluence - Data Form Upload';
    //     assignNavbarActive(element, 1);
    //     confluenceDiv.innerHTML = uploaddataFormTemplate();
    //     //uploaddataForm();  
    //     //formFunctions(); 
    // }
    else if (hash === '#chair_menu') {
        const element = document.getElementById('chairMenu');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        document.title = 'Chair Menu';
        assignNavbarActive(element, 2);
        confluenceDiv.innderHTML = chairMenuTemplate();
        generateChairMenuFiles();
    }
    else if (hash === '#auth_table') {
        const element = document.getElementById('authTable');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        document.title = 'Admin Table';
        assignNavbarActive(element, 2);
        confluenceDiv.innerHTML = AuthTableTemplate();
        generateAuthTableFiles();
        testingDataGov();
    }
    else if (hash === '#accepted_forms') {
        const element = document.getElementById('acceptedForms');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        document.title = 'Confluence - Accepted Data Requests';
        assignNavbarActive(element, 2);
        // confluenceDiv.innerHTML = AuthTableTemplate();
        console.log("accepted forms");
        confluenceDiv.innerHTML = acceptedDocs();
        acceptedDocsView();
    }
    else if (hash === '#data_exploration/dictionary') {
        const dataDictionaryElement = document.getElementById('dataDictionary');
        if (!dataDictionaryElement || dataDictionaryElement.classList.contains('navbar-active')) return;
        
        showAnimation();
        assignNavbarActive(dataDictionaryElement, 2);
        document.title = 'Confluence - Data Dictionary';
        confluenceDiv.innerHTML = dataSummary('Data Dictionary', true, false, true);
        removeActiveClass('nav-link', 'active');
        try {
            document.querySelectorAll('[href="#data_exploration/dictionary"]')[1].classList.add('active')
        }
        catch(err) {
            'Public Site'
        };
        dataDictionaryTemplate();
    }
    else window.location.hash = '#home';
};

const manageHash = async () => {
    document.querySelector("[role='contentinfo']").innerHTML = footerTemplate();
    if (localStorage.parms === undefined) return;
    let accessToUpload = localStorage.uploadAccessGranted === 'true';
    const hash = decodeURIComponent(window.location.hash);
    
    if (!document.getElementById('navBarBtn').classList.contains('collapsed') && document.getElementById('navbarToggler').classList.contains('show')) document.getElementById('navBarBtn').click();
    if (hash === '#data_exploration/summary') {
        const element = document.getElementById('dataSummary');
        if (!element) return;
        element.click();
    }
    else if (hash === '#data_exploration/subset' && !location.origin.match(applicationURLs.prod)) {
        const element = document.getElementById('dataSummarySubset');
        if (!element) return;
        element.click()
    }
    else if (hash === '#data_exploration/dictionary') {
        const element = document.getElementById('dataDictionary');
        if (!element) return;
        element.click()
    }
    else if (hash === '#data_analysis' && !location.origin.match(applicationURLs.prod)) {
        const element = document.getElementById('dataAnalysis');
        element.click();
    }
    else if (hash === '#data_access') {
        const element = document.getElementById('dataRequest');
        element.click();
    }
    else if (hash === '#data_form') {
        const element = document.getElementById('dataForm');
        element.click();
    }
    else if (hash === '#upload_data_form') {
        const element = document.getElementById('uploaddataForm');
        element.click();
    }
    else if (hash === '#chair_menu') {
        const element = document.getElementById('chairMenu');
        element.click();
    }
    else if (hash === '#auth_table') {
        const element = document.getElementById('authTable');
        element.click();
    }
    else if (hash === '#accepted_forms') {
        const element = document.getElementById('acceptedForms');
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
    else if (hash === '#home') {
        const element = document.getElementById('homePage');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        assignNavbarActive(element);
        document.title = 'Confluence Data Platform';
        infoDeckAfterLoggedIn(accessToUpload);
        hideAnimation();
    }
    else if (hash === '#about/overview') {
        const element = document.getElementById('aboutConfluence');
        if (!element) return;
        // if (element.classList.contains('navbar-active')) return;
        
        assignNavbarActive(element, 2);
        document.title = 'Confluence - Overview';
        const fileInfo = await getFileInfo(studyDescriptions);
        aboutConfluence('overview', fileInfo ? true : false, accessToUpload);
        renderOverView();
        hideAnimation();
    }
    else if (hash === '#about/description') {
        const element = document.getElementById('aboutConfluenceDes');
        if (!element) return;
        // if (element.classList.contains('navbar-active')) return;
        
        // assignNavbarActive(element, 1);
        assignNavbarActive(element, 2);
        document.title = 'Confluence - Study Description';
        showAnimation();
        const fileInfo = await getFileInfo(studyDescriptions);
        if (!fileInfo) {
            location.hash = '#about/overview';
            hideAnimation();
            return;
        }
        aboutConfluence('description', fileInfo ? true : false, accessToUpload);
        renderDescription(fileInfo['content_modified_at']);
        hideAnimation();
    }
    else if (hash === '#about/confluence') {
        const element = document.getElementById('aboutConfluenceCon');
        if (!element) return;
        // if (element.classList.contains('navbar-active')) return;
        
        // assignNavbarActive(element, 1);
        assignNavbarActive(element, 2);
        document.title = 'Confluence - Description';
        showAnimation();
        const fileInfo = await getFileInfo(studyDescriptions);
        if (!fileInfo) {
            location.hash = '#about/confluence';
            hideAnimation();
            return;
        }
        aboutConfluence('confluence', fileInfo ? true : false, accessToUpload);
        renderDataDescription();
        hideAnimation();
    }
    else if (hash === '#join/overview') {
        const element = document.getElementById('resourcesConfluence');
        if (!element) return;
        // if (element.classList.contains('navbar-active')) return;
        
        assignNavbarActive(element, 2);
        document.title = 'Confluence - Resources';
        participatingConfluence('overview', true, accessToUpload);
        confluenceResources();
        hideAnimation();
    }
    else if (hash === '#join/description') {
        const element = document.getElementById('resourcesConfluenceDes');
        if (!element) return;
        // if (element.classList.contains('navbar-active')) return;
        
        assignNavbarActive(element, 2);
        // removeActiveClass('nav-menu-links', 'navbar-active');
        // try {
        //     document.querySelectorAll('[href="#join/description"]')[0].classList.add('navbar-active')
        // }
        // catch(err) {
        //     'Public Site'
        // };
        document.title = 'Confluence - Resources Description';
        participatingConfluence('description', true, accessToUpload);
        confluenceResourcesDes();
        hideAnimation();
    }
    else if (hash === '#contact'){
        const element = document.getElementById('contactConfluence');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        assignNavbarActive(element, 2);
        document.title = 'Confluence - Contact';
        confluenceDiv.innerHTML = confluenceContactPage(true, accessToUpload);
        console.log(accessToUpload);
        hideAnimation();
    }
    else if (hash === '#events/meetings') {
        const element = document.getElementById('events');
        if (!element) return;
        if (element.classList.contains('navbar-active')) return;
        
        assignNavbarActive(element, 2);
        document.title = 'Confluence - Events';
        showAnimation();
        confluenceDiv.innerHTML = confluenceEventsPage();
        await eventsBody()
        hideAnimation();
    }
    else window.location.hash = '#home';
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
    if (localStorage.parms === undefined) { logOut(); }
    else {
        confluence();
        document.getElementById('loginBoxAppDev').hidden = true;
        document.getElementById('loginBoxAppStage').hidden = true;
        document.getElementById('loginBoxAppEpisphere').hidden = true;
        document.getElementById('loginBoxAppProd').hidden = true;
    }
};

window.addEventListener('beforeinstallprompt', e => {
    e.userChoice.then(choiceResult => {
        gtag('send', 'event', 'A2H', choiceResult.outcome); 
    });
});