import { countSpecificData, clearGraphAndParameters } from './pages/dataSummary.js';
import { getData } from './visulization.js'

export const addEventStudiesCheckBox = (dataObject, folderId) => {
    const studiesCheckBox = document.getElementsByName('studiesCheckBox');
    let selectedValues = [];

    Array.from(studiesCheckBox).forEach(element => {
        element.addEventListener('click', () => {
            const studyId = element.value;
            if(element.checked === true){
                selectedValues.push(studyId);
                countSpecificData(selectedValues, dataObject[folderId].studyEntries);
            }else{
                selectedValues.splice(selectedValues.indexOf(studyId), 1);
                if(checkBoxchecker(studiesCheckBox) === false) {
                    document.getElementById('dataDropDown').hidden = true;
                    document.getElementById('dataCount').textContent = '0';
                    document.getElementById('caseCount').textContent = '0';
                    document.getElementById('controlCount').textContent = '0';
                    clearGraphAndParameters();
                }
                if(checkBoxchecker(studiesCheckBox) === true) countSpecificData(selectedValues, dataObject[folderId].studyEntries);
            }
        });
    });
};

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
                const elementValue = element.nextElementSibling.innerHTML;
                if(elementValue.toLowerCase().trim().indexOf(keyword) === -1){
                    element.parentNode.style.display = "none";
                }
            });
        };
    });
};

export const addEventSelectAllStudies = () => {
    const studySelectAll = document.getElementById('studySelectAll');
    studySelectAll.addEventListener('click', () => {
        const studiesCheckBox = document.getElementsByName('studiesCheckBox');
        if(studySelectAll.checked === true){
            Array.from(studiesCheckBox).forEach(element => {
                if(element.checked === false && element.parentNode.style.display !== "none"){
                    element.checked = true;
                    element.dispatchEvent(new Event('click'));
                }
            });
        }
        else{
            Array.from(studiesCheckBox).forEach(element => {
                element.checked = false;
            });
            Array.from(studiesCheckBox).forEach(element => {
                element.dispatchEvent(new Event('click'));
            });
            document.getElementById('dataCount').textContent = '0';
            document.getElementById('caseCount').textContent = '0';
            document.getElementById('controlCount').textContent = '0';
        }
    });
};

export const addEventDataTypeCheckBox = (studyEntries) => {
    let values = [];
    const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');

    Array.from(dataTypeCheckBox).forEach(element => {
        element.addEventListener('click', () => {
            const value = element.value;
            const studyIds = element.dataset.studyId.split(',');
            if(element.checked){
                values.push(value);
                getData(studyEntries, studyIds, values);
            }
            else{
                values.splice(values.indexOf(value), 1);
                if(checkBoxchecker(dataTypeCheckBox) === true) {
                    getData(studyEntries, studyIds, values);
                }else{
                    clearGraphAndParameters();
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

export const addEventSelectAllDataType = () => {
    const dataTypeSelectAll = document.getElementById('dataTypeSelectAll');
    dataTypeSelectAll.addEventListener('click', () => {
        const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
        if(dataTypeSelectAll.checked === true){
            Array.from(dataTypeCheckBox).forEach(element => {
                if(element.checked === false && element.parentNode.style.display !== "none"){
                    element.checked = true;
                    element.dispatchEvent(new Event('click'));
                }
            });
        }
        else{
            Array.from(dataTypeCheckBox).forEach(element => {
                element.checked = false;
            });
            Array.from(dataTypeCheckBox).forEach(element => {
                element.dispatchEvent(new Event('click'));
            });
        }
    });
};

const checkBoxchecker = (chkbox) => {
    let checkElements = false;
    Array.from(chkbox).forEach(element => {
        if(checkElements === true) return;
        checkElements = element.checked;
    });
    return checkElements;
};