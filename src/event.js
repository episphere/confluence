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
    const casesCheckBox = document.getElementById('casesCheckBox');
    const controlsCheckBox = document.getElementById('controlsCheckBox');
    let status = null;
    Array.from(dataTypeCheckBox).forEach(element => {
        element.addEventListener('click', () => {
            const value = element.value;
            const studyIds = element.dataset.studyId.split(',');

            if(casesCheckBox.checked && controlsCheckBox.checked) status = null;
            if(!casesCheckBox.checked && controlsCheckBox.checked) status = "0";
            if(casesCheckBox.checked && !controlsCheckBox.checked) status = "1";
            if(element.checked){
                values.push(value);
                getData(studyEntries, studyIds, values, status);
            }
            else{
                values.splice(values.indexOf(value), 1);
                if(checkBoxchecker(dataTypeCheckBox) === true) {
                    getData(studyEntries, studyIds, values, status);
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

export const addEventToggleCharts = () => {
    const barChartBtn = document.getElementById('barChartBtn');
    const lineChartBtn = document.getElementById('lineChartBtn');

    barChartBtn.addEventListener('click', () => {
        document.getElementById('dataSummaryVizLineChart').style.display = 'none';
        document.getElementById('dataSummaryVizBarChart').style.display = '';
        lineChartBtn.classList.add('toggle-chart-link');
        lineChartBtn.classList.remove('chart-active');
        barChartBtn.classList.add('chart-active');
        barChartBtn.classList.remove('toggle-chart-link');
    });
    
    lineChartBtn.addEventListener('click', () => {
        document.getElementById('dataSummaryVizBarChart').style.display = 'none';
        document.getElementById('dataSummaryVizLineChart').style.display = '';
        lineChartBtn.classList.remove('toggle-chart-link');
        lineChartBtn.classList.add('chart-active');
        barChartBtn.classList.remove('chart-active');
        barChartBtn.classList.add('toggle-chart-link');
    });
};

export const addEventCasesControls = (studyEntries) => {
    let status = null;
    let values = [];
    let studiesId = [];
    
    const casesCheckBox = document.getElementById('casesCheckBox');
    const controlsCheckBox = document.getElementById('controlsCheckBox');
    casesCheckBox.addEventListener('click', () => {
        const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
        Array.from(dataTypeCheckBox).forEach(element => {
            if(element.checked){
                values.push(element.value);
                studiesId = element.dataset.studyId.split(',');
            }
        });
        if(casesCheckBox.checked){
            if(controlsCheckBox.checked) status = null;
            if(!controlsCheckBox.checked) status = "1";
            getData(studyEntries, studiesId, values, status);
        }
        else{
            if(controlsCheckBox.checked) status = "0";
            if(!controlsCheckBox.checked) status = null;
            getData(studyEntries, studiesId, values, status);
        }
    });

    controlsCheckBox.addEventListener('click', () => {
        const dataTypeCheckBox = document.getElementsByName('dataTypeCheckBox');
        Array.from(dataTypeCheckBox).forEach(element => {
            if(element.checked){
                values.push(element.value);
                studiesId = element.dataset.studyId.split(',');
            }
        });
        if(controlsCheckBox.checked){
            if(casesCheckBox.checked) status = null;
            if(!casesCheckBox.checked) status = "0";
            getData(studyEntries, studiesId, values, status);
        }
        else{
            if(casesCheckBox.checked) status = "1";
            if(!casesCheckBox.checked) status = null;
            getData(studyEntries, studiesId, values, status);
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