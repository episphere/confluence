import { getFolderItems, getFile } from "../shared.js";
import { config } from "../config.js";
import { studyDropDownTemplate, dataDropDownTemplate } from "../components/elements.js";
import { txt2dt, generateSummaryViz } from "../visulization.js";
const nonStudyFolder = ['users', 'protocols', 'consents'];

export const template = () => {
    return `
        <div class="main-summary-row">
            <div class="interactive-stats">
                <div class="summary-inner-col">
                    <label for="consortiaOption" class="interactive-summary-label">Consortia</label></br>
                    <span><i class="fas fa-3x fa-layer-group"></i></span>
                    <span class="data-summary-count" id="consortiaCount">1</span></br>
                    <select multiple class="dropdown-options" id="consortiaOption" hidden=true>
                        <option value="${config.BCACFolderId}">BCAC</option>
                    </select>
                </div>
                <div class="summary-inner-col">
                    <span class="interactive-summary-label">Studies</span></br>
                    <span><i class="fas fa-3x fa-university"></i></span>
                    <span class="data-summary-count" id="studyCount">0</span></br>
                    <div id="studyDropDown"></div>
                </div>
                <div class="summary-inner-col">
                    <span class="interactive-summary-label">Data Types</span></br>
                    <span><i class="fas fa-3x fa-database"></i></span>
                    <span class="data-summary-count" id="dataCount">0</span></br>
                    <div id="dataDropDown"></div>
                </div>
                <div class="summary-inner-col">
                    <span class="interactive-summary-label">Cases</span></br>
                    <input type="checkbox" class="cases-controls-chkbox" checked id="casesCheckBox"> <i for="casesCheckBox" class="fas fa-3x fa-user"></i>
                    <span class="data-summary-count" id="caseCount">0</span>
                </div>
                <div class="summary-inner-col">
                    <span class="interactive-summary-label">Controls</span></br>
                    <input type="checkbox" class="cases-controls-chkbox" checked id="controlsCheckBox"> <i for="controlsCheckBox" class="fas fa-3x fa-user"></i>
                    <span class="data-summary-count" id="controlCount">0</span>
                </div>
            </div>
            <div class="row">
                <div class="row main-summary-col">
                    <div id="dataSummaryParameter"></div>
                    <div id="dataSummaryViz"></div>
                </div>
            </div>
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
        
        await getFolderItems(studyId).then(data => {
            let dataEntries = data.entries;
            dataEntries = dataEntries.filter(dt => dt.name.toLowerCase().trim() !== 'samples');
            
            let dataCountElement = document.getElementById('dataCount')
            dataCountElement.textContent = parseInt(dataCountElement.textContent) + dataEntries.length;

            dataEntries.forEach(async (dt, dataIndex) => {
                const dataName = dt.name;
                const dataId = parseInt(dt.id);
                dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId] = {};
                dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].name = dataName;
                dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].type = dt.type;
                dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries = {};

                await getFolderItems(dataId).then(files => {
                    let fileEntries = files.entries;
                    fileEntries = fileEntries.filter(file => file.type === 'file' && file.name.slice(file.name.lastIndexOf('.')+1, file.name.length) === 'txt');
                    fileEntries.forEach(async (dataFile, fileIndex) => {
                        const fileName = dataFile.name;
                        const fileId = parseInt(dataFile.id);
                        dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId] = {};
                        dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].name = fileName;
                        dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].type = dataFile.type;
                        dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].cases = 0;
                        dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].controls = 0;
                        let txt = await getFile(fileId);
                        let dt=txt2dt(txt);
                        
                        if(dt.tab && dt.tab.status){
                            const numberOfCases = dt.tab.status.filter(value => value === "1").length;
                            const numberOfControls = dt.tab.status.filter(value => value === "0").length;
                            dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].cases = numberOfCases;
                            dataObject[consortiaFolderId].studyEntries[studyId].dataEntries[dataId].fileEntries[fileId].controls = numberOfControls
                            let caseCountElement = document.getElementById('caseCount');
                            caseCountElement.textContent = parseInt(caseCountElement.textContent) + numberOfCases;
                            let controlCountElement = document.getElementById('controlCount');
                            controlCountElement.textContent = parseInt(controlCountElement.textContent) + numberOfControls;
                        }
                        
                        
                        if(localStorage.data_summary) delete localStorage.data_summary;
                        localStorage.data_summary = JSON.stringify(dataObject);
                        if(studyIndex === studyEntries.length - 1 && dataIndex === dataEntries.length -1 && fileIndex === fileEntries.length -1){
                            setTimeout(()=>{
                                const consortiaOptions = document.getElementById('consortiaOption');
                                consortiaOptions.hidden = false;
                                consortiaOptions.options[0].selected = true;
                                consortiaOptions.dispatchEvent(new Event('change'));
                            }, 1500);
                        }
                    });
                });
            });
        });
    });
}

export const countSpecificStudy = (folderId) => {
    let dataObject = JSON.parse(localStorage.data_summary);
    if(dataObject[folderId]){
        const studyEntries = dataObject[folderId].studyEntries;
        let studyDropDown = document.getElementById('studyDropDown');
        studyDropDown.innerHTML = studyDropDownTemplate(studyEntries, 'studyOptions');
        document.getElementById('studyCount').textContent = Object.keys(studyEntries).length
        let studyOptions = document.getElementById('studyOptions');
        studyOptions.addEventListener('change', () => {
            if(studyOptions.value === "") return;
            document.getElementById('dataSummaryParameter').innerHTML = '';
            document.getElementById('dataSummaryViz').innerHTML = '';
            var selectedValues = [];
            for (var i = 0; i < studyOptions.options.length; i++) {
                if (studyOptions.options[i].selected) {
                    selectedValues.push(studyOptions.options[i].value);
                }
            };
            countSpecificData(selectedValues, studyEntries);
        });
        Array.from(studyOptions.options).forEach(element => {
            element.selected = true;
        });
        studyOptions.dispatchEvent(new Event('change'));
    };
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

const countSpecificData = async (selectedValues, studyEntries) => {
    let template = '';
    template += `<select multiple id="dataOptions" class="dropdown-options">`;
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
                template += `<option data-parent-id="${selectedValues.toString()}" value="${dataEntries[dataId].name}">${dataEntries[dataId].name}</option>`;
            }
        }
    });
    template += `</select>`
    let dataDropDown = document.getElementById('dataDropDown');
    dataDropDown.innerHTML = template;

    document.getElementById('dataCount').textContent = dataCounter;
    document.getElementById('caseCount').textContent = caseCounter;
    document.getElementById('controlCount').textContent = controlCounter;
    
    let dataOptions = document.getElementById('dataOptions');
    dataOptions.addEventListener('change', () => {
        if(dataOptions.value === "") return;
        var selectedDataOptions = [];

        Array.from(dataOptions.options).forEach(element => {
            if(element.selected){
                selectedDataOptions.push(element.value);
            }
        });
        console.log(selectedDataOptions);
        // countSpecificCases(parseInt(dataOptions.value), dataEntries);
    });
    Array.from(dataOptions).forEach(element => {
        element.selected = true;
    });
    dataOptions.dispatchEvent(new Event('change'));
};

const countSpecificCases = async (folderId, dataEntries) => {
    for(let data in dataEntries){
        const dataId = dataEntries[data].id;
        if(dataId === folderId){
            const fileEntries = dataEntries[data].fileEntries;
            for(let file in fileEntries){
                const fileId = fileEntries[file].id;
                
                document.getElementById('dataSummaryParameter').innerHTML = '';
                document.getElementById('dataSummaryViz').innerHTML = '';
                generateSummaryViz(fileId, file);
            };
        };
    };
};
