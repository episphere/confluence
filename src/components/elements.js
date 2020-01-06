import { config } from "../config.js";

export const studyDropDownTemplate = (entries) => {
    let template = '';
    
    for(let studyId in entries){
        template += `<li>
                        <label><input type="checkbox" class="chk-box-margin" name="studiesCheckBox" data-study-name="${entries[studyId].name}" value="${studyId}"/>${entries[studyId].name}</label>
                    </li>`
    }
    
    return template;
};

export const renderConsortium = () => {
    let obj = JSON.parse(localStorage.data_summary);
    let template = '';
    for(let ID in obj){
        template += `
                    <li><input type="radio" aria-labelledby="labelConsortia" class="chk-box-margin" name="consortiaCheckBox" value="${ID}"/><label>${obj[ID].name}</label></li>
                    `;
    }
    return template;
}

export const parameterListTemplate = (jsonData) => {
    let parameters = [];
    let template = ''
    let selectedVariable = '';
    const dataSummaryVizChart2 = document.getElementById('dataSummaryVizChart2');
    if(dataSummaryVizChart2.dataset.selectedVariable && dataSummaryVizChart2.dataset.selectedVariable !== ""){
        selectedVariable = dataSummaryVizChart2.dataset.selectedVariable
    }
    if(!jsonData){
        document.getElementById('variableLabel').innerHTML = 'Most useful variables';
        document.getElementById('parameterList').classList.remove('list-variables');
        if(document.getElementById('toggleVariable')){
            document.getElementById('toggleVariable').innerHTML = 'Show All <i class="fas fa-caret-down"></i>';
        }else{
            document.getElementById('showAllVariables').innerHTML = '<a href="#" id="toggleVariable">Show All <i class="fas fa-caret-down"></i></a>';
        }
        parameters = ['ER_statusIndex', 'ethnicityClass', 'famHist', 'contrType'];
        parameters.forEach((param) => {
            template += `<a class="list-group-item variableItem ${param === selectedVariable ? `active`: ``}" href="#">${param}</a>`
        });
    }
    else{
        const parametersLength = jsonData.map(d => Object.keys(d).length);
        if(parametersLength.length === 0) return;
        // let maximumparameters = Math.max(...parametersLength);
        let maximumparameters = Math.max.apply(parametersLength);
        parameters = Object.keys(jsonData[parametersLength.indexOf(maximumparameters)]);
        parameters.sort();
        
        document.getElementById('variableLabel').innerHTML = 'All variables';
        document.getElementById('parameterList').classList.add('list-variables');
        if(document.getElementById('toggleVariable')){
            document.getElementById('toggleVariable').innerHTML = 'Show Less <i class="fas fa-caret-up"></i>';
        }else{
            document.getElementById('showAllVariables').innerHTML = '<a href="#" id="toggleVariable">Show Less <i class="fas fa-caret-up"></i></a>';
        }

        parameters.forEach((param) => {
            if(config.invalidVariables.indexOf(param.trim().toLowerCase()) !== -1) return;
            template += `<a class="list-group-item variableItem ${param === selectedVariable ? `active`: ``}" href="#">${param}</a>`
        });
    }    
    return template;
}

export const alertTemplate = (className, message) => {
    return `
        <div class="alert ${className} alert-dismissible">
            <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
            ${message}
        </div>
    `;
}

export const renderForm = () => {
    return `
        <div class="col">
            <form id="consortiaIdForm">
                <label>Consortia Id / Box Folder Id
                    <div class="form-group">
                        <input type="text" class="form-control" required id="boxFolderId" placeholder="Enter Consortia ID / Box Folder ID" title="Consortia ID / Box Folder ID">
                    </div>
                    <div class="form-group">
                        <button id="submit" title="Submit" class="btn btn-light sub-div-shadow" title="Submit">Submit</button>
                    </div>
                </label>
            </form>
        </div>
    `;
}