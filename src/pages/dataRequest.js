const dataAccessBody = () => `
    <div class="mb-4 lead">
        The Confluence Project is currently open to co-investigators who have contributed data to submit proposals for data access. External researchers will be 
        able to submit proposals after the Confluence Project's first paper is published.
    </div>

    <!-- Section: Request Process -->
    <div class="card mb-4 shadow-sm border-0 bg-white">
        <div class="card-body">
            <h3 class="h5 mb-3" style="color: #0056b3;"><i class="fas fa-clipboard-list me-2"></i> How to request access:</h3>
            <ol class="px-4" style="line-height: 1.6;">
                <li class="mb-2">Submit a study concept through the Confluence Data Platform, describing your project and variables of interest. Your request will be sent to the Data Access Coordinating Committees (DACCs) from the relevant consortia participating in Confluence.</li>
                <li class="mb-2">If approved, contributing studies will be notified and given time to opt in to your project.</li>
                <li class="mb-2">Your institution will sign a Data Transfer Agreement (DTA) with the relevant consortium Data Coordinating Center(s).</li>
                <li class="mb-0">Once the DTAs are signed, access to approved data will be granted.</li>
            </ol>
        </div>
    </div>

    <div class="row">
        <!-- Section: Review Schedule -->
        <div class="col-lg-6 mb-4">
            <div class="h-100 p-3 bg-light border rounded shadow-sm">
                <h3 class="h5 mb-3" style="color: #0056b3;"><i class="fas fa-calendar-alt me-2"></i> Review Schedule</h3>
                <p>DACCs review submitted concepts three times per year, within these windows:</p>
                <ul class="list-unstyled ps-3">
                    <li class="mb-1"><i class="fas fa-check-circle text-success me-2"></i> July 1 – October 31</li>
                    <li class="mb-1"><i class="fas fa-check-circle text-success me-2"></i> November 1 – February 28</li>
                    <li class="mb-1"><i class="fas fa-check-circle text-success me-2"></i> March 1 – June 30</li>
                </ul>
                <small class="text-muted mt-2 d-block">
                    <em>Concepts submitted by the last date of the review windows will be reviewed within that window.</em>
                </small>
            </div>
        </div>

        <!-- Section: Environment -->
        <div class="col-lg-6 mb-4">
            <div class="h-100 p-3 bg-light border rounded shadow-sm">
                <h3 class="h5 mb-3" style="color: #0056b3;"><i class="fas fa-shield-alt me-2"></i> Data Access Environment</h3>
                <p>Individual-level data is accessed through a secure, cloud-based Trusted Research Environment (TRE):</p>
                <ul class="list-unstyled ps-3">
                    <li class="mb-2"><i class="fas fa-ban text-danger me-2"></i> <strong>No Downloads:</strong> Data is not permitted to be downloaded, streamed, or otherwise removed from the TRE.</li>
                    <li><i class="fas fa-coins text-warning me-2"></i> <strong>Associated Costs:</strong> Researchers are responsible for all compute and storage costs associated with their project.</li>
                </ul>
            </div>
        </div>
    </div>

    <!-- Section: Reporting -->
    <div class="card border-0 shadow-sm rounded" style="background-color: #e7f3ff;">
        <div class="card-body">
            <h3 class="h5 mb-2" style="color: #004085;"><i class="fas fa-info-circle me-2"></i> Reporting Requirements</h3>
            <p class="mb-0">
                Analyses stratified by study must suppress exact counts in cells with fewer than 10 observations. 
                These counts should be represented as <strong>"&lt;10"</strong>. Any statistics derived from cells with &lt;10 observations must be presented in a way that does not allow back-calculation of the exact number of individuals.
            </p>
        </div>
    </div>
`;

export const template = () => {
    return `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Data Access Process</h1>
                    </div>
                </div>
                <div class="data-submission div-border font-size-18 black-font p-4">
                    ${dataAccessBody()}
                </div>
            </div>
        </div>
    `;
};

export const templateAfterLogin = template;
