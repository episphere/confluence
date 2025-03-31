export const template = () => {
    // return `
    //     <div class="general-bg padding-bottom-1rem">
    //         <div class="container body-min-height">
    //             <div class="main-summary-row">
    //                 <div class="align-left">
    //                     <h1 class="page-header">Data Access Process</h1>
    //                 </div>
    //             </div>
    //             <div class="data-submission div-border font-size-18" style="padding-left: 1rem;">
    //                 <div class="row m-0">
    //                     <ul>
    //                         <li> Step 1: Researcher explores summary data to evaluate feasibility of proposed studies. </li>
    //                         <li> Step 2: Researcher submits a study concept describing their project. The concept is sent to the relevant consortia <a href="#join/overview" target="_blank" rel="noopener noreferrer"> data access coordinating committees (DACCs)</a> for their review. </li>
    //                         <li> Step 3: After a concept is approved by the relevant DACCs, the individual studies contributing the requested data are notified and given the option to participate in the approved project. </li>
    //                         <li> Step 4: Researcher signs a data transfer agreement (DTA) with each of the relevant consortium data coordinating centers (DCCs) governing the requested data. </li>
    //                         <li> Step 5: Researcher receives access to the request data from the DCCs. </li>
    //                     </ul>
    //                 </div>
    //             </div>
    //         </div>
    //     </div>
    // `;

    return `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Data Access Process</h1>
                    </div>
                </div>
                <div class="data-submission div-border font-size-18" style="padding-left: 1rem;">
                    <div class="mb-3">
                        The Confluence Project is currently generating genotyping data and harmonizing risk factor and clinical data. This page will be updated when data is available for request by the research community. Data access will be in accordance to data use agreements signed between participating studies and the Data Coordinating Centers from Consortia participating in Confluence.
                    </div>
                    <div class="row m-0">The following data access procedures will be facilitated through this platform:</div>
                    <div class="row m-0">
                        <ul>
                            <li> Researcher submits a study concept describing the project, including variables of interest, via the Confluence Data Platform. This request will be sent via the platform to the relevant consortia data access coordinating committees (DACCs) that govern the requested data.</li>
                            <li> After approval by the relevant consortia DACCs, individual studies contributing data will be notified and given a time period to determine if their study will participate in the approved project. </li>
                            <li> After this period has elapsed, the researcher's institution will sign a data transfer agreement (DTA) for the study concept with each of the relevant consortium data coordinating center(s) governing the data. </li>
                            <li> Upon DTA signatures, the data coordinating center(s) will be able to provide access of the approved data to researchers through the Confluence Data Platform.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export const templateAfterLogin = () => {
    // return `
    //     <div class="general-bg padding-bottom-1rem">
    //         <div class="container body-min-height">
    //             <div class="main-summary-row">
    //                 <div class="align-left">
    //                     <h1 class="page-header">Data Access Process</h1>
    //                 </div>
    //             </div>
    //             <div class="data-submission div-border font-size-18" style="padding-left: 1rem;">

    //                 <div class="row m-0">
    //                     <ul>
    //                         <li> Step 1: Researcher explores summary data to evaluate feasibility of proposed studies. </li>
    //                         <li> Step 2: Researcher submits a <a href="#data_form" target="_blank" rel="noopener noreferrer">study concept</a> describing their project. The concept is sent to the relevant consortia <a href="#join/description" target="_blank" rel="noopener noreferrer"> data access coordinating committees (DACCs)</a> for their review. </li>
    //                         <li> Step 3: After a concept is approved by the relevant DACCs, the individual studies contributing the requested data are notified and given the option to participate in the approved project. </li>
    //                         <li> Step 4: Researcher signs a data transfer agreement (DTA) with each of the relevant consortium data coordinating centers (DCCs) governing the requested data. </li>
    //                         <li> Step 5: Researcher receives access to the request data from the DCCs. </li>
    //                     </ul>
    //                 </div>
    //             </div>
    //         </div>
    //     </div>
    // `;

    return `
    <div class="general-bg padding-bottom-1rem">
        <div class="container body-min-height">
            <div class="main-summary-row">
                <div class="align-left">
                    <h1 class="page-header">Data Access Process</h1>
                </div>
            </div>
            <div class="data-submission div-border font-size-18" style="padding-left: 1rem;">
                <div class="mb-3">
                    The Confluence Project is currently generating genotyping data and harmonizing risk factor and clinical data. This page will be updated when data is available for request by the research community. Data access will be in accordance to data use agreements signed between participating studies and the Data Coordinating Centers from Consortia participating in Confluence.
                </div>
                <div class="row m-0">The following data access procedures will be facilitated through this platform:</div>
                <div class="row m-0">
                    <ul>
                        <li> Researcher submits a study concept describing the project, including variables of interest, via the Confluence Data Platform. This request will be sent via the platform to the relevant consortia data access coordinating committees (DACCs) that govern the requested data.</li>
                        <li> After approval by the relevant consortia DACCs, individual studies contributing data will be notified and given a time period to determine if their study will participate in the approved project. </li>
                        <li> After this period has elapsed, the researcher's institution will sign a data transfer agreement (DTA) for the study concept with each of the relevant consortium data coordinating center(s) governing the data. </li>
                        <li> Upon DTA signatures, the data coordinating center(s) will be able to provide access of the approved data to researchers through the Confluence Data Platform.</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
`;

}
