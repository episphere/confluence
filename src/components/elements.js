export const studyDropDownTemplate = (entries) => {
    let template = '';
    template += `<select id="studyOptions" class="form-control">
            <option disabled selected> -- select a study -- </option>
        `;
    for(let studyName in entries){
        template += `<option value="${entries[studyName].id}">${studyName}</option>`
    }
    template += '</select>';
    return template;
}

export const dataDropDownTemplate = (entries) => {
    let template = '';
    template += `<select id="dataOptions" class="form-control">
            <option disabled selected> -- select a data -- </option>
        `;
    for(let dataName in entries){
        template += `<option value="${entries[dataName].id}">${dataName}</option>`
    }
    template += '</select>';
    return template;
}