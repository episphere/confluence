export const template = () => {
    return `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Description of Data Access Process</h1>
                    </div>
                </div>
                <div class="data-submission div-border font-size-18" style="padding-left: 1rem;">
                    <div class="row m-0">
                        The data access request process is described below:
                    </div>
                    <div class="row m-0">
                        <ul>
                            <li> Step 1: Researcher explores summary data to evaluate feasibility of proposed studies. </li>
                            <li> Step 2: Researcher submits a study concept describing their project. The concept is sent to the relevant consortia <a href="#join/overview" target="_blank" rel="noopener noreferrer"> data access coordinating committees (DACCs)</a> for their review. </li>
                            <li> Step 3: After a concept is approved by the relevant DACCs, the individual studies contributing the requested data are notified and given the option to participate in the approved project. </li>
                            <li> Step 4: Researcher signs a data transfer agreement (DTA) with each of the relevant consortium data coordinating centers (DCCs) governing the requested data. </li>
                            <li> Step 5: Researcher receives access to the request data from the DCCs. </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export const templateAfterLogin = () => {
    return `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Description of Data Access Process</h1>
                    </div>
                </div>
                <div class="data-submission div-border font-size-18" style="padding-left: 1rem;">
                    <div class="row m-0">
                        The data access request process is described below:
                    </div>
                    <div class="row m-0">
                        <ul>
                            <li> Step 1: Researcher explores summary data to evaluate feasibility of proposed studies. </li>
                            <li> Step 2: Researcher submits a <a href="#data_form" target="_blank" rel="noopener noreferrer">study concept</a> describing their project. The concept is sent to the relevant consortia <a href="#join/description" target="_blank" rel="noopener noreferrer"> data access coordinating committees (DACCs)</a> for their review. </li>
                            <li> Step 3: After a concept is approved by the relevant DACCs, the individual studies contributing the requested data are notified and given the option to participate in the approved project. </li>
                            <li> Step 4: Researcher signs a data transfer agreement (DTA) with each of the relevant consortium data coordinating centers (DCCs) governing the requested data (see <a href="#join/overview" target="_blank" rel="noopener noreferrer"> Participating Consortia for list of DCCs </a>). </li>
                            <li> Step 5: Researcher receives access to the request data from the DCCs. </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}
