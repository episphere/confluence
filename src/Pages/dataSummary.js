import { getFolderItems, getFile } from "../shared.js";
import { config } from "../config.js";
import { studyDropDownTemplate, dataDropDownTemplate } from "../components/elements.js";
import { txt2dt } from "../visulization.js";
const nonStudyFolder = ['users', 'protocols', 'consents'];

export function template() {
    return `
        <div class="row main-summary-row">
            <div id="dataSummaryDiv" hidden=true></div>
            <div class="col main-summary-col">
                <div class="row summary-inner-row">
                    <div class="col">
                        <span class="data-summary-label">Consortia</span></br>
                        <span><i class="fas fa-3x fa-layer-group"></i></span>
                        <span class="data-summary-count" id="consortiaCount">1</span></br>
                        <select class="select" id="consortiaOption" hidden=true>
                            <option disabled selected> -- select a consortia -- </option>
                            <option value="${config.BCACFolderId}">BCAC</option>
                        </select>
                    </div>
                    <div class="col">
                        <span class="data-summary-label">Studies</span></br>
                        <span><i class="fas fa-3x fa-university"></i></span>
                        <span class="data-summary-count" id="studyCount">0</span></br>
                        <div id="studyDropDown"></div>
                        
                    </div>
                </div>
                </br>
                <div class="row summary-inner-row">
                    <div class="col">
                        <span class="data-summary-label">Data</span></br>
                        <span><i class="fas fa-3x fa-database"></i></span>
                        <span class="data-summary-count" id="dataCount">0</span></br>
                        <div id="dataDropDown"></div>
                    </div>
                    <div class="col">
                        <span class="data-summary-label">Cases</span></br>
                        <span><i class="fas fa-3x fa-users"></i></span>
                        <span class="data-summary-count" id="caseCountSummary">0</span>
                    </div>
                </div>
            </div>
            <div class="col main-summary-col">
            </div>
        </div>
    `;  
}

export async function getSummary(access_token) {
    await getFolderItems(config.BCACFolderId, access_token).then(consortia => {
        let dataObject = {}
        dataObject['BCAC'] = {};
        dataObject['BCAC'].studyEntries = {};
        dataObject['BCAC'].id = {};
        dataObject['BCAC'].id = config.BCACFolderId;
        let studyEntries = consortia.entries;
        studyEntries = studyEntries.filter(data => nonStudyFolder.indexOf(data.name.toLowerCase().trim()) === -1)
        document.getElementById('studyCount').textContent = studyEntries.length;
        studyEntries.forEach(async study => {
            const studyName = study.name;
            const studyId = study.id;

            dataObject['BCAC'].studyEntries[studyName] = {};
            dataObject['BCAC'].studyEntries[studyName].id = {};
            dataObject['BCAC'].studyEntries[studyName].id = parseInt(studyId);
            dataObject['BCAC'].studyEntries[studyName].dataEntries = {};
            
            await getFolderItems(studyId, access_token).then(data => {
                let dataEntries = data.entries;
                dataEntries = dataEntries.filter(dt => dt.name.toLowerCase().trim() !== 'samples');
                
                let dataCountElement = document.getElementById('dataCount')
                dataCountElement.textContent = parseInt(dataCountElement.textContent) + dataEntries.length;

                dataEntries.forEach(async dt => {
                    const dataName = dt.name;
                    const dataId = dt.id;
                    dataObject['BCAC'].studyEntries[studyName].dataEntries[dataName] = {};
                    dataObject['BCAC'].studyEntries[studyName].dataEntries[dataName].id = {};
                    dataObject['BCAC'].studyEntries[studyName].dataEntries[dataName].id = parseInt(dataId);
                    dataObject['BCAC'].studyEntries[studyName].dataEntries[dataName].fileEntries = {};

                    await getFolderItems(dataId, access_token).then(files => {
                        let fileEntries = files.entries;
                        fileEntries = fileEntries.filter(file => file.type === 'file' && file.name.slice(file.name.lastIndexOf('.')+1, file.name.length) === 'txt');
                        fileEntries.forEach(async dataFile => {
                            const fileName = dataFile.name;
                            const fileId = dataFile.id;
                            dataObject['BCAC'].studyEntries[studyName].dataEntries[dataName].fileEntries[fileName] = {};
                            dataObject['BCAC'].studyEntries[studyName].dataEntries[dataName].fileEntries[fileName].id = {};
                            dataObject['BCAC'].studyEntries[studyName].dataEntries[dataName].fileEntries[fileName].id = parseInt(fileId);
                            dataObject['BCAC'].studyEntries[studyName].dataEntries[dataName].fileEntries[fileName].data = {};
                            let txt = await getFile(fileId, access_token);
                            let dt=txt2dt(txt);
                            dataObject['BCAC'].studyEntries[studyName].dataEntries[dataName].fileEntries[fileName].data = dt;
                            let caseCountElement = document.getElementById('caseCountSummary');
                            caseCountElement.textContent = parseInt(caseCountElement.textContent) + dt.tab.BCAC_ID.length;
                            document.getElementById('dataSummaryDiv').setAttribute('data-data-summary', JSON.stringify(dataObject));
                            document.getElementById('consortiaOption').hidden = false;
                        });
                    });
                });
            });
        });
        
    });
}

export const countSpecificStudy = folderId => {
    let dataObject = JSON.parse(document.getElementById('dataSummaryDiv').dataset.dataSummary);
    for(let consortia in dataObject){
        if(dataObject[consortia].id === folderId){
            let studyDropDown = document.getElementById('studyDropDown');
            studyDropDown.innerHTML = studyDropDownTemplate(dataObject[consortia].studyEntries);
            document.getElementById('studyCount').textContent = Object.keys(dataObject[consortia].studyEntries).length
            let studyOptions = document.getElementById('studyOptions');
            studyOptions.addEventListener('change', () => {
                if(studyOptions.value === "") return;
                countSpecificData(parseInt(studyOptions.value));
            });
        }
    }
};

const countSpecificData = async folderId => {
    let dataObject = JSON.parse(document.getElementById('dataSummaryDiv').dataset.dataSummary);
    for(let consortia in dataObject){
        const studyEntries = dataObject[consortia].studyEntries;
        for(let study in studyEntries){
            const studyId = dataObject[consortia].studyEntries[study].id;
            const dataEntries = studyEntries[study].dataEntries;
            if(studyId === folderId){
                document.getElementById('dataCount').textContent = Object.keys(dataEntries).length;
                let caseCounter = 0;
                for(let data in dataEntries){
                    const fileEntries = dataEntries[data].fileEntries;
                    for(let file in fileEntries){
                        const caseData = fileEntries[file].data.tab;
                        caseCounter += caseData.BCAC_ID.length;
                    };
                };
                document.getElementById('caseCountSummary').textContent = caseCounter;

                let dataDropDown = document.getElementById('dataDropDown');
                dataDropDown.innerHTML = dataDropDownTemplate(dataEntries);
                let dataOptions = document.getElementById('dataOptions');
                dataOptions.addEventListener('change', () => {
                    if(dataOptions.value === "") return;
                    countSpecificCases(parseInt(dataOptions.value));
                });
            };
        };
    };
};

const countSpecificCases = async folderId => {
    let dataObject = JSON.parse(document.getElementById('dataSummaryDiv').dataset.dataSummary);
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
                        const caseData = fileEntries[file].data.tab;
                        caseCounter += caseData.BCAC_ID.length;
                    };
                    document.getElementById('caseCountSummary').textContent = caseCounter;
                };
            };
        };
    };
};
