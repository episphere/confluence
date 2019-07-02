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

export const dataDropDownTemplate = (entries, dataOptionsId) => {
    let template = '';
    template += `<select multiple id="${dataOptionsId}" class="dropdown-options">`;
    for(let dataName in entries){
        template += `<option value="${entries[dataName].id}">${dataName}</option>`
    }
    template += '</select>';
    return template;
};

export const parametersDropDownTemplate = (data) => {
    const parametersLength = data.map(d => Object.keys(d).length);
    let maximumparameters = Math.max(...parametersLength);
    let parameters = Object.keys(data[parametersLength.indexOf(maximumparameters)]);
    parameters.sort();
    let template = '';
    template += `
            <select id="parametersDropDown" class="dropdown-options custom__form-control">
                <option disabled selected> -- select a parameter -- </option>
            `;
    parameters.forEach(parameter => {
        template += `<option value="${parameter}">${parameter}</option>`
    });
    template += '</select>';
    return template;
};

export const dataExplorationTable = (fileData, all) => {
    let template = '';
    template += '<table class="table table-hover table-condensed table-bordered">';
    
    template += '<thead><tr>';
    all[0].forEach(fields => {
        template += `<th>${fields}</th>`;
    });
    template += '</tr></thead>';

    template += '<tbody>';
    for(let index = 0; index < fileData.length; index++){
        if(index !== 0){
            template += '<tr>';
            fileData[index].forEach(fields => {
                template += `<td>${fields}</td>`;
            });
            template += '</tr>';
        };
    };
    template += '</tbody></table>';
    return template;
};

export const alertTemplate = (className, message) => {
    return `
        <div class="alert ${className} alert-dismissible">
            <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
            ${message}
        </div>
    `;
}