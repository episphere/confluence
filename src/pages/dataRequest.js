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
                        The Confluence Project is currently open to co-investigators who have contributed data to submit proposals for data access. External researchers will be 
                        able to submit proposals after the Confluence Project's first paper is published.
                    </div>
                    <div class="m-0"><b>How to request access:</b></div>
                    <div class="px-3">
                        <ul>
                            <li> Submit a study concept through the Confluence Data Platform, describing your project and variables of interest. Your request will be sent to the Data Access Coordinating Committees (DACCs) from the relevant consortia participating in Confluence.</li>
                            <li> If approved, contributing studies will be notified and given time to opt in to your project.</li>
                            <li> Your institution will sign a Data Transfer Agreement (DTA) with the relevant consortium Data Coordinating Center(s).</li>
                            <li> Once the DTAs are signed, access to approved data will be granted.</li>
                        </ul>
                    </div>
                    <div class="mb-1"><b>Review Schedule:</b></div>
                    <div class="mb-1">DACCs review submitted concepts three times per year, within these windows:</div>
                    <div class="px-3">
                        <ul>
                            <li> July 1 - October 31</li>
                            <li> November 1 - February 28</li>
                            <li> March 1 - June 30</li>
                        </ul>
                    </div>
                    <div class="mb-1">Concepts submitted by the last date of the review windows (October 31, February 28, and June 30) will be reivewed within that window.
                    </div>
                    <div class="mb-1"><b>Data access environment:</b></div>
                    <div class="mb-1">All individual-level data is accessed through a secure, cloud-based Trusted Research Environment (TRE). Please note the following conditions:</div>
                    <div class="px-3">
                        <ul>
                            <li> No Downloads: Data is not permitted to be downloaded, streamed, or otherwise removed from the TRE.</li>
                            <li> Associated Costs: Researchers are responsible for all compute and storage costs associated with their approved project.</li>
                        </ul>
                    </div>
                    <div class="mb-1"><b>Reporting requirements:</b></div>
                    <div class="mb-1">Analyses stratified by study must suppress exact counts in cells with fewer than 10 observations. These counts should be represented as "<10”.  Any statistics derived from cells with <10 observations must be presented in a way that does not allow back-calculation of the exact number of individuals in those cells.</div>

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
                        The Confluence Project is currently open to co-investigators who have contributed data to submit proposals for data access. External researchers will be 
                        able to submit proposals after the Confluence Project's first paper is published.
                    </div>
                    <div class="m-0"><b>How to request access:</b></div>
                    <div class="px-3">
                        <ul>
                            <li> Submit a study concept through the Confluence Data Platform, describing your project and variables of interest. Your request will be sent to the Data Access Coordinating Committees (DACCs) from the relevant consortia participating in Confluence.</li>
                            <li> If approved, contributing studies will be notified and given time to opt in to your project.</li>
                            <li> Your institution will sign a Data Transfer Agreement (DTA) with the relevant consortium Data Coordinating Center(s).</li>
                            <li> Once the DTAs are signed, access to approved data will be granted.</li>
                        </ul>
                    </div>
                    <div class="mb-1"><b>Review Schedule:</b></div>
                    <div class="mb-1">DACCs review submitted concepts three times per year, within these windows:</div>
                    <div class="px-3">
                        <ul>
                            <li> July 1 - October 31</li>
                            <li> November 1 - February 28</li>
                            <li> March 1 - June 30</li>
                        </ul>
                    </div>
                    <div class="mb-1">Concepts submitted by the last date of the review windows (October 31, February 28, and June 30) will be reivewed within that window.
                    </div>
                    <div class="mb-1"><b>Data access environment:</b></div>
                    <div class="mb-1">All individual-level data is accessed through a secure, cloud-based Trusted Research Environment (TRE). Please note the following conditions:</div>
                    <div class="px-3">
                        <ul>
                            <li> No Downloads: Data is not permitted to be downloaded, streamed, or otherwise removed from the TRE.</li>
                            <li> Associated Costs: Researchers are responsible for all compute and storage costs associated with their approved project.</li>
                        </ul>
                    </div>
                    <div class="mb-1"><b>Reporting requirements:</b></div>
                    <div class="mb-1">Analyses stratified by study must suppress exact counts in cells with fewer than 10 observations. These counts should be represented as "<10”.  Any statistics derived from cells with <10 observations must be presented in a way that does not allow back-calculation of the exact number of individuals in those cells.</div>

                </div>
            </div>
        </div>
    `;
};