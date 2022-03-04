export const confluenceResources = () => {
    let template = `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Participating Consortium</h1>
                    </div>
                </div>
                <div class="main-summary-row white-bg div-border">
                    <div class="col font-size-18 align-left">
                        </br>
                        <div>The following breast cancer consortia are participating in Confluence:</div>
                        <div class="consortia-desc">
                            <a href="#join" class="external-url" data-href="http://bcac.ccge.medschl.cam.ac.uk/" data-toggle="modal" data-target="#confluenceMainModal">Breast Cancer Association Consortium</a> (BCAC)</br>
                            The BCAC is a forum of investigators interested in the inherited risk of breast cancer. The aim of the consortium is to combine data from many studies, and to provide a reliable assessment of the risks associated with these gene.
                        </div>

                        <div class="consortia-desc">
                            <a data-href="https://projectreporter.nih.gov/project_info_description.cfm?aid=9040408&icde=30184576&ddparam=&ddvalue=&ddsub=&cr=1&csb=default&cs=ASC" target="__blank">African-ancestry Breast Cancer Genetic Consortium</a> (AABCG)</br>
                            The AABCG is a collaboration of investigators focused on identifying novel genetic susceptibility factors for breast cancer in African-ancestry women and evaluating the influence of germline risk variants on breast cancer biology.
                        </div>

                        <div class="consortia-desc">
                            <a href="mailto:lfejerman@ucdavis.edu">Latin America Genomics Breast Cancer Consortium</a> (LAGENO-BC)</br>
                            LAGENO-BC is a collaborative effort including a multinational team of investigators sharing knowledge and materials to facilitate breast cancer genetics research relevant to the diverse populations of Latin America and its diaspora.
                        </div>

                        <div class="consortia-desc">
                            <a href="mailto:wei.zheng@vanderbilt.edu">Asia Breast Cancer Consortium</a> (ABCC) </br>
                            The ABCC is a GWAS of Asian breast cancer cases and similar number of controls.
                        </div>
                        <div class="consortia-desc">
                            <a href="#join" class="external-url" data-href="http://cimba.ccge.medschl.cam.ac.uk/" data-toggle="modal" data-target="#confluenceMainModal">Consortium of Investigators of Modifiers of BRCA1/2</a> (CIMBA)</br>
                            The CIMBA was formed by a collaborative group of researchers working on genetic modifiers of cancer risk in BRCA1 and BRCA2 mutation carriers. The aim of CIMBA is to provide sufficient sample sizes to allow large scale studies in order to evaluate reliably the effects of genetic modifiers.
                        </div>

                        <div class="consortia-desc">
                            <a href="mailto:nick.orr@qub.ac.uk">Male Breast Cancer Genetics Consortium</a> (MERGE) </br>
                            The MERGE is a GWAS of male breast cancer cases and similar number of controls.
                        </div>

                        <div class="consortia-desc">
                            Studies not part of a breast cancer consortia are participating through a direct collaboration with the National Cancer Institute, Division of Cancer Epidemiology and Genetics.
                        </div>
                        <div class="consortia-desc">
                            For more information:</br>
                            Email: <a href="mailto:ConfluenceProject@nih.gov">ConfluenceProject@nih.gov</a>
                        </div>
                    <div>
                <div>
            <div>
        <div>
    `;
    document.getElementById('confluenceDiv').innerHTML = template;
    handleExternalLinks();
}

const handleExternalLinks = () => {
    const externalLinks = document.querySelectorAll('.external-url');
    externalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const header = document.getElementById('confluenceModalHeader');
            const body = document.getElementById('confluenceModalBody');
            header.innerHTML = `<h5 class="modal-title">Accessing external resource</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>`;
            body.innerHTML = `<div style="margin-bottom: 2rem;">You are now leaving the Confluence Data Platform website to access the ${link.dataset.href}</div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-dark" data-dismiss="modal" aria-label="Close">
                    Cancel
                </button>
                <a href="${link.dataset.href}" target="_blank" class="btn btn-outline-primary">Continue</a>
            </div>`;
        })
    });
}