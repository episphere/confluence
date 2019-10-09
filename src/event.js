import { countSpecificData, clearGraphAndParameters } from './pages/dataExploration.js';
import { getData, generateDCChart, renderPieChart } from './visulization.js'
import { showAnimation, disableCheckBox, removeActiveClass, uploadFile, createFolder } from './shared.js';
import { parameterListTemplate } from './components/elements.js';
import { variables } from './variables.js';

export const addEventStudiesCheckBox = (dataObject, folderId) => {
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    Array.from(studiesCheckBox).forEach(element => {
        element.addEventListener('click', () => {
            clearGraphAndParameters();
            const selectedValues = getAllSelectedStudies();
            if(selectedValues.length > 0){
                showAnimation();
                disableCheckBox(true);
                countSpecificData(selectedValues, dataObject[folderId].studyEntries);
            }
            else{
                document.getElementById('dataDropDown').hidden = true;
                document.getElementById('dataCount').textContent = '0';
            }
        });
    });
};

const getAllSelectedStudies = () => {
    let selectedValues = [];
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    Array.from(studiesCheckBox).forEach(element => {
        if(element.checked) selectedValues.push(element.value);
    });
    return selectedValues;
}

const triggerEventStudies = (studyEntries) => {
    let studyIds = [];
    let values = [];
    const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    
    studiesCheckBox.forEach(element => {
        if(element.checked) studyIds.push(element.value);
    });
    dataTypeCheckBox.forEach(element => {
        if(element.checked) values.push(element.value);
    });

    document.getElementById('dataDropDown').hidden = false;
    if(studyIds.length === 0) document.getElementById('dataDropDown').hidden = true;
    if(studyIds.length === 0 || values.length === 0) {
        clearGraphAndParameters();
    }
    else{
        clearGraphAndParameters();
        showAnimation();
        disableCheckBox(true);
        let dataCount = 0;
        studyIds.forEach(id => {
            dataCount += Object.keys(studyEntries[id].dataEntries).length;
        });
        document.getElementById('dataCount').textContent = dataCount;
        getData(studyEntries, studyIds, values);
    }
}

export const addEventSearchStudies = () => {
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    const searchStudies = document.getElementById('searchStudies');
    searchStudies.addEventListener('keyup', () => {
        const keyword = searchStudies.value.toLowerCase().trim();
        if(keyword === "") {
            Array.from(studiesCheckBox).forEach(element => {
                element.parentNode.style.display = "";
            });
        }
        else{
            Array.from(studiesCheckBox).forEach(element => {
                const elementValue = element.dataset.studyName;
                if(elementValue.toLowerCase().trim().indexOf(keyword) === -1){
                    element.parentNode.style.display = "none";
                }
            });
        };
    });
};

export const addEventSelectAllStudies = (studyEntries) => {
    const studySelectAll = document.getElementById('studySelectAll');
    studySelectAll.addEventListener('click', () => {
        const studiesCheckBox = document.getElementsByName('studiesCheckBox');
        if(studySelectAll.checked === true){
            Array.from(studiesCheckBox).forEach(element => {
                if(element.checked === false && element.parentNode.style.display !== "none"){
                    element.checked = true;
                }
            });
        }
        else{
            Array.from(studiesCheckBox).forEach(element => {
                if(element.checked === true && element.parentNode.style.display !== "none"){
                    element.checked = false;
                }
            });
            document.getElementById('dataCount').textContent = '0';
        };
        triggerEventStudies(studyEntries);
    });
};

export const addEventDataTypeCheckBox = (studyEntries) => {
    let values = [];
    const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
    Array.from(dataTypeCheckBox).forEach(element => {
        element.addEventListener('click', () => {
            clearGraphAndParameters();
            const value = element.value;
            const studyIds = element.dataset.studyId.split(',');

            if(element.checked){
                values.push(value);
                showAnimation();
                disableCheckBox(true);
                clearGraphAndParameters();
                getData(studyEntries, studyIds, values);
            }
            else{
                values.splice(values.indexOf(value), 1);
                if(checkBoxchecker(dataTypeCheckBox) === true) {
                    showAnimation();
                    disableCheckBox(true);
                    clearGraphAndParameters();
                    getData(studyEntries, studyIds, values);
                }
            }
        });
    });
};

export const addEventSearchDataType = () => {
    const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
    const searchdataTypes = document.getElementById('searchdataTypes');
    searchdataTypes.addEventListener('keyup', () => {
        const keyword = searchdataTypes.value.toLowerCase().trim();
        if(keyword === "") {
            Array.from(dataTypeCheckBox).forEach(element => {
                element.parentNode.style.display = "";
            });
        }
        else{
            Array.from(dataTypeCheckBox).forEach(element => {
                const elementValue = element.value;
                if(elementValue.toLowerCase().trim().indexOf(keyword) === -1){
                    element.parentNode.style.display = "none";
                }
            });
        };
    });
};

export const addEventSelectAllDataType = (studyEntries) => {
    const dataTypeSelectAll = document.getElementById('dataTypeSelectAll');
    dataTypeSelectAll.addEventListener('click', () => {
        const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
        if(dataTypeSelectAll.checked === true){
            Array.from(dataTypeCheckBox).forEach(element => {
                if(element.checked === false && element.parentNode.style.display !== "none"){
                    element.checked = true;
                }
            });
        }
        else{
            Array.from(dataTypeCheckBox).forEach(element => {
                if(element.checked === true && element.parentNode.style.display !== "none"){
                    element.checked = false;
                }
            });
        }
        dispatchEventDataTypeSelectAll(studyEntries);
    });
};

const dispatchEventDataTypeSelectAll = (studyEntries) => {
    let studyIds = [];
    let values = [];
    const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    
    studiesCheckBox.forEach(element => {
        if(element.checked) studyIds.push(element.value);
    });
    dataTypeCheckBox.forEach(element => {
        if(element.checked) values.push(element.value);
    });
    if(studyIds.length === 0 || values.length === 0) {
        clearGraphAndParameters();
    }
    else{
        clearGraphAndParameters();
        showAnimation();
        disableCheckBox(true);
        getData(studyEntries, studyIds, values, null);
    }
};

export const addEventVariableItem = (cf, jsonData) => {
    let variableItem = document.getElementsByClassName('variableItem');
    Array.from(variableItem).forEach(element => {
        element.addEventListener('click', () => {
            if(element.classList.contains('active')) return;
            removeActiveClass('variableItem', 'active');
            element.classList.add('active');
            const variable = element.innerHTML;
            renderPieChart(cf, jsonData, variable);
        });
    });
}

export const addEventShowAllVariables = (cf, jsonData) => {
    let showAllVariablesElement = document.getElementById('toggleVariable');
    showAllVariablesElement.addEventListener('click', () => {
        if(showAllVariablesElement.innerHTML === 'Show All <i class="fas fa-caret-down"></i>'){
            let parameterList = document.getElementById('parameterList');
            parameterList.innerHTML = parameterListTemplate(jsonData);
        }
        else {
            let parameterList = document.getElementById('parameterList');
            parameterList.innerHTML = parameterListTemplate();
        }
        addEventVariableItem(cf, jsonData);
    });
}

export const addEventShowPieChart = (cf, jsonData) => {
    let variable = '';
    const showPieChart = document.getElementById('showPieChart');
    showPieChart.childNodes[0].addEventListener('click', () => {
        let variableItem = document.getElementsByClassName('variableItem');
        Array.from(variableItem).forEach(element => {
            if(element.classList.contains('active')) variable = element.innerHTML;
        })
        if(showPieChart.childNodes[0].checked){
            renderPieChart(cf, jsonData, variable, true);
        }
        else{
            renderPieChart(cf, jsonData, variable, false);
        }
    });
}

const checkBoxchecker = (chkbox) => {
    let checkElements = false;
    Array.from(chkbox).forEach(element => {
        if(checkElements === true) return;
        checkElements = element.checked;
    });
    return checkElements;
};

export const addEventConsortiaSelect = () => {
    const element = document.getElementById('selectConsortiaUIS');
    element.addEventListener('change', () => {
        const value = element.value;
        const selectStudyUIS = document.getElementById('selectStudyUIS');
        selectStudyUIS.innerHTML = '';
        const data_summary = JSON.parse(localStorage.data_summary);
        const firstOption = document.createElement('option');
        firstOption.value = '';
        firstOption.text = '-- Select study --'
        selectStudyUIS.appendChild(firstOption);
        if(data_summary && data_summary[value]){
            ['AHS', 'PBCS', 'PLCO', 'USRT'].forEach(study => {
                const option = document.createElement('option');
                option.value = study;
                option.text = study;
                selectStudyUIS.appendChild(option);
            });
        }
    });
}

export const addEventCreateStudyForm = () => {
    
}

export const addEventUploadStudyForm = () => {
    const form = document.getElementById('uploadStudyForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let data_summary = JSON.parse(localStorage.data_summary);
        const consortia = document.getElementById('selectConsortiaUIS');
        const consortiaText = consortia.options[consortia.selectedIndex].text;
        const consortiaId = consortia.value;
        const study = document.getElementById('selectStudyUIS');
        const studyValue = study.value;
        
        let studyId = study.value;
        const studyName = study.options[study.selectedIndex].text;

        const file = document.getElementById('uploadDataUIS').files[0]; 
        const fileName = file.name;
        const fileType = fileName.slice(fileName.lastIndexOf('.')+1, fileName.length);
        if(fileType !== 'txt') {
            alert('File type not supported!');
            return;
        }
        const r = confirm(`Upload ${fileName} in ${consortiaText} >> ${studyName}?`);
        if(r){
            showAnimation();

            if(data_summary[consortiaId] && Object.keys(data_summary[consortiaId].studyEntries).length === 0){
                // No studies exists, create new study
                studyId = await createStudiesAndDataTypes(data_summary, consortiaId, studyValue);
            }
            else if(data_summary[consortiaId] && Object.keys(data_summary[consortiaId].studyEntries).length !== 0){
                const studyEntries = data_summary[consortiaId].studyEntries;
                let checker = false;
                for(const ID in studyEntries){
                    if(studyEntries[ID].name === studyValue){
                        checker = true;
                        studyId = ID;
                    }
                }
                if(!checker){
                    studyId = await createStudiesAndDataTypes(data_summary, consortiaId, studyValue);
                }
            }

            let fileReader = new FileReader();
            fileReader.onload = function(fileLoadedEvent){
                const textFromFileLoaded = fileLoadedEvent.target.result;
                // TO DO: QC
                separateData(textFromFileLoaded, consortiaId, studyId, fileName);
            };

            fileReader.readAsText(file, "UTF-8");
        }
    })
}

const separateData = async (textFromFileLoaded, consortiaId, studyId, fileName) => {
    let rows = textFromFileLoaded.split(/\n/g).map(tx=>tx.split(/\t/g));
    const headings = rows[0];
    rows.splice(0, 1);
    let obj = rows.map(el => {
        let obj = {};
        for (let i = 0; i < el.length; i++) {
        obj[headings[i].trim()] = el[i];
        }
        return obj;
    });
    
    const masterFile = variables.masterFile;
    const core = masterFile.core.map(att => att.toLowerCase());
    const pathology = masterFile.pathology.map(att => att.toLowerCase());
    const riskFactor = masterFile.riskFactor.map(att => att.toLowerCase());
    const survivalTreatment = masterFile.survivalAndTreatment.map(att => att.toLowerCase());
    
    let coreData = [];
    let pathologyData = [];
    let rfData = [];
    let stData = [];
    
    obj.forEach(data => {
        let cObj = {};
        let pObj = {};
        let rfObj = {};
        let stObj = {};

        for(const key in data){

            if(core.indexOf(key.toLowerCase()) !== -1){
                cObj[key] = data[key];
            }

            if(pathology.indexOf(key.toLowerCase()) !== -1){
                pObj[key] = data[key];
            }
            
            if(riskFactor.indexOf(key.toLowerCase()) !== -1){
                rfObj[key] = data[key];
            }

            if(survivalTreatment.indexOf(key.toLowerCase()) !== -1){
                stObj[key] = data[key];
            }
        }

        if(Object.keys(cObj).length > 0) coreData.push(cObj);
        if(Object.keys(pObj).length > 0) pathologyData.push(pObj);
        if(Object.keys(rfObj).length > 0) rfData.push(rfObj);
        if(Object.keys(stObj).length > 0) stData.push(stObj);
    });

    const data_summary = JSON.parse(localStorage.data_summary);
    if(data_summary[consortiaId].studyEntries[studyId].dataEntries){
        const dataFolders = data_summary[consortiaId].studyEntries[studyId].dataEntries;
        for(const folderId in dataFolders){
            if(dataFolders[folderId].name === 'Core Data'){
                await uploadFile(coreData, `${fileName.slice(0, fileName.lastIndexOf('.'))}_Core_Data.json`, folderId);
            }

            if(dataFolders[folderId].name === 'Pathology Data'){
                await uploadFile(pathologyData, `${fileName.slice(0, fileName.lastIndexOf('.'))}_Pathology_Data.json`, folderId);
            }

            if(dataFolders[folderId].name === 'Risk Factor Data'){
                await uploadFile(rfData, `${fileName.slice(0, fileName.lastIndexOf('.'))}_Risk_Factor_Data.json`, folderId);
            }

            if(dataFolders[folderId].name === 'Survival and Treatment Data'){
                await uploadFile(stData, `${fileName.slice(0, fileName.lastIndexOf('.'))}_Survival_and_Treatment_Data.json`, folderId);
            }
        }
        location.reload();
    }
}

const createStudiesAndDataTypes = async (data_summary, consortiaId, studyValue) => {
    const response = await createFolder(consortiaId, studyValue);
    const newStudyId = response.id;
    const newStudyName = response.name;
    const newStudyType = response.type;

    // Create 4 data folders
    const newCData = await createFolder(newStudyId, 'Core Data');
    const newCId = newCData.id;
    const newCName = newCData.name;
    const newCType = newCData.type;

    const newPData = await createFolder(newStudyId, 'Pathology Data');
    const newPId = newPData.id;
    const newPName = newPData.name;
    const newPType = newPData.type;

    const newRFData = await createFolder(newStudyId, 'Risk Factor Data');
    const newRFId = newRFData.id;
    const newRFName = newRFData.name;
    const newRFType = newRFData.type;

    const newSTData = await createFolder(newStudyId, 'Survival and Treatment Data');
    const newSTId = newSTData.id;
    const newSTName = newSTData.name;
    const newSTType = newSTData.type;

    data_summary[consortiaId].studyEntries[newStudyId] = {};
    data_summary[consortiaId].studyEntries[newStudyId].name = newStudyName;
    data_summary[consortiaId].studyEntries[newStudyId].type = newStudyType;
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries = {};

    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newCId] = {};
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newCId].name = newCName;
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newCId].type = newCType;
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newCId].fileEntries = {};

    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newPId] = {};
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newPId].name = newPName;
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newPId].type = newPType;
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newPId].fileEntries = {};

    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newRFId] = {};
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newRFId].name = newRFName;
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newRFId].type = newRFType;
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newRFId].fileEntries = {};

    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newSTId] = {};
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newSTId].name = newSTName;
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newSTId].type = newSTType;
    data_summary[consortiaId].studyEntries[newStudyId].dataEntries[newSTId].fileEntries = {};

    localStorage.data_summary = JSON.stringify(data_summary);
    return newStudyId;
}

export const formSubmit = () => {
    const form = document.getElementById('consortiaIdForm');
    form.addEventListener('submit', e => {
        e.preventDefault();
        const boxFolderId = document.getElementById('boxFolderId').value;
        localStorage.boxFolderId = JSON.stringify({folderId: boxFolderId});
        location.reload();
    });
} 