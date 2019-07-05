export const studyDropDownTemplate = (entries) => {
    let template = '';
    
    for(let studyId in entries){
        template += `<li>
                    <input type="checkbox" class="chk-box-margin" name="studiesCheckBox" value="${studyId}"/>
                    <label>${entries[studyId].name}</label>
                </li>`
    }
    
    return template;
};

export const parameterListTemplate = (jsonData) => {
    let parameters = [];
    let template = ''
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
            template += `<a class="list-group-item list-group-item-action variableItem" href="#">${param}</a>`
        });
    }
    else{
        const parametersLength = jsonData.map(d => Object.keys(d).length);
        if(parametersLength.length === 0) return;
        let maximumparameters = Math.max(...parametersLength);
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
            template += `<a class="list-group-item list-group-item-action variableItem" href="#">${param}</a>`
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