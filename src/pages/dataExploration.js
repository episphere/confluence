import { getFolderItems, getFile, hideAnimation, showError, disableCheckBox, getFolderInfo, createFolder, getAllFileStructure, convertTextToJson, uploadFile } from "../shared.js";
import { config } from "../config.js";
import { studyDropDownTemplate, renderForm, renderConsortium } from "../components/elements.js";
import { txt2dt } from "../visulization.js";
import { addEventStudiesCheckBox, addEventDataTypeCheckBox, addEventSearchDataType, addEventSearchStudies, addEventSelectAllStudies, addEventSelectAllDataType, formSubmit } from "../event.js";
const nonStudyFolder = ['users', 'protocols', 'consents'];

export const template = () => {
    return `
        <div class="main-summary-row">
            <div class="interactive-stats">
                <div class="summary-inner-col">
                    <label for="consortiaOption" class="interactive-summary-label" id="labelConsortia">Consortia</label></br>
                    <span><i class="fas fa-3x fa-layer-group"></i></span>
                    <span class="data-summary-count" id="consortiaCount">0</span></br>
                    <ul class="dropdown-options align-left ul-data-exploration" id="consortiaOption" hidden=true></ul>
                </div>
                <div class="summary-inner-col">
                    <span class="interactive-summary-label">Studies</span></br>
                    <span><i class="fas fa-3x fa-university"></i></span>
                    <span class="data-summary-count" id="studyCount">0</span></br>
                    <ul class="dropdown-options align-left ul-data-exploration" id="studyOption" hidden=true>
                        <li><input type="text" class="search-options" aria-label="Search Studies" id="searchStudies" placeholder="Search studies"/></li>
                        <li><label><input type="checkbox" class="chk-box-margin" id="studySelectAll"/>Select all</label></li>
                        <ul class="align-left" id="studiesList"></ul>
                    </ul>
                </div>
                <div class="summary-inner-col">
                    <span class="interactive-summary-label">Data Types</span></br>
                    <span><i class="fas fa-3x fa-database"></i></span>
                    <span class="data-summary-count" id="dataCount">0</span></br>
                    <ul class="dropdown-options align-left ul-data-exploration" id="dataDropDown" hidden=true>
                        <li><input type="text" class="search-options" aria-label="Search Data Types" id="searchdataTypes" placeholder="Search data type"/></li>
                        <li><label><input type="checkbox" class="chk-box-margin" id="dataTypeSelectAll"/>Select all</label></li>
                        <ul class="align-left" id="dataTypeList"></ul>
                    </ul>
                </div>
                <div class="summary-inner-col">
                    <div id="dataSummaryVizPieChart"></div>
                    <label id="statusPieChart"></label>
                </div>
                <div class="summary-inner-col" id="dataSummaryParameter" hidden=true>
                    <label id="variableLabel"></label>
                    <div class="list-group" id="parameterList"></div>
                    <span id="showAllVariables"></span>
                </div>
            </div>
            
            <div class="row" id="error"></div>
            <div class="main-summary-row dynamic-charts">
                <div class="summary-inner-col col-md-8">
                    <div id="dataSummaryVizBarChart"></div>
                    <label id="barChartLabel"></label>
                </div>
                <div class="summary-inner-col col-md-4">
                    <span style="text-align:right;display:none" id="showPieChart"></span>
                    <div id="dataSummaryVizChart2"></div>
                    <label id="pieChartLabel"></label>
                </div>
            </div>
        </div>
    `;  
}

export const getSummary = async () => {
    let consortiaId = localStorage.boxFolderId ? JSON.parse(localStorage.boxFolderId).folderId : config.EpiBoxFolderId;
    
    let consortia = await getFolderItems(consortiaId);
    
    let dataObject = {}
    if(consortia.status === 404){
        const response = await getFolderItems(0);
        const array = response.entries.filter(obj => obj.type === 'folder' && (obj.name === 'BCAC' || obj.name === 'Confluence_NCI'));
        if(array.length > 0) {
            localStorage.data_summary = JSON.stringify(await getAllFileStructure(array));
        }
        if(array.length === 0){
            const newFolder = await createFolder(0, 'BCAC');
            consortiaId = parseInt(newFolder.id);
            dataObject[consortiaId] = {};
            dataObject[consortiaId].studyEntries = {};
            dataObject[consortiaId].name = 'BCAC';
            dataObject[consortiaId].type = 'folder';
            localStorage.data_summary = JSON.stringify(dataObject);
            hideAnimation();
        }
    }
    
    // generateConfluenceSummaryLevelData();

    document.getElementById('consortiaCount').innerHTML = Object.keys(JSON.parse(localStorage.data_summary)).length;
    const consortiaOptions = document.getElementById('consortiaOption');
    consortiaOptions.innerHTML = renderConsortium();
    const consortiaCheckBox = document.getElementsByName('consortiaCheckBox');
    Array.from(consortiaCheckBox).forEach((element) => {
        element.addEventListener('click', () => {
            if(element.value === "") return;
            countSpecificStudy(parseInt(element.value));
        });
    });
    consortiaOptions.hidden = false;

    consortiaCheckBox[0].checked = true;
    consortiaCheckBox[0].dispatchEvent(new Event('click'));
    // getAgeDataForAllStudies(studyEntries);
}

const generateConfluenceSummaryLevelData = async () => {
    const fs = JSON.parse(localStorage.data_summary);
    const obj = {};
    const sentries = fs[89412660666].studyEntries;
    for(const data in sentries){
        const dentries = sentries[data].dataEntries;
        for(let ds in dentries){
            const fileEntries = dentries[ds].fileEntries;
            for(const id in fileEntries){
                obj[id] = {};
                obj[id].name = fileEntries[id].name;
                obj[id].type = 'file';
            }
        }
    }
    
    const jsonData = await convertTextToJson(obj);
    
    const summaryData = jsonData.map(data => { return { BCAC_ID: data.BCAC_ID, ageInt: data.ageInt, ethnicityClass: data.ethnicityClass, famHist: data.famHist, fhnumber: data.fhnumber, study: data.study, ER_statusIndex: data.ER_statusIndex}})
    uploadFile(summaryData, 'summary_data.json', 92639258921);
}

export const countSpecificStudy = (folderId) => {
    const studyOption = document.getElementById('studyOption');
    studyOption.hidden = false;
    let dataObject = JSON.parse(localStorage.data_summary);
    let studyEntries = '';
    if(dataObject[folderId]){
        studyEntries = dataObject[folderId].studyEntries;
        let studiesList = document.getElementById('studiesList');
        studiesList.innerHTML = studyDropDownTemplate(studyEntries, 'studyOptions');
        document.getElementById('studyCount').textContent = Object.keys(studyEntries).length
    };

    addEventStudiesCheckBox(dataObject, folderId);

    // Select first study by default and trigger event
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    let index = 0;
    if(dataObject[folderId].studyEntries && Object.keys(dataObject[folderId].studyEntries[studiesCheckBox[index].value].dataEntries).length > 0){
        studiesCheckBox[index].checked = true;
        studiesCheckBox[index].dispatchEvent(new Event('click'));
    }
    else{
        studiesCheckBox[index].checked = true;
        showError('No Data Found in this study!');
        hideAnimation();
    }
    addEventSearchStudies();

    addEventSelectAllStudies(studyEntries);
};

export const countSpecificData = async (selectedValues, studyEntries) => {
    const dataDropDown = document.getElementById('dataDropDown');
    dataDropDown.hidden = false;
    let template = '';
    let dataCounter = 0;
    let checker_obj = {};

    selectedValues.forEach(studyId => {
        const intStudyId = parseInt(studyId);
        if(studyEntries[intStudyId]){
            if(selectedValues.length === 1 && Object.keys(studyEntries[intStudyId].dataEntries).length === 0) {
                showError('No Data Found in this study!');
                hideAnimation();
                disableCheckBox(false); 
                return;
            }
            const dataEntries = studyEntries[intStudyId].dataEntries;
            dataCounter += Object.keys(dataEntries).length;
            for(let dataId in dataEntries){
                if(checker_obj[dataEntries[dataId].name.toLowerCase().trim()]) return;
                checker_obj[dataEntries[dataId].name.toLowerCase().trim()] = {};
                template += `<li>
                                <label><input type="checkbox" class="chk-box-margin" name="dataTypeCheckBox" data-study-id="${selectedValues.toString()}" value="${dataEntries[dataId].name}"/>${dataEntries[dataId].name}</label>
                            </li>`;
            }
        }
    });

    let dataTypeList = document.getElementById('dataTypeList');
    dataTypeList.innerHTML = template;

    // Add event listener to data type check box list
    addEventDataTypeCheckBox(studyEntries);
    addEventSelectAllDataType(studyEntries);
    
    // Select first data type by default and trigger event
    if(selectedValues.length > 0){
        const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
        dataTypeCheckBox[0] ? dataTypeCheckBox[0].checked = true : showError('No Data Found in this study!');
        dataTypeCheckBox[0] ? dataTypeCheckBox[0].dispatchEvent(new Event('click')) : '';
    }else{
        document.getElementById('dataDropDown').hidden = true;
    }
    
    document.getElementById('dataCount').textContent = dataCounter;
    
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
};

export const clearGraphAndParameters = () => {
    document.getElementById('dataSummaryVizBarChart').innerHTML = '';
    document.getElementById('dataSummaryVizPieChart').hidden = true;
    document.getElementById('dataSummaryVizChart2').innerHTML = '';
    document.getElementById('dataSummaryParameter').hidden = true;
    document.getElementById('barChartLabel').innerHTML = '';
    document.getElementById('pieChartLabel').innerHTML = '';
    document.getElementById('statusPieChart').innerHTML = '';
    document.getElementById('showPieChart').style.display = 'none';
}

export const unHideDivs = () => {
    document.getElementById('dataSummaryVizPieChart').hidden = false;
    document.getElementById('dataSummaryParameter').hidden = false;
}
