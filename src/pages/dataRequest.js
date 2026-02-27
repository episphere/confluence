export const template = () => {
    return `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Data Access Process</h1>
                    </div>
                </div>
                <div class="data-submission div-border font-size-18 black-font" style="padding-left: 1rem;">
                    <div class="mb-3">
                        The Confluence Project is currently open to collaborators directly participating in the Confluence Project to submit proposals to request access to data shared with the project.  Researchers outside of the Confluence Project will be able to submit study proposals around the time of publication of the first paper. Data access will be in accordance to data use agreements signed between participating studies and the Data Coordinating Centers from consortia participating in Confluence.                    </div>
                    <div class="row m-0">The following data access procedures will be facilitated through this platform:</div>
                    <div class="row px-5">
                        <ul>
                            <li> Researcher submits a study concept describing the project, including variables of interest, via the Confluence Data Platform. This request will be sent to the relevant consortia data access coordinating committees (DACCs) that govern the requested data.</li>
                            <li> After approval by the relevant consortia DACCs, individual studies contributing data will be notified and given a time period to determine if their study will participate in the approved project. </li>
                            <li> After this period has elapsed, the researcher's institution will sign a data transfer agreement (DTA) for the study concept with each of the relevant consortium data coordinating center(s) governing the data. </li>
                            <li> Upon DTA signatures, the data coordinating center(s) will be able to provide access to the approved data.</li>
                        </ul>
                    </div>
                    <div class="row m-0">The participating DACCs will review submitted concepts three times a year, according to the following 4-month submission windows:</div>
                    <div class="row px-5">
                        <ul>
                            <li> July 1 - October 31</li>
                            <li> November 1 - February 28</li>
                            <li> March 1 - June 30</li>
                        </ul>
                    </div>
                    <div class="row m-0">Access to individual level data will be provided through a secure, cloud-based, trusted, research environment (TRE). Data will not be permitted to be downloaded, streamed, or otherwise, removed from the TRE. Researchers that are approved to access data on the TRE are responsible for paying the compute and data storage costs associated with their approved concept.</div>
                    <div class="m-0">Analyses of Confluence Project data that are <b>stratified by study</b> must suppress exact counts in cells with fewer than 10 observations (<10). These counts should be represented as "<10." Additionally, any statistical test statistics derived from cells with <10 observations must be presented in a way that does not allow back-calculation of the exact number of individuals in those cells. </div>
                </div>
            </div>
        </div>
    `;
};

export const templateAfterLogin = () => {
    return `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Data Access Process</h1>
                    </div>
                </div>
                <div class="data-submission div-border font-size-18 black-font" style="padding-left: 1rem;">
                    <div class="mb-3">
                        The Confluence Project is currently open to collaborators directly participating in the Confluence Project to submit proposals to request access to data shared with the project.  Researchers outside of the Confluence Project will be able to submit study proposals around the time of publication of the first paper. Data access will be in accordance to data use agreements signed between participating studies and the Data Coordinating Centers from consortia participating in Confluence.                    </div>
                    <div class="row m-0">The following data access procedures will be facilitated through this platform:</div>
                    <div class="row px-5">
                        <ul>
                            <li> Researcher submits a study concept describing the project, including variables of interest, via the Confluence Data Platform. This request will be sent to the relevant consortia data access coordinating committees (DACCs) that govern the requested data.</li>
                            <li> After approval by the relevant consortia DACCs, individual studies contributing data will be notified and given a time period to determine if their study will participate in the approved project. </li>
                            <li> After this period has elapsed, the researcher's institution will sign a data transfer agreement (DTA) for the study concept with each of the relevant consortium data coordinating center(s) governing the data. </li>
                            <li> Upon DTA signatures, the data coordinating center(s) will be able to provide access to the approved data.</li>
                        </ul>
                    </div>
                    <div class="row m-0">The participating DACCs will review submitted concepts three times a year, according to the following 4-month submission windows:</div>
                    <div class="row px-5">
                        <ul>
                            <li> July 1 - October 31</li>
                            <li> November 1 - February 28</li>
                            <li> March 1 - June 30</li>
                        </ul>
                    </div>
                    <div class="row m-0">Access to individual level data will be provided through a secure, cloud-based, trusted, research environment (TRE). Data will not be permitted to be downloaded, streamed, or otherwise, removed from the TRE. Researchers that are approved to access data on the TRE are responsible for paying the compute and data storage costs associated with their approved concept.</div>
                    <div class="m-0">Analyses of Confluence Project data that are <b>stratified by study</b> must suppress exact counts in cells with fewer than 10 observations (<10). These counts should be represented as "<10." Additionally, any statistical test statistics derived from cells with <10 observations must be presented in a way that does not allow back-calculation of the exact number of individuals in those cells. </div>
                </div>
            </div>
        </div>
    `;
};