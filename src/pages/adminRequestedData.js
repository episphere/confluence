// These choices mirror the data request form and its generated Word headings.
export const REQUESTED_DATA_GROUPS = [
    { key: "genotyping", label: "Genotyping", choices: ["Individual-level genotyped data", "Individual-level imputed data", "Concept 1 GWAS summary results"] },
    { key: "sex", label: "Data Requested From (sex)", choices: ["Females", "Males"] },
    { key: "carrier", label: "Carrier Status", choices: ["BRCA1", "BRCA2"] },
    { key: "phenotype", label: "Phenotype data", choices: ["Risk Factor", "Pathology", "Survival and Treatment", "Mammographic Density"] }
];

const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const extractAdminRequestedData = (text) => {
    const normalized = String(text || "").replace(/\s+/g, " ");
    const headings = ["Genotyping", "Data Requested From", "Carrier Status requested", "CIMBA methodological note reviewed", "Risk Factor Variables", "Pathology Variables", "Survival and Treatment Variables", "Mammographic Density Variable", "Time Plan"];
    const section = heading => {
        const start = new RegExp(`\\b${escapePattern(heading)}\\s*:`, "i").exec(normalized);
        if (!start) return "";
        const rest = normalized.slice(start.index + start[0].length);
        const end = new RegExp(`\\b(?:${headings.map(escapePattern).join("|")})\\s*:`, "i").exec(rest);
        return (end ? rest.slice(0, end.index) : "").trim();
    };
    const selectedChoices = (key, heading) => REQUESTED_DATA_GROUPS.find(group => group.key === key).choices
        .filter(choice => new RegExp(`\\b${escapePattern(choice)}\\b`, "i").test(section(heading)));
    return {
        genotyping: selectedChoices("genotyping", "Genotyping"),
        sex: selectedChoices("sex", "Data Requested From"),
        carrier: selectedChoices("carrier", "Carrier Status requested"),
        phenotype: REQUESTED_DATA_GROUPS[3].choices.filter((choice, index) =>
            /^yes\b/i.test(section(headings[index + 4])))
    };
};

export const matchesAdminRequestedData = (requestedData, selections, mode) => {
    if (!selections.length) return true;
    const matches = ([key, choice]) => (requestedData?.[key] || []).includes(choice);
    return mode === "and" ? selections.every(matches) : selections.some(matches);
};
