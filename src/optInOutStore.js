import {
    Confluence_Opt_In_Out,
    createFolder,
    getFile,
    getFolderItems,
    uploadFile,
    uploadFileVersion
} from "./shared.js";

const TSV_MIME_TYPE = "text/tab-separated-values";
const CONFIG_FOLDER_NAME = "_config";
const DEMO_ROOT_FOLDER_NAME = "_demo";
const DEMO_STUDY_ID = "Demo_Study";
const ROUNDS_FILE_NAME = "rounds.tsv";
const STUDY_MANIFEST_FILE_NAME = "_study_manifest.tsv";
const CONSORTIUM_ID = "C-NCI";

const ROUND_COLUMNS = ["round_id", "round_name", "source_box_folder_id", "status", "opens_at_utc", "closes_at_utc", "initiated_at_utc", "initiated_by_email"];
const ROUND_MANIFEST_COLUMNS = ["round_id", "round_name", "consortium_id", "study_id", "study_acronym", "study_name", "concept_box_id", "concept_title", "study_folder_id", "round_folder_id", "selection_file_id", "provision_status", "provision_error"];
const STUDY_MANIFEST_COLUMNS = ["round_id", "round_name", "round_status", "opens_at_utc", "closes_at_utc", "concept_box_id", "concept_title", "selection_file_id"];
const SELECTION_COLUMNS = ["schema_version", "round_id", "round_name", "consortium_id", "study_id", "study_acronym", "study_name", "concept_box_id", "concept_title", "concept_file_name", "decision", "submitted", "submitted_by_name", "submitted_by_email", "submitted_at_utc", "updated_at_utc", "is_demo", "demo_created_by", "demo_created_at_utc"];

const cleanTsvValue = (value) => String(value ?? "").replace(/[\t\r\n]+/g, " ").trim();
const cleanBoxName = (value) => cleanTsvValue(value).replace(/[\\/]+/g, "-");
const normalizeName = (value) => String(value ?? "").trim().toLowerCase();

export const parseTsv = (contents = "") => {
    const lines = String(contents).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n").filter(line => line.trim() !== "");
    if (!lines.length) return [];
    const headers = lines[0].split("\t").map(header => header.trim());
    return lines.slice(1).map(line => {
        const values = line.split("\t");
        return headers.reduce((row, header, index) => {
            row[header] = values[index] ?? "";
            return row;
        }, {});
    });
};

export const serializeTsv = (columns, rows) => {
    const lines = [columns.join("\t")];
    rows.forEach(row => lines.push(columns.map(column => cleanTsvValue(row[column])).join("\t")));
    return `${lines.join("\r\n")}\r\n`;
};

const boxEntries = (response) => Array.isArray(response?.entries) ? response.entries : [];

const findFolder = async (parentId, folderName) => {
    const items = await getFolderItems(parentId, "name,type,id,parent", 1000);
    return boxEntries(items).find(item => item.type === "folder" && normalizeName(item.name) === normalizeName(folderName)) || null;
};

const findFile = async (parentId, fileName) => {
    const items = await getFolderItems(parentId, "name,type,id,parent", 1000);
    return boxEntries(items).find(item => item.type === "file" && normalizeName(item.name) === normalizeName(fileName)) || null;
};

export const getOrCreateOptInOutFolder = async (parentId, folderName) => {
    const existing = await findFolder(parentId, folderName);
    if (existing) return existing;
    const created = await createFolder(parentId, cleanBoxName(folderName));
    if (created?.id) return created;
    if (created?.status === 409) {
        const conflict = await findFolder(parentId, folderName);
        if (conflict) return conflict;
    }
    throw new Error(created?.message || created?.statusText || `Unable to create Box folder ${folderName}.`);
};

const writeTsv = async (folderId, fileName, columns, rows) => {
    const contents = serializeTsv(columns, rows);
    const existing = await findFile(folderId, fileName);
    const result = existing
        ? await uploadFileVersion(contents, existing.id, TSV_MIME_TYPE)
        : await uploadFile(contents, fileName, folderId, TSV_MIME_TYPE);
    const fileId = existing?.id || result?.entries?.[0]?.id;
    if (!fileId || !result?.entries?.length) throw new Error(result?.statusText || `Unable to save ${fileName} in Box.`);
    return { id: fileId, name: fileName };
};

const readTsv = async (fileId) => parseTsv(await getFile(fileId));

const readTsvInFolder = async (folderId, fileName) => {
    const file = await findFile(folderId, fileName);
    if (!file) return { file: null, rows: [] };
    return { file, rows: await readTsv(file.id) };
};

const upsertRows = (existingRows, newRows, keyForRow) => {
    const rowsByKey = new Map(existingRows.map(row => [keyForRow(row), row]));
    newRows.forEach(row => rowsByKey.set(keyForRow(row), row));
    return Array.from(rowsByKey.values());
};

const getStudyId = (study) => cleanBoxName(study.acronym || study.name);
const getConceptSelectionFileName = (conceptBoxId) => `concept_${cleanTsvValue(conceptBoxId)}.tsv`;

const ensureSelectionFile = async ({ roundFolderId, round, study, concept, now, isDemo = false, demoCreatedBy = "" }) => {
    const fileName = getConceptSelectionFileName(concept.fileId);
    const existing = await findFile(roundFolderId, fileName);
    if (existing) return existing;

    const row = {
        schema_version: "1",
        round_id: round.id,
        round_name: round.name,
        consortium_id: CONSORTIUM_ID,
        study_id: getStudyId(study),
        study_acronym: study.acronym,
        study_name: study.name,
        concept_box_id: concept.fileId,
        concept_title: concept.title,
        concept_file_name: concept.fileName,
        decision: "pending",
        submitted: "false",
        submitted_by_name: "",
        submitted_by_email: "",
        submitted_at_utc: "",
        updated_at_utc: now,
        is_demo: String(isDemo),
        demo_created_by: isDemo ? demoCreatedBy : "",
        demo_created_at_utc: isDemo ? now : ""
    };
    return writeTsv(roundFolderId, fileName, SELECTION_COLUMNS, [row]);
};

export const provisionOptInOutRound = async ({ round, concepts, studies, opensAt, closesAt, initiatedBy, onProgress }) => {
    const now = new Date().toISOString();
    const report = (message) => { if (typeof onProgress === "function") onProgress(message); };
    const configFolder = await getOrCreateOptInOutFolder(Confluence_Opt_In_Out, CONFIG_FOLDER_NAME);
    const consortiumFolder = await getOrCreateOptInOutFolder(Confluence_Opt_In_Out, CONSORTIUM_ID);
    const roundManifestRows = [];

    report(`Preparing ${studies.length} C-NCI studies...`);
    for (const study of studies) {
        const studyId = getStudyId(study);
        const studyFolder = await getOrCreateOptInOutFolder(consortiumFolder.id, studyId);
        const roundFolder = await getOrCreateOptInOutFolder(studyFolder.id, round.name);
        const studyManifestRows = [];

        for (const concept of concepts) {
            report(`Creating ${studyId}: ${concept.title}`);
            try {
                const selectionFile = await ensureSelectionFile({ roundFolderId: roundFolder.id, round, study, concept, now });
                const assignment = {
                    round_id: round.id,
                    round_name: round.name,
                    round_status: "open",
                    opens_at_utc: opensAt,
                    closes_at_utc: closesAt,
                    concept_box_id: concept.fileId,
                    concept_title: concept.title,
                    selection_file_id: selectionFile.id
                };
                studyManifestRows.push(assignment);
                roundManifestRows.push({
                    ...assignment,
                    consortium_id: CONSORTIUM_ID,
                    study_id: studyId,
                    study_acronym: study.acronym,
                    study_name: study.name,
                    study_folder_id: studyFolder.id,
                    round_folder_id: roundFolder.id,
                    provision_status: "ready",
                    provision_error: ""
                });
            } catch (error) {
                roundManifestRows.push({
                    round_id: round.id,
                    round_name: round.name,
                    consortium_id: CONSORTIUM_ID,
                    study_id: studyId,
                    study_acronym: study.acronym,
                    study_name: study.name,
                    concept_box_id: concept.fileId,
                    concept_title: concept.title,
                    study_folder_id: studyFolder.id,
                    round_folder_id: roundFolder.id,
                    selection_file_id: "",
                    provision_status: "error",
                    provision_error: error.message
                });
            }
        }

        const currentManifest = await readTsvInFolder(studyFolder.id, STUDY_MANIFEST_FILE_NAME);
        const otherRounds = currentManifest.rows.filter(row => String(row.round_id) !== String(round.id));
        await writeTsv(studyFolder.id, STUDY_MANIFEST_FILE_NAME, STUDY_MANIFEST_COLUMNS, [...otherRounds, ...studyManifestRows]);
    }

    const roundsFile = await readTsvInFolder(configFolder.id, ROUNDS_FILE_NAME);
    const roundRow = {
        round_id: round.id,
        round_name: round.name,
        source_box_folder_id: round.id,
        status: roundManifestRows.some(row => row.provision_status === "error") ? "initializing" : "open",
        opens_at_utc: opensAt,
        closes_at_utc: closesAt,
        initiated_at_utc: now,
        initiated_by_email: initiatedBy
    };
    await writeTsv(configFolder.id, ROUNDS_FILE_NAME, ROUND_COLUMNS, upsertRows(roundsFile.rows, [roundRow], row => String(row.round_id)));
    await writeTsv(configFolder.id, `${cleanTsvValue(round.name)}_manifest.tsv`, ROUND_MANIFEST_COLUMNS, roundManifestRows);

    const failures = roundManifestRows.filter(row => row.provision_status === "error");
    return { createdAssignments: roundManifestRows.length - failures.length, failures, totalAssignments: roundManifestRows.length };
};

export const provisionDemoOptInOutRound = async ({ demoName, sourceRound, concepts, opensAt, closesAt, initiatedBy, onProgress }) => {
    const now = new Date().toISOString();
    const report = message => { if (typeof onProgress === "function") onProgress(message); };
    const safeDemoName = cleanBoxName(demoName);
    if (!safeDemoName) throw new Error("A demo name is required.");
    const demoRoot = await getOrCreateOptInOutFolder(Confluence_Opt_In_Out, DEMO_ROOT_FOLDER_NAME);
    const demoFolder = await getOrCreateOptInOutFolder(demoRoot.id, safeDemoName);
    const consortiumFolder = await getOrCreateOptInOutFolder(demoFolder.id, CONSORTIUM_ID);
    const study = { acronym: DEMO_STUDY_ID, name: "Administrative Demo Study" };
    const studyFolder = await getOrCreateOptInOutFolder(consortiumFolder.id, DEMO_STUDY_ID);
    const roundFolder = await getOrCreateOptInOutFolder(studyFolder.id, safeDemoName);
    const demoRound = { id: `demo-${sourceRound.id}-${safeDemoName}`, name: safeDemoName };
    const studyManifestRows = [];
    const manifestRows = [];

    for (const concept of concepts) {
        report(`Preparing demo concept: ${concept.title}`);
        const selectionFile = await ensureSelectionFile({
            roundFolderId: roundFolder.id,
            round: demoRound,
            study,
            concept,
            now,
            isDemo: true,
            demoCreatedBy: initiatedBy
        });
        const assignment = {
            round_id: demoRound.id,
            round_name: safeDemoName,
            round_status: "open",
            opens_at_utc: opensAt,
            closes_at_utc: closesAt,
            concept_box_id: concept.fileId,
            concept_title: concept.title,
            selection_file_id: selectionFile.id
        };
        studyManifestRows.push(assignment);
        manifestRows.push({
            ...assignment,
            consortium_id: CONSORTIUM_ID,
            study_id: DEMO_STUDY_ID,
            study_acronym: DEMO_STUDY_ID,
            study_name: study.name,
            study_folder_id: studyFolder.id,
            round_folder_id: roundFolder.id,
            provision_status: "ready",
            provision_error: ""
        });
    }

    await writeTsv(studyFolder.id, STUDY_MANIFEST_FILE_NAME, STUDY_MANIFEST_COLUMNS, studyManifestRows);
    await writeTsv(demoFolder.id, "demo_manifest.tsv", ROUND_MANIFEST_COLUMNS, manifestRows);
    return { demoName: safeDemoName, createdAssignments: manifestRows.length };
};

const resolveStudyFolder = async (study) => {
    const studyId = getStudyId(study);
    try {
        const consortiumFolder = await findFolder(Confluence_Opt_In_Out, CONSORTIUM_ID);
        if (consortiumFolder) {
            const nestedStudy = await findFolder(consortiumFolder.id, studyId);
            if (nestedStudy) return nestedStudy;
        }
    } catch (error) {
        console.warn("Unable to browse the Opt-In/Out root folder:", error);
    }

    const collaborationRoots = await getFolderItems("0", "name,type,id,parent", 1000);
    return boxEntries(collaborationRoots).find(item => item.type === "folder" && normalizeName(item.name) === normalizeName(studyId)) || null;
};

const loadAssignmentsFromStudyFolder = async (studyFolder, now = Date.now()) => {
    const assignments = [];
    const manifest = await readTsvInFolder(studyFolder.id, STUDY_MANIFEST_FILE_NAME);
    const openAssignments = manifest.rows.filter(row => {
        const opensAt = Date.parse(row.opens_at_utc);
        const closesAt = Date.parse(row.closes_at_utc);
        return row.round_status === "open"
            && row.selection_file_id
            && (!Number.isFinite(opensAt) || opensAt <= now)
            && (!Number.isFinite(closesAt) || closesAt >= now);
    });
    for (const assignment of openAssignments) {
        const selectionRows = await readTsv(assignment.selection_file_id);
        const selection = selectionRows[0];
        if (!selection) continue;
        assignments.push({
            ...assignment,
            ...selection,
            selectionFileId: assignment.selection_file_id,
            studyFolderId: studyFolder.id
        });
    }
    return assignments;
};

export const loadOptInOutAssignments = async (studies) => {
    const assignments = [];
    const now = Date.now();
    for (const study of studies) {
        const studyFolder = await resolveStudyFolder(study);
        if (!studyFolder) continue;
        assignments.push(...await loadAssignmentsFromStudyFolder(studyFolder, now));
    }
    return assignments;
};

export const loadDemoOptInOutAssignments = async () => {
    const demoRoot = await findFolder(Confluence_Opt_In_Out, DEMO_ROOT_FOLDER_NAME);
    if (!demoRoot) return [];
    const demoItems = await getFolderItems(demoRoot.id, "name,type,id,parent", 1000);
    const demoFolders = boxEntries(demoItems).filter(item => item.type === "folder");
    const assignments = [];
    for (const demoFolder of demoFolders) {
        const consortiumFolder = await findFolder(demoFolder.id, CONSORTIUM_ID);
        if (!consortiumFolder) continue;
        const studyFolder = await findFolder(consortiumFolder.id, DEMO_STUDY_ID);
        if (!studyFolder) continue;
        const demoAssignments = await loadAssignmentsFromStudyFolder(studyFolder);
        demoAssignments.forEach(assignment => { assignment.is_demo = "true"; });
        assignments.push(...demoAssignments);
    }
    return assignments;
};

export const saveOptInOutSelections = async (changes, user) => {
    const saved = [];
    const failed = [];
    for (const change of changes) {
        try {
            if (!["opt_in", "opt_out"].includes(change.decision)) throw new Error("Invalid Opt-In/Opt-Out decision.");
            const rows = await readTsv(change.selectionFileId);
            if (!rows.length) throw new Error("The selection TSV is empty.");
            const now = new Date().toISOString();
            const updated = {
                ...rows[0],
                decision: change.decision,
                submitted: "true",
                submitted_by_name: user.name || "",
                submitted_by_email: user.email || "",
                submitted_at_utc: now,
                updated_at_utc: now
            };
            const result = await uploadFileVersion(serializeTsv(SELECTION_COLUMNS, [updated]), change.selectionFileId, TSV_MIME_TYPE);
            if (!result?.entries?.length) throw new Error(result?.statusText || "Box did not confirm the update.");
            saved.push({ ...change, updated });
        } catch (error) {
            failed.push({ ...change, error: error.message });
        }
    }
    return { saved, failed };
};
