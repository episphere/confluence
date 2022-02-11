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
                        <div>Participate in Confluence by joining one of the following breast cancer consortia:</div>
                        <div class="consortia-desc">
                            <a href="http://bcac.ccge.medschl.cam.ac.uk/" target="__blank">Breast Cancer Association Consortium</a> (BCAC)</br>
                            The BCAC is a forum of investigators interested in the inherited risk of breast cancer. The aim of the consortium is to combine data from many studies, and to provide a reliable assessment of the risks associated with these gene.
                        </div>

                        <div class="consortia-desc">
                            <a href="https://projectreporter.nih.gov/project_info_description.cfm?aid=9040408&icde=30184576&ddparam=&ddvalue=&ddsub=&cr=1&csb=default&cs=ASC" target="__blank">African Ancestry Breast Cancer Genetic Study</a> (AABCGS)</br>
                            The AABCGS is a GWAS of African-American breast cancer cases and similar number of controls.
                        </div>

                        <div class="consortia-desc">
                            <a href="mailto:lfejerman@ucdavis.edu">Latin America Genomics Breast Cancer Consortium</a> (LAGENO-BC)</br>
                            The LAGENO is a forum of investigators interested in the inherited risk of breast cancer. The aim of the consortium is to combine data from many studies, and to provide a reliable assessment of the risks associated with these gene.
                        </div>

                        <div class="consortia-desc">
                            <a href="mailto:wei.zheng@vanderbilt.edu">Asia Breast Cancer Consortium</a> (ABCC)</br>
                            The ABCC is a GWAS of Asian breast cancer cases and similar number of controls.
                        </div>

                        <div class="consortia-desc">
                            <a href="http://cimba.ccge.medschl.cam.ac.uk/" target="__blank">Consortium of Investigators of Modifiers of BRCA1/2</a> (CIMBA)</br>
                            The CIMBA was formed by a collaborative group of researchers working on genetic modifiers of cancer risk in BRCA1 and BRCA2 mutation carriers. The aim of CIMBA is to provide sufficient sample sizes to allow large scale studies in order to evaluate reliably the effects of genetic modifiers.
                        </div>

                        <div class="consortia-desc">
                            <a href="mailto:nick.orr@qub.ac.uk">Male Breast Cancer Genetics Consortium (MERGE)</a></br>
                            The MERGE is a GWAS of male breast cancer cases and similar number of controls.
                        </div>

                        <div class="consortia-desc">
                            Studies not part of a breast cancer consortia are participating through a direct collaboration with NCI Division of Cancer Epidemiology and Genetics
                        </div>
                        <div class="consortia-desc">
                            For more information:</br>
                            Visit: <a href="https://dceg.cancer.gov/research/cancer-types/breast-cancer/confluence-project" target="__blank">https://dceg.cancer.gov/research/cancer-types/breast-cancer/confluence-project</a></br>
                            Email: <a href="mailto:ConfluenceProject@nih.gov">ConfluenceProject@nih.gov</a>
                        </div>
                    <div>
                <div>
            <div>
        <div>
    `;
    document.getElementById('confluenceDiv').innerHTML = template;
}