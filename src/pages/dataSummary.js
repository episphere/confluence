import { getFolderItems, getFile } from "../shared.js";
import { config } from "../config.js";
import { studyDropDownTemplate, parametersDropDownTemplate } from "../components/elements.js";
import { txt2dt } from "../visulization.js";
import { addEventStudiesCheckBox, addEventDataTypeCheckBox, addEventSearchDataType, addEventSearchStudies, addEventSelectAllStudies, addEventSelectAllDataType } from "../event.js";
const nonStudyFolder = ['users', 'protocols', 'consents'];

export const template = () => {
    return `
        <div class="main-summary-row">
            <div class="interactive-stats">
                <div class="summary-inner-col">
                    <label for="consortiaOption" class="interactive-summary-label">Consortia</label></br>
                    <span><i class="fas fa-3x fa-layer-group"></i></span>
                    <span class="data-summary-count" id="consortiaCount">1</span></br>
                    <ul class="dropdown-options align-left ul-data-exploration" id="consortiaOption" hidden=true>
                        <li><input type="checkbox" disabled class="chk-box-margin" name="consortiaCheckBox" value="${config.BCACFolderId}"/>BCAC</li>
                    </ul>
                </div>
                <div class="summary-inner-col">
                    <span class="interactive-summary-label">Studies</span></br>
                    <span><i class="fas fa-3x fa-university"></i></span>
                    <span class="data-summary-count" id="studyCount">0</span></br>
                    <ul class="dropdown-options align-left ul-data-exploration" id="studyOption" hidden=true>
                        <li><input type="text" class="search-options" id="searchStudies" placeholder="Search studies"/></li>
                        <li><input type="checkbox" class="chk-box-margin" id="studySelectAll"/>Select all</li>
                        <ul class="align-left" id="studiesList"></ul>
                    </ul>
                </div>
                <div class="summary-inner-col">
                    <span class="interactive-summary-label">Data Types</span></br>
                    <span><i class="fas fa-3x fa-database"></i></span>
                    <span class="data-summary-count" id="dataCount">0</span></br>
                    <ul class="dropdown-options align-left ul-data-exploration" id="dataDropDown" hidden=true>
                        <li><input type="text" class="search-options" id="searchdataTypes" placeholder="Search data type"/></li>
                        <li><input type="checkbox" class="chk-box-margin" id="dataTypeSelectAll"/>Select all</li>
                        <ul class="align-left" id="dataTypeList"></ul>
                    </ul>
                </div>
                <div class="summary-inner-col">
                    <span class="interactive-summary-label">Cases</span></br>
                    <input type="checkbox" disabled class="cases-controls-chkbox" checked id="casesCheckBox"> <i for="casesCheckBox" class="fas fa-3x fa-user"></i>
                    <span class="data-summary-count" id="caseCount">0</span>
                </div>
                <div class="summary-inner-col">
                    <span class="interactive-summary-label">Controls</span></br>
                    <input type="checkbox" disabled class="cases-controls-chkbox" checked id="controlsCheckBox"> <i for="controlsCheckBox" class="fas fa-3x fa-user"></i>
                    <span class="data-summary-count" id="controlCount">0</span>
                </div>
            </div>
            <div class="main-summary-row" id="loadingAnimation">
                <div class="spinner-grow text-secondary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <div class="spinner-grow text-secondary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <div class="spinner-grow text-secondary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <div class="spinner-grow text-secondary" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
            </div>
            
            <div class="main-summary-row" id="dataSummaryParameter"></div>
            <div class="main-summary-row" id="dataSummaryViz"></div>
        </div>
    `;  
}

export async function getSummary() {
    let consortia = await getFolderItems(config.BCACFolderId);
    let dataObject = {}
    const consortiaFolderName = 'BCAC';
    const consortiaFolderId = config.BCACFolderId;
    dataObject[consortiaFolderId] = {};
    dataObject[consortiaFolderId].studyEntries = {};
    dataObject[consortiaFolderId].name = consortiaFolderName;
    dataObject[consortiaFolderId].type = 'folder';
    let studyEntries = consortia.entries;
    studyEntries = studyEntries.filter(data => nonStudyFolder.indexOf(data.name.toLowerCase().trim()) === -1)
    document.getElementById('studyCount').textContent = studyEntries.length;
    // getAgeDataForAllStudies(studyEntries);
    studyEntries.forEach(async (study, studyIndex) => {
        const studyName = study.name;
        const studyId = parseInt(study.id);
        dataObject[consortiaFolderId].studyEntries[studyId] = {};
        dataObject[consortiaFolderId].studyEntries[studyId].name = studyName;
        dataObject[consortiaFolderId].studyEntries[studyId].type = study.type;
        dataObject[consortiaFolderId].studyEntries[studyId].dataEntries = {};
        
        let data = await getFolderItems(studyId);
        let dataEntries = data.entries;
        dataEntries = dataEntries.filter(dt => dt.name.toLowerCase().trim() !== 'samples');
        
        let dataCountElement = document.getElementById('dataCount')
        dataCountElement.textContent = parseInt(dataCountElement.textContent) + dataEntries.length;

        for(let dt of dataEntries){
            const dataName = dt.name;
            const dataId = parseInt(dt.id);
            dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId] = {};
            dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].name = dataName;
            dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].type = dt.type;
            dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries = {};

            const files = await getFolderItems(dataId);
            let fileEntries = files.entries;
            fileEntries = fileEntries.filter(file => file.type === 'file' && file.name.slice(file.name.lastIndexOf('.')+1, file.name.length) === 'txt');
            for(let dataFile of fileEntries){
                const fileName = dataFile.name;
                const fileId = parseInt(dataFile.id);
                dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId] = {};
                dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].name = fileName;
                dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].type = dataFile.type;
                dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].cases = 0;
                dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].controls = 0;
                let txt = await getFile(fileId);
                let dt = txt2dt(txt);
                
                if(dt.tab && dt.tab.status){
                    const numberOfCases = dt.tab.status.filter(value => value === "1").length;
                    const numberOfControls = dt.tab.status.filter(value => value === "0").length;
                    dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].cases = numberOfCases;
                    dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].controls = numberOfControls
                    let caseCountElement = document.getElementById('caseCount');
                    caseCountElement.textContent = parseInt(caseCountElement.textContent) + numberOfCases;
                    let controlCountElement = document.getElementById('controlCount');
                    controlCountElement.textContent = parseInt(controlCountElement.textContent) + numberOfControls;
                };
                
                
                if(localStorage.data_summary) delete localStorage.data_summary;
                localStorage.data_summary = JSON.stringify(dataObject);
                if(studyIndex === studyEntries.length - 1){
                    const consortiaOptions = document.getElementById('consortiaOption');
                    consortiaOptions.hidden = false;

                    const consortiaCheckBox = document.getElementsByName('consortiaCheckBox');
                    consortiaCheckBox[0].checked = true;
                    consortiaCheckBox[0].dispatchEvent(new Event('click'));
                };
            };
        };
    });
}

export const countSpecificStudy = (folderId) => {
    const studyOption = document.getElementById('studyOption');
    studyOption.hidden = false;
    let dataObject = JSON.parse(localStorage.data_summary);
    if(dataObject[folderId]){
        const studyEntries = dataObject[folderId].studyEntries;
        let studiesList = document.getElementById('studiesList');
        studiesList.innerHTML = studyDropDownTemplate(studyEntries, 'studyOptions');
        document.getElementById('studyCount').textContent = Object.keys(studyEntries).length
    };

    addEventStudiesCheckBox(dataObject, folderId);

    // Select first study by default and trigger event
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    studiesCheckBox[0].checked = true;
    studiesCheckBox[0].dispatchEvent(new Event('click'));

    addEventSearchStudies();

    addEventSelectAllStudies();
};

export const countSpecificData = async (selectedValues, studyEntries) => {
    const dataDropDown = document.getElementById('dataDropDown');
    dataDropDown.hidden = false;
    let template = '';
    let caseCounter = 0;
    let controlCounter = 0;
    let dataCounter = 0;
    let checker_obj = {};

    selectedValues.forEach(studyId => {
        const intStudyId = parseInt(studyId);
        if(studyEntries[intStudyId]){
            const dataEntries = studyEntries[intStudyId].dataEntries;
            dataCounter += Object.keys(dataEntries).length;
            for(let dataId in dataEntries){
                const fileEntries = dataEntries[dataId].fileEntries;
                for(let fileId in fileEntries){
                    caseCounter += fileEntries[fileId].cases;
                    controlCounter += fileEntries[fileId].controls;
                }
                if(checker_obj[dataEntries[dataId].name.toLowerCase().trim()]) return;
                checker_obj[dataEntries[dataId].name.toLowerCase().trim()] = {};
                template += `<li>
                                <input type="checkbox" class="chk-box-margin" name="dataTypeCheckBox" data-study-id="${selectedValues.toString()}" value="${dataEntries[dataId].name}"/>
                                <label>${dataEntries[dataId].name}</label>
                            </li>`;
            }
        }
    });

    let dataTypeList = document.getElementById('dataTypeList');
    dataTypeList.innerHTML = template;

    // Add event listener to data type check box list
    addEventDataTypeCheckBox(studyEntries);

    addEventSelectAllDataType();
    
    // Select first data type by default and trigger event
    if(selectedValues.length > 0){
        const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
        dataTypeCheckBox[0].checked = true;
        dataTypeCheckBox[0].dispatchEvent(new Event('click'));
    }else{
        document.getElementById('dataDropDown').hidden = true;
    }
    
    document.getElementById('dataCount').textContent = dataCounter;
    document.getElementById('caseCount').textContent = caseCounter;
    document.getElementById('controlCount').textContent = controlCounter;
    
    // Data type search/filter Event
    addEventSearchDataType();
};

const getAgeDataForAllStudies = async (studyEntries) => {
    let obj = {
        age:[],
        ethnicity : []
    }
    for(const study of studyEntries){
        const studyId = study.id;
        const folderData = await getFolderItems(studyId);
        const folderEntries = folderData.entries;
        
        for(const data of folderEntries){
            if(data.name.toLowerCase().trim() === 'core data'){
                const dataId = data.id;
                const dataContent = await getFolderItems(dataId);
                const dataEntries = dataContent.entries;
                for(const fileData of dataEntries){
                    const fileId = fileData.id;
                    const fileContent = await getFile(fileId);
                    const fileDt = txt2dt(fileContent).tab;
                    obj.age = obj.age.concat(fileDt.ageInt);
                    obj.ethnicity = obj.ethnicity.concat(fileDt.ethnicityClass)
                };
            };
        };
    };
    // console.log(JSON.stringify(obj));  
};

export const clearGraphAndParameters = () => {
    document.getElementById('dataSummaryViz').innerHTML = '';
    document.getElementById('dataSummaryParameter').innerHTML = '';
}
