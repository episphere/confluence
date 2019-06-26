import { countSpecificData } from './pages/dataSummary.js';

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
                if(selectedValues.length < 1) {
                    document.getElementById('dataDropDown').hidden = true;
                    document.getElementById('dataCount').textContent = '0';
                    document.getElementById('caseCount').textContent = '0';
                    document.getElementById('controlCount').textContent = '0';
                }
                else{
                    countSpecificData(selectedValues, dataObject[folderId].studyEntries);
                }
            }
        });
    });
}