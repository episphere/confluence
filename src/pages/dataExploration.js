import { config } from "../config.js";
import { studyDropDownTemplate, dataDropDownTemplate } from "../components/elements.js";
import { exploreData } from "../visulization.js";

export const template = () => {
    return `
        <div class="row main-summary-row">
            <div class="col form-group summary-inner-col">
                <label for="consortiaOption" class="data-summary-label">Consortia</label></br>
                <span><i class="fas fa-4x fa-layer-group"></i></span>
                <span class="data-summary-count" id="dataExplorationConsortiaCount">1</span></br>
                <select class="form-control" id="dataExplorationConsortiaOption" hidden=true>
                    <option disabled selected> -- select a consortia -- </option>
                    <option value="${config.BCACFolderId}">BCAC</option>
                </select>
            </div>
            <div class="col form-group summary-inner-col">
                <span class="data-summary-label">Studies</span></br>
                <span><i class="fas fa-4x fa-university"></i></span>
                <span class="data-summary-count" id="dataExplorationStudyCount">0</span></br>
                <div id="dataExplorationStudyDropDown"></div>
            </div>
        
            <div class="col form-group summary-inner-col">
                <span class="data-summary-label">Data</span></br>
                <span><i class="fas fa-4x fa-database"></i></span>
                <span class="data-summary-count" id="dataExplorationDataCount">0</span></br>
                <div id="dataExplorationDataDropDown"></div>
            </div>
            <div class="col form-group summary-inner-col">
                <span class="data-summary-label">Cases</span></br>
                <span><i class="fas fa-4x fa-users"></i></span>
                <span class="data-summary-count" id="dataExplorationCaseCount">0</span>
            </div>
        </div>
        <div class="row main-summary-row">
            <div id="dataExplorationParameter"></div>
            <div id="dataExplorationTable" class="table-responsive"></div>
            <div class="page-size-selector">
            <select class="form-control" id="pageSizeSelector" hidden=true>
                <option selected value=20>20</option>
                <option value=40>40</option>
                <option value=60>60</option>
                <option value=80>80</option>
                <option value=100>100</option>
            </select>
            </div>
            <div id="pagination-container"></div>
        </div>
    `;  
}

export const dataExploration = async () => {
    const dataObject = JSON.parse(localStorage.data_summary);
    for(const consortia in dataObject){
        const studyEntries = dataObject[consortia].studyEntries;
        document.getElementById('dataExplorationStudyCount').textContent = Object.keys(studyEntries).length;
        for(const data in studyEntries){
            const dataEntries = studyEntries[data].dataEntries;
            let dataCountElement = document.getElementById('dataExplorationDataCount')
            dataCountElement.textContent = parseInt(dataCountElement.textContent) + Object.keys(dataEntries).length;
            for(const file in dataEntries){
                const fileEntries = dataEntries[file].fileEntries;
                for(const fileData in fileEntries){
                    const cases = fileEntries[fileData].cases;
                    let caseCountElement = document.getElementById('dataExplorationCaseCount');
                    caseCountElement.textContent = parseInt(caseCountElement.textContent) + cases;
                }
            }
        }
    }
    document.getElementById('dataExplorationConsortiaOption').hidden = false;
};

export const dataExplorationCountSpecificStudy = (folderId) => {
    let dataObject = JSON.parse(localStorage.data_summary);
    for(let consortia in dataObject){
        if(dataObject[consortia].id === folderId){
            let studyDropDown = document.getElementById('dataExplorationStudyDropDown');
            studyDropDown.innerHTML = studyDropDownTemplate(dataObject[consortia].studyEntries, 'dataExplorationStudyOptions');
            document.getElementById('dataExplorationStudyCount').textContent = Object.keys(dataObject[consortia].studyEntries).length
            let studyOptions = document.getElementById('dataExplorationStudyOptions');
            studyOptions.addEventListener('change', () => {
                if(studyOptions.value === "") return;
                document.getElementById('dataExplorationParameter').innerHTML = '';
                document.getElementById('dataExplorationTable').innerHTML = '';
                document.getElementById('pagination-container').innerHTML = '';
                document.getElementById('pageSizeSelector').hidden = true;
                countSpecificData(parseInt(studyOptions.value));
            });
        }
    }
};

const countSpecificData = async (folderId) => {
    let dataObject = JSON.parse(localStorage.data_summary);
    for(let consortia in dataObject){
        const studyEntries = dataObject[consortia].studyEntries;
        for(let study in studyEntries){
            const studyId = dataObject[consortia].studyEntries[study].id;
            const dataEntries = studyEntries[study].dataEntries;
            if(studyId === folderId){
                document.getElementById('dataExplorationDataCount').textContent = Object.keys(dataEntries).length;
                let caseCounter = 0;
                for(let data in dataEntries){
                    const fileEntries = dataEntries[data].fileEntries;
                    for(let file in fileEntries){
                        const caseData = fileEntries[file].cases;
                        caseCounter += caseData;
                    };
                };
                document.getElementById('dataExplorationCaseCount').textContent = caseCounter;

                let dataDropDown = document.getElementById('dataExplorationDataDropDown');
                dataDropDown.innerHTML = dataDropDownTemplate(dataEntries, 'dataExplorationdataOptions');
                let dataOptions = document.getElementById('dataExplorationdataOptions');
                dataOptions.addEventListener('change', () => {
                    if(dataOptions.value === "") return;
                    countSpecificCases(parseInt(dataOptions.value));
                });
            };
        };
    };
};

const countSpecificCases = async (folderId) => {
    let dataObject = JSON.parse(localStorage.data_summary);
    let fileId = 0;
    let fileName = '';
    for(let consortia in dataObject){
        const studyEntries = dataObject[consortia].studyEntries;
        for(let study in studyEntries){
            const dataEntries = studyEntries[study].dataEntries;
            for(let data in dataEntries){
                const dataId = dataEntries[data].id;
                if(dataId === folderId){
                    const fileEntries = dataEntries[data].fileEntries;
                    let caseCounter = 0;
                    for(let file in fileEntries){
                        const caseData = fileEntries[file].cases;
                        fileId = fileEntries[file].id;
                        fileName = file;
                        caseCounter += caseData;
                    };
                    document.getElementById('dataExplorationCaseCount').textContent = caseCounter;
                    if(fileId !== 0 ) exploreData(fileId, fileName);
                };
            };
        };
    };
};