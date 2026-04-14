import { getFolderItems, getFileURL, showAnimation, hideAnimation, downloadFile } from "./../shared.js";

export const plotsTemplate = () => {
    return `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Plots</h1>
                    </div>
                </div>
                <div class="div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem; background-color: white;">
                    <div class="p-4">
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <label for="plotSetSelect" class="form-label font-bold">Select Plot Set:</label>
                                <select id="plotSetSelect" class="form-select">
                                    <option value="">-- Loading plot sets... --</option>
                                </select>
                            </div>
                        </div>
                        <hr>
                        <div id="plotsContainer" class="mt-4">
                            <div class="text-center text-muted">
                                <p>Please select a plot set from the dropdown above to view the results.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Zoom Modal -->
        <div class="modal fade" id="plotZoomModal" tabindex="-1" aria-labelledby="plotZoomModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content bg-dark border-0">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title text-white" id="plotZoomModalLabel">Plot Zoom</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center p-0">
                        <img id="zoomedPlotImage" src="" class="img-fluid" alt="Zoomed Plot" style="max-height: 90vh;">
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-outline-light btn-sm" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

export const renderPlots = async () => {
    showAnimation();
    const folderId = "347183894183";
    const selectElement = document.getElementById("plotSetSelect");
    const plotsContainer = document.getElementById("plotsContainer");
    
    try {
        const response = await getFolderItems(folderId);
        if (!response || !response.entries) {
            plotsContainer.innerHTML = "No plots found.";
            hideAnimation();
            return;
        }

        const pngFiles = response.entries.filter(file => file.type === "file" && file.name.toLowerCase().endsWith(".png"));
        
        if (pngFiles.length === 0) {
            plotsContainer.innerHTML = "No PNG plots found in the specified folder.";
            hideAnimation();
            return;
        }

        // Group files by prefix based on known suffixes
        const groups = {};
        const knownSuffixes = [
            "_manhattan_no_anno.png",
            "_manhattan.png",
            "_no_anno.png",
            "_QQ.png"
        ];

        pngFiles.forEach(file => {
            const fileName = file.name;
            let prefix = fileName;
            
            // Find if the filename ends with one of our known suffixes
            for (const suffix of knownSuffixes) {
                if (fileName.toLowerCase().endsWith(suffix.toLowerCase())) {
                    prefix = fileName.substring(0, fileName.length - suffix.length);
                    break;
                }
            }

            // Fallback for files that don't match known suffixes
            if (prefix === fileName && fileName.includes("_")) {
                const lastUnderscoreIndex = fileName.lastIndexOf("_");
                prefix = fileName.substring(0, lastUnderscoreIndex);
            }
            
            if (!groups[prefix]) groups[prefix] = [];
            groups[prefix].push(file);
        });

        // Populate the dropdown
        const prefixes = Object.keys(groups).sort();
        selectElement.innerHTML = '<option value="">-- Select a plot set --</option>';
        prefixes.forEach(prefix => {
            const option = document.createElement("option");
            option.value = prefix;
            option.textContent = prefix.replace(/_/g, ' ');
            selectElement.appendChild(option);
        });

        // Handle selection change
        selectElement.addEventListener("change", async (e) => {
            const selectedPrefix = e.target.value;
            if (!selectedPrefix) {
                plotsContainer.innerHTML = '<div class="text-center text-muted"><p>Please select a plot set from the dropdown above to view the results.</p></div>';
                return;
            }

            showAnimation();
            plotsContainer.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-spinner fa-spin fa-2x mb-2"></i>
                    <p>Loading images for ${selectedPrefix.replace(/_/g, ' ')}...</p>
                </div>
            `;

            const groupFiles = groups[selectedPrefix].sort((a, b) => a.name.localeCompare(b.name));
            let groupTemplate = `
                <div class="plot-group animate-in">
                    <h3 class="mb-4">${selectedPrefix.replace(/_/g, ' ')}</h3>
                    <div class="row">
            `;

            // Fetch URLs for the selected set
            const urlPromises = groupFiles.map(file => getFileURL(file.id).then(url => ({ 
                id: file.id,
                name: file.name, 
                url 
            })));
            const results = await Promise.all(urlPromises);

            results.forEach(result => {
                groupTemplate += `
                    <div class="col-md-4 mb-3 text-center">
                        <div class="card h-100 shadow-sm border-0 bg-light">
                            <div class="card-header border-0 bg-transparent py-2 d-flex justify-content-between align-items-center">
                                <small class="text-truncate flex-grow-1 font-size-12 text-muted" title="${result.name}">${result.name}</small>
                                <button class="btn btn-sm btn-link p-0 ms-2 download-plot-btn" 
                                        data-file-id="${result.id}" 
                                        data-file-name="${result.name}"
                                        title="Download Image">
                                    <i class="fas fa-download text-primary"></i>
                                </button>
                            </div>
                            <div class="card-body d-flex align-items-center justify-content-center p-2 bg-white" style="min-height: 250px;">
                                <div class="plot-zoom-trigger cursor-pointer" 
                                     data-bs-toggle="modal" 
                                     data-bs-target="#plotZoomModal"
                                     data-image-url="${result.url}"
                                     data-image-title="${result.name}">
                                    <img src="${result.url}" class="img-fluid plot-image" alt="${result.name}" style="max-height: 350px; object-fit: contain;">
                                    <div class="plot-overlay">
                                        <i class="fas fa-search-plus fa-2x text-white"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            groupTemplate += `
                    </div>
                </div>
            `;
            
            plotsContainer.innerHTML = groupTemplate;

            // Add Event Listeners for Zoom
            const zoomTriggers = plotsContainer.querySelectorAll('.plot-zoom-trigger');
            zoomTriggers.forEach(trigger => {
                trigger.addEventListener('click', (e) => {
                    const url = trigger.getAttribute('data-image-url');
                    const title = trigger.getAttribute('data-image-title');
                    document.getElementById('zoomedPlotImage').src = url;
                    document.getElementById('plotZoomModalLabel').textContent = title;
                });
            });

            // Add Event Listeners for Download
            const downloadBtns = plotsContainer.querySelectorAll('.download-plot-btn');
            downloadBtns.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const fileId = btn.getAttribute('data-file-id');
                    const fileName = btn.getAttribute('data-file-name');
                    
                    showAnimation();
                    try {
                        const response = await downloadFile(fileId);
                        if (response.ok) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = fileName;
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                        } else {
                            alert("Failed to download file.");
                        }
                    } catch (error) {
                        console.error("Download error:", error);
                        alert("An error occurred while downloading.");
                    }
                    hideAnimation();
                });
            });

            hideAnimation();
        });

    } catch (error) {
        console.error("Error rendering plots:", error);
        plotsContainer.innerHTML = `<div class="alert alert-danger">Error loading plots: ${error.message}</div>`;
    }
    
    hideAnimation();
};
