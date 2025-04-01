export const participatingConfluence = (activeTab, showDescripton) => {
    let template = `
        <div class="general-bg body-min-height padding-bottom-1rem">
            <div class="container">
                ${showDescripton ? `<div class="main-summary-row white-bg div-border">
                    <ul class="nav nav-pills">
                        <li class="nav-item"><a class="nav-link black-font font-size-14" href="#about/overview"><strong>Overview</strong></a></li>
                        <li class="nav-item"><a class="nav-link black-font font-size-14" href="#about/description"> <strong>Description of Studies</strong></a></li>
                        <li class="nav-item"><a class="nav-link ${activeTab === 'overview' ? 'active': ''} black-font font-size-14" href="#join/overview"><strong>Consortium</strong></a></li>
                        <li class="nav-item"><a class="nav-link ${activeTab === 'description' ? 'active': ''} black-font font-size-14" href="#join/description"> <strong>DACCs</strong></a></li>
                        <li class="nav-item"><a class="nav-link black-font font-size-14" href="#contact"> <strong>Contacts</strong></a></li>
                    </ul>
                </div>`:``}
                <div id="overview"></div>
            </div>
        </div>
    `;
    document.getElementById('confluenceDiv').innerHTML = template;
}

export const confluenceResources = () => {
    let template = `
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Participating Consortium</h1>
                    </div>
                </div>
                <div class="main-summary-row white-bg div-border p-2">
                    <div class="col font-size-18 align-left">
                        <div>The following breast cancer consortia are participating in Confluence:</div>
                        <div class="consortia-desc">
                            <a href="https://www.ccge.medschl.cam.ac.uk/breast-cancer-association-consortium-bcac" target="_blank" rel="noopener noreferrer" class="external-url" data-href="https://www.ccge.medschl.cam.ac.uk/breast-cancer-association-consortium-bcac" data-toggle="modal" data-target="#confluenceMainModal">Breast Cancer Association Consortium</a> (BCAC)</br>
                            The BCAC is a forum of investigators interested in the inherited risk of breast cancer. The aim of the consortium is to combine data from many studies, and to provide a reliable assessment of the risks associated with these gene.
                        </div>
                        <div class="consortia-desc">
                        <a href="mailto:wei.zheng@vanderbilt.edu" target="_blank" rel="noopener noreferrer">African-ancestry Breast Cancer Genetic Consortium </a> (AABCG)</br>
                            The AABCG is a collaboration of investigators focused on identifying novel genetic susceptibility factors for breast cancer in African-ancestry women and evaluating the influence of germline risk variants on breast cancer biology.
                        </div>

                        <div class="consortia-desc">
                            <a href= "https://www.lageno-bc.org/about/" target="_blank" rel="noopener noreferrer" class="external-url" data-href="https://www.lageno-bc.org/about/" data-toggle="modal" data-target="#confluenceMainModal">Latin America Genomics Breast Cancer Consortium</a> (LAGENO-BC)</br>
                            LAGENO-BC is a collaborative effort including a multinational team of investigators sharing knowledge and materials to facilitate breast cancer genetics research relevant to the diverse populations of Latin America and its diaspora.
                        </div>

                        <div class="consortia-desc">
                            <a href="https://www.ccge.medschl.cam.ac.uk/consortium-investigators-modifiers-brca12-cimba" target="_blank" rel="noopener noreferrer" class="external-url" data-href="https://www.ccge.medschl.cam.ac.uk/consortium-investigators-modifiers-brca12-cimba" data-toggle="modal" data-target="#confluenceMainModal">Consortium of Investigators of Modifiers of BRCA1/2</a> (CIMBA)</br>
                            The CIMBA was formed by a collaborative group of researchers working on genetic modifiers of cancer risk in BRCA1 and BRCA2 mutation carriers. The aim of CIMBA is to provide sufficient sample sizes to allow large scale studies in order to evaluate reliably the effects of genetic modifiers.
                        </div>

                        <div class="consortia-desc">
                            <a href="mailto:nick.orr@qub.ac.uk" target="_blank" rel="noopener noreferrer">Male Breast Cancer Genetics Consortium</a> (MERGE) </br>
                            The MERGE is a GWAS of male breast cancer cases and similar number of controls.
                        </div>

                        <div class="consortia-desc">
                            Studies not part of a breast cancer consortia are participating through a direct collaboration with the National Cancer Institute, Division of Cancer Epidemiology and Genetics.
                        </div>
                        <div class="consortia-desc">
                            For more information:</br>
                            Email: <a href="mailto:ConfluenceProject@nih.gov" target="_blank" rel="noopener noreferrer">ConfluenceProject@nih.gov</a>
                        </div>
                    <div>
                <div>
    `;
    document.getElementById('overview').innerHTML = template;
    handleExternalLinks();
}

const handleExternalLinks = () => {
    const externalLinks = document.querySelectorAll('.external-url');
    externalLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const header = document.getElementById('confluenceModalHeader');
            const body = document.getElementById('confluenceModalBody');
            header.innerHTML = `<h5 class="modal-title">Accessing external resource</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`;
            body.innerHTML = `<div style="margin-bottom: 2rem;">You are now leaving the Confluence Data Platform website to access ${link.dataset.href}</div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-dark" data-dismiss="modal" aria-label="Close">
                    Cancel
                </button>
                <a href="${link.dataset.href}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary">Continue</a>
            </div>`;
        })
    });
}

export const confluenceResourcesDes = () => {
    let template = `
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Participating Consortium</h1>
                    </div>
                </div>
                <div class="main-summary-row white-bg div-border">
                    <div class="font-size-18 align-left modal-body">
                        The following Data Access Coordinating Committees (DACCs) provide governance of the data shared with the Confluence Project. A description of the coordination between the DACCs
                        participating in Confluence is described in the <a href="https://nih.box.com/s/6d7ghyutf592zxplwvkgmlh42eicwa90" target="_blank" rel="noopener noreferrer">Document of Understanding Across Consortium Data Access Committees for the Confluence Project.</a>
                    </div>
                    <div class="table-responsive text-start modal-body">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th scope="col">Consortium Name</th>
                                    <!--<th scope="col">DACC Chair</th>
                                    <th scope="col">Email</th>-->
                                    <th scope="col" style="text-align: center">DACC Guidelines</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><a>African-ancestry Breast Cancer Genetic Consortium</a> (AABCG)</td>
                                    <!--<td>Wei Zheng (Vanderbilt University Medical Center)</td>
                                    <td><a href="mailto:wei.zheng@vumc.org">wei.zheng@vumc.org</a></td>-->
                                    <td style="text-align: center"><a href="https://nih.box.com/s/h8i1u9gtkyq458mh4bsx49wj23sff75v" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt join"></i></td>
                                </tr>
                                <tr>
                                    <td><a href="https://www.ccge.medschl.cam.ac.uk/breast-cancer-association-consortium-bcac" class="external-url" data-href="https://www.ccge.medschl.cam.ac.uk/breast-cancer-association-consortium-bcac" data-toggle="modal" data-target="#confluenceMainModal">Breast Cancer Association Consortium</a> (BCAC)</td>
                                    <!--<td>Roger Milne (Cancer Council Victoria)</td>
                                    <td><a href="mailto:roger.milne@cancervic.org.au">roger.milne@cancervic.org.au</a></td>-->
                                    <td style="text-align: center">TBD</td>
                                </tr>
                                <tr>
                                    <td><a href="https://www.ccge.medschl.cam.ac.uk/consortium-investigators-modifiers-brca12-cimba" class="external-url" data-href="https://www.ccge.medschl.cam.ac.uk/consortium-investigators-modifiers-brca12-cimba" data-toggle="modal" data-target="#confluenceMainModal">Consortium of Investigators of Modifiers of BRCA1/2</a> (CIMBA)</td>
                                    <!--<td>Georgia Chenevix-Trench (QIMR Berghofer Medical Research Institute)</td>
                                    <td><a href="mailto:georgia.trench@qimrberghofer.edu.au">georgia.trench@qimrberghofer.edu.au</a></td>-->
                                    <td style="text-align: center"><a href="https://nih.box.com/s/5etp13wd3x0kudpf846ubljk3hl2n4pm" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt join"></i></td>
                                </tr>
                                    <tr>
                                    <td><a href= "https://www.lageno-bc.org/about/" class="external-url" data-href="https://www.lageno-bc.org/about/" data-toggle="modal" data-target="#confluenceMainModal">Latin America Genomics Breast Cancer Consortium</a> (LAGENO-BC)</td>
                                    <!--<td>Laura Fejerman (University of California, Davis)</td>
                                    <td><a href="mailto:lfejerman@ucdavis.edu">lfejerman@ucdavis.edu</a></td>-->
                                    <td style="text-align: center"><a href="https://nih.box.com/s/hctiub6qf9ptheagqh0j00iesm8onq6y" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt join"></i></td>
                                </tr>
                                <tr>
                                    <td><a href="mailto:nick.orr@qub.ac.uk">Male Breast Cancer Genetics Consortium</a> (MERGE)</td>
                                    <!--<td>Nick Orr (Queen's University Belfast)</td>
                                    <td><a href="mailto:nick.orr@qub.ac.uk">nick.orr@qub.ac.uk</a></td>-->
                                    <td style="text-align: center"><a href="https://nih.box.com/s/xkcxyievmnt21b69okrr9nckt4py6xwy" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt join"></i></td>
                                </tr>
                                <tr>
                                    <td>Confluence National Cancer Institute Studies (C-NCI)</td>
                                    <!--<td>Dezheng Huo (The University of Chicago)</td>
                                    <td><a href="mailto:dhuo@bsd.uchicago.edu">dhuo@bsd.uchicago.edu</a></td>-->
                                    <td style="text-align: center"><a href="https://nih.box.com/s/h3ytm45ztzof8jmf4wkpfilzd9oyppd2" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt join"></i></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
    `;
    document.getElementById('overview').innerHTML = template;
    handleExternalLinks();
    //hideAnimation();
}