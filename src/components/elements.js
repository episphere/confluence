export const studyDropDownTemplate = (entries) => {
    return `
        <select id="studyOptions" class="select">
            <option disabled selected> -- select a study -- </option>
            ${entries.map((value) => `
                <option value="${value.id}">${value.name}</option>
            `.trim()).join('')}
        </select>
    `;
}

export const dataDropDownTemplate = (entries) => {
    return `
        <select id="dataOptions" class="select">
            <option disabled selected> -- select a data -- </option>
            ${entries.map((value) => `
                <option value="${value.id}">${value.name}</option>
            `.trim()).join('')}
        </select>
    `;
}