export const studyDropDownTemplate = (entries, studyOptionsId) => {
    let template = '';
    template += `<select id="${studyOptionsId}" class="form-control">
            <option disabled selected> -- select a study -- </option>
        `;
    for(let studyName in entries){
        template += `<option value="${entries[studyName].id}">${studyName}</option>`
    }
    template += '</select>';
    return template;
};

export const dataDropDownTemplate = (entries, dataOptionsId) => {
    let template = '';
    template += `<select id="${dataOptionsId}" class="form-control">
            <option disabled selected> -- select a data -- </option>
        `;
    for(let dataName in entries){
        template += `<option value="${entries[dataName].id}">${dataName}</option>`
    }
    template += '</select>';
    return template;
};

export const fileDropDownTemplate = (entries, fileOptionsId) => {
    let template = '';
    template += `<select id="${fileOptionsId}" class="form-control">
            <option disabled selected> -- select a file -- </option>
        `;
    for(let fileName in entries){
        template += `<option value="${entries[fileName].id}">${fileName}</option>`
    }
    template += '</select>';
    return template;
};

export const parametersDropDownTemplate = (fileName, parameters) => {
    let template = '';
    template += `${fileName}</br></br>
            <select id="parametersDropDown" class="form-control">
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