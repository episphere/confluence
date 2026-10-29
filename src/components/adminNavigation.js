import { emailsAllowedToUpdateData } from "../shared.js";

export const ADMIN_PAGES = [
    { key: "dacc", href: "#auth_table", id: "authTable", label: "DACC Admin Table" },
    { key: "study-access", href: "#study_access_admin", id: "studyAccessAdminMenu", label: "Study Access Admin" }
];

export const renderAdminPageTabs = activePage => {
    const userEmail = JSON.parse(localStorage.parms || "{}").login;
    if (!emailsAllowedToUpdateData.includes(userEmail)) return "";

    return `<nav aria-label="Admin pages" class="main-summary-row white-bg div-border">
        <ul class="nav nav-pills">
            ${ADMIN_PAGES.map(page => `<li class="nav-item">
                <a class="nav-link${page.key === activePage ? " active" : ""} black-font font-size-14" href="${page.href}"${page.key === activePage ? ' aria-current="page"' : ""}><strong>${page.label}</strong></a>
            </li>`).join("")}
        </ul>
    </nav>`;
};
