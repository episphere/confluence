export const showLoadingProgress = (container, title, prefix) => {
    container.innerHTML = `
        <div class="container mt-5 mb-5">
            <div class="text-center mb-3"><h4></h4><p class="text-muted">This initial load may take a moment while we sync with Box.</p></div>
            <div class="progress" style="height: 35px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <div id="${prefix}ProgressBar" class="progress-bar progress-bar-striped progress-bar-animated bg-primary" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
            </div>
            <div id="${prefix}ProgressText" class="text-center mt-2 font-weight-bold color-primary" role="status" aria-live="polite">Initializing...</div>
        </div>`;
    container.querySelector("h4").textContent = title;
    const bar = container.querySelector("[role=progressbar]");
    const status = container.querySelector("[role=status]");
    bar.setAttribute("aria-label", title);
    return (percentage, message) => {
        const value = Math.max(0, Math.min(100, Math.round(percentage)));
        bar.style.width = `${value}%`;
        bar.setAttribute("aria-valuenow", String(value));
        bar.textContent = `${value}%`;
        status.textContent = message;
    };
};
