import { getFolderItems, getFile } from "../shared.js";
import { config } from "../config.js";
import { studyDropDownTemplate, dataDropDownTemplate, fileDropDownTemplate } from "../components/elements.js";
import { txt2dt, generateSummaryViz } from "../visulization.js";
const nonStudyFolder = ['users', 'protocols', 'consents'];

export function template() {
    return `
        <div class="row main-summary-row">
            <div class="col main-summary-col">
                <div class="row summary-inner-row">
                    <div class="col form-group summary-inner-col">
                        <label for="consortiaOption" class="data-summary-label">Consortia</label></br>
                        <span><i class="fas fa-4x fa-layer-group"></i></span>
                        <span class="data-summary-count" id="consortiaCount">1</span></br>
                        <select class="dropdown-options" id="consortiaOption" hidden=true>
                            <option disabled selected> -- select a consortia -- </option>
                            <option value="${config.BCACFolderId}">BCAC</option>
                        </select>
                    </div>
                    <div class="col form-group summary-inner-col">
                        <span class="data-summary-label">Studies</span></br>
                        <span><i class="fas fa-4x fa-university"></i></span>
                        <span class="data-summary-count" id="studyCount">0</span></br>
                        <div id="studyDropDown"></div>
                    </div>
                </div>
                </br>
                <div class="row summary-inner-row">
                    <div class="col form-group summary-inner-col">
                        <span class="data-summary-label">Data</span></br>
                        <span><i class="fas fa-4x fa-database"></i></span>
                        <span class="data-summary-count" id="dataCount">0</span></br>
                        <div id="dataDropDown"></div>
                    </div>
                    <div class="col form-group summary-inner-col">
                        <span class="data-summary-label">Files</span></br>
                        <span><i class="fas fa-4x fa-file"></i></span>
                        <span class="data-summary-count" id="fileCount">0</span></br>
                        <div id="fileDropDown"></div>
                    </div>
                </div>
                </br>
                <div class="row summary-inner-row">
                    <div class="col form-group summary-inner-col">
                        <span class="data-summary-label">Cases</span>
                        </br>
                        <span><i class="fas fa-4x fa-users"></i></span>
                        <span class="data-summary-count" id="caseCountSummary">0</span>
                    </div>
                </div>
            </div>
            <div class="col main-summary-col">
                <div id="dataSummaryParameter"></div>
                <div id="dataSummaryViz"></div>
            </div>
        </div>
    `;  
}

export async function getSummary(access_token) {
    await getFolderItems(config.BCACFolderId, access_token).then(consortia => {
        let dataObject = {}
        const consortiaFolderName = 'BCAC';
        dataObject[consortiaFolderName] = {};
        dataObject[consortiaFolderName].studyEntries = {};
        dataObject[consortiaFolderName].id = config.BCACFolderId;
        dataObject[consortiaFolderName].type = 'folder';
        let studyEntries = consortia.entries;
        studyEntries = studyEntries.filter(data => nonStudyFolder.indexOf(data.name.toLowerCase().trim()) === -1)
        document.getElementById('studyCount').textContent = studyEntries.length;
        studyEntries.forEach(async study => {
            const studyName = study.name;
            const studyId = study.id;
            dataObject[consortiaFolderName].studyEntries[studyName] = {};
            dataObject[consortiaFolderName].studyEntries[studyName].id = parseInt(studyId);
            dataObject[consortiaFolderName].studyEntries[studyName].type = study.type;
            dataObject[consortiaFolderName].studyEntries[studyName].dataEntries = {};
            
            await getFolderItems(studyId, access_token).then(data => {
                let dataEntries = data.entries;
                dataEntries = dataEntries.filter(dt => dt.name.toLowerCase().trim() !== 'samples');
                
                let dataCountElement = document.getElementById('dataCount')
                dataCountElement.textContent = parseInt(dataCountElement.textContent) + dataEntries.length;

                dataEntries.forEach(async dt => {
                    const dataName = dt.name;
                    const dataId = dt.id;
                    dataObject[consortiaFolderName].studyEntries[studyName].dataEntries[dataName] = {};
                    dataObject[consortiaFolderName].studyEntries[studyName].dataEntries[dataName].id = parseInt(dataId);
                    dataObject[consortiaFolderName].studyEntries[studyName].dataEntries[dataName].type = dt.type;
                    dataObject[consortiaFolderName].studyEntries[studyName].dataEntries[dataName].fileEntries = {};

                    await getFolderItems(dataId, access_token).then(files => {
                        let fileEntries = files.entries;
                        fileEntries = fileEntries.filter(file => file.type === 'file' && file.name.slice(file.name.lastIndexOf('.')+1, file.name.length) === 'txt');
                        let fileCountElement = document.getElementById('fileCount');
                        fileCountElement.textContent = parseInt(fileCountElement.textContent) + fileEntries.length;
                        // debugger;
                        fileEntries.forEach(async dataFile => {
                            const fileName = dataFile.name;
                            const fileId = dataFile.id;
                            dataObject[consortiaFolderName].studyEntries[studyName].dataEntries[dataName].fileEntries[fileName] = {};
                            dataObject[consortiaFolderName].studyEntries[studyName].dataEntries[dataName].fileEntries[fileName].id = parseInt(fileId);
                            dataObject[consortiaFolderName].studyEntries[studyName].dataEntries[dataName].fileEntries[fileName].type = dataFile.type;
                            dataObject[consortiaFolderName].studyEntries[studyName].dataEntries[dataName].fileEntries[fileName].cases = {};
                            let txt = await getFile(fileId, access_token);
                            let dt=txt2dt(txt);
                            dataObject[consortiaFolderName].studyEntries[studyName].dataEntries[dataName].fileEntries[fileName].cases = dt.tab.BCAC_ID.length;
                            let caseCountElement = document.getElementById('caseCountSummary');
                            caseCountElement.textContent = parseInt(caseCountElement.textContent) + dt.tab.BCAC_ID.length;
                            if(localStorage.data_summary) delete localStorage.data_summary;
                            localStorage.data_summary = JSON.stringify(dataObject);
                            document.getElementById('consortiaOption').hidden = false;
                        });
                    });
                });
            });
        });
    });
}

export const countSpecificStudy = (folderId) => {
    let dataObject = JSON.parse(localStorage.data_summary);
    for(let consortia in dataObject){
        if(dataObject[consortia].id === folderId){
            const studyEntries = dataObject[consortia].studyEntries;
            let studyDropDown = document.getElementById('studyDropDown');
            studyDropDown.innerHTML = studyDropDownTemplate(studyEntries, 'studyOptions');
            document.getElementById('studyCount').textContent = Object.keys(studyEntries).length
            let studyOptions = document.getElementById('studyOptions');
            studyOptions.addEventListener('change', () => {
                if(studyOptions.value === "") return;
                document.getElementById('dataSummaryParameter').innerHTML = '';
                document.getElementById('dataSummaryViz').innerHTML = '';
                countSpecificData(parseInt(studyOptions.value), studyEntries);
            });
        }
    }
};

const countSpecificData = async (folderId, studyEntries) => {
    for(let study in studyEntries){
        const studyId = studyEntries[study].id;
        const dataEntries = studyEntries[study].dataEntries;
        if(studyId === folderId){
            document.getElementById('dataCount').textContent = Object.keys(dataEntries).length;
            let caseCounter = 0;
            let fileCounter = 0;
            for(let data in dataEntries){
                const fileEntries = dataEntries[data].fileEntries;
                fileCounter += Object.keys(fileEntries).length;
                for(let file in fileEntries){
                    const caseData = fileEntries[file].cases;
                    caseCounter += caseData;
                };
            };
            
            document.getElementById('fileCount').textContent = fileCounter;
            document.getElementById('caseCountSummary').textContent = caseCounter;
            let dataDropDown = document.getElementById('dataDropDown');
            dataDropDown.innerHTML = dataDropDownTemplate(dataEntries, 'dataOptions');
            let dataOptions = document.getElementById('dataOptions');
            dataOptions.addEventListener('change', () => {
                if(dataOptions.value === "") return;
                countSpecificFiles(parseInt(dataOptions.value), dataEntries);
            });
        };
    };
};

const countSpecificFiles = async (folderId, dataEntries) => {
    for(let data in dataEntries){
        const dataId = dataEntries[data].id;
        if(dataId === folderId){
            const fileEntries = dataEntries[data].fileEntries;
            document.getElementById('fileCount').textContent = Object.keys(fileEntries).length;
            document.getElementById('fileDropDown').innerHTML = fileDropDownTemplate(fileEntries, 'fileOptions');
            let fileOptions = document.getElementById('fileOptions');
            fileOptions.addEventListener('change', function() {
                if(fileOptions.value === "") return;
                countSpecificCases(parseInt(fileOptions.value), fileEntries);
            });
            let caseCounter = 0;
            for(let file in fileEntries){
                const caseData = fileEntries[file].cases;
                caseCounter += caseData;
            };
            document.getElementById('caseCountSummary').textContent = caseCounter;
            document.getElementById('dataSummaryParameter').innerHTML = '';
            document.getElementById('dataSummaryViz').innerHTML = '';
            
        };
    };
};

const countSpecificCases = async (fileId, fileEntries) => {
    for(let file in fileEntries){
        if(fileEntries[file].id === fileId){
            const caseCounter = fileEntries[file].cases;
            document.getElementById('caseCountSummary').textContent = caseCounter;
            document.getElementById('dataSummaryParameter').innerHTML = '';
            document.getElementById('dataSummaryViz').innerHTML = '';
            generateSummaryViz(fileId, file);
            
        }
    };
}