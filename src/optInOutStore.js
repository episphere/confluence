import {
    Confluence_Opt_In_Out,
    createFolder,
    dataManagersInfo,
    emailsAllowedToUpdateData,
    createComment,
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
const DATA_MANAGER_REQUESTS_FILE_NAME = "data_manager_requests.tsv";
const STUDY_MANIFEST_FILE_NAME = "_study_manifest.tsv";
const STUDY_ACCESS_FILE_NAME = "study_access_assignments.tsv";
const CONSORTIUM_ID = "C-NCI";

const ROUND_COLUMNS = ["round_id", "round_name", "consortium_id", "source_box_folder_id", "status", "opens_at_utc", "closes_at_utc", "initiated_at_utc", "initiated_by_email"];
const ROUND_MANIFEST_COLUMNS = ["round_id", "round_name", "consortium_id", "study_id", "study_acronym", "study_name", "concept_box_id", "concept_title", "study_folder_id", "round_folder_id", "selection_file_id", "provision_status", "provision_error"];
ROUND_MANIFEST_COLUMNS.push("round_status", "opens_at_utc", "closes_at_utc", "initiated_at_utc", "initiated_by_email");
const STUDY_MANIFEST_COLUMNS = ["round_id", "round_name", "round_status", "opens_at_utc", "closes_at_utc", "concept_box_id", "concept_title", "selection_file_id"];
const SELECTION_COLUMNS = ["schema_version", "round_id", "round_name", "consortium_id", "study_id", "study_acronym", "study_name", "concept_box_id", "concept_title", "concept_file_name", "decision", "submitted", "submitted_by_name", "submitted_by_email", "submitted_at_utc", "updated_at_utc", "is_demo", "demo_created_by", "demo_created_at_utc", "decision_reason", "decision_history"];
const DATA_MANAGER_REQUEST_COLUMNS = ["schema_version", "round_id", "round_name", "round_status", "workflow_stage", "opens_at_utc", "closes_at_utc", "concept_box_id", "chair_file_id", "concept_title", "concept_file_name", "requested_study", "consortium_id", "chair_score", "chair_score_updated_at_utc", "study_id", "study_acronym", "study_name", "selection_file_id", "provision_status", "provision_error", "collection_status", "decision", "submitted", "decision_updated_at_utc", "access_notes", "dta_assignments", "access_updated_by", "access_updated_at_utc", "initiated_at_utc", "initiated_by_email", "updated_at_utc"];
const DATA_MANAGER_OWNED_COLUMNS = ["access_notes", "dta_assignments", "access_updated_by", "access_updated_at_utc", "manager_stage", "stage_updated_by", "stage_updated_at_utc"];
DATA_MANAGER_REQUEST_COLUMNS.push("manager_stage", "stage_updated_by", "stage_updated_at_utc");

export const DATA_MANAGER_STAGES = {
    chair_review: "Chair review",
    chair_clarification: "Chair clarification",
    chair_complete: "Chair review complete",
    admin_clarification: "Investigator clarification",
    admin_accepted: "Accepted",
    admin_denied: "Denied",
    scheduled: "Scheduled",
    awaiting_opt_in_out: "Awaiting opt-in/out",
    decision_overdue: "Decision overdue",
    ready_for_data_collection: "Ready for data collection",
    not_participating: "Not participating"
};

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
    if (!Array.isArray(items?.entries)) throw new Error("Unable to read folders from Box.");
    return boxEntries(items).find(item => item.type === "folder" && normalizeName(item.name) === normalizeName(folderName)) || null;
};

const findFile = async (parentId, fileName) => {
    const items = await getFolderItems(parentId, "name,type,id,parent", 1000);
    if (!Array.isArray(items?.entries)) throw new Error("Unable to read files from Box.");
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

const readTsv = async (fileId) => {
    const contents = await getFile(fileId);
    if (typeof contents !== "string") throw new Error("Unable to read the TSV from Box.");
    return parseTsv(contents);
};

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

const ensureSelectionFile = async ({ roundFolderId, round, study, concept, consortiumId = CONSORTIUM_ID, now, isDemo = false, demoCreatedBy = "" }) => {
    const fileName = getConceptSelectionFileName(concept.fileId);
    const existing = await findFile(roundFolderId, fileName);
    if (existing) return existing;

    const row = {
        schema_version: "1",
        round_id: round.id,
        round_name: round.name,
        consortium_id: consortiumId,
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

export const provisionOptInOutRound = async ({ round, concepts, studies, consortiumId = CONSORTIUM_ID, opensAt, closesAt, initiatedBy, onProgress, managerView = false }) => {
    const user = JSON.parse(localStorage.parms || "{}");
    const email = String(user.login || "").trim();
    const isAdmin = !managerView && emailsAllowedToUpdateData.includes(email);
    const testWorkspace = dataManagersInfo.find(item => item.isTest && normalizeStudyId(item.consortium) === normalizeStudyId(consortiumId));
    const manager = dataManagersInfo.find(item => item.email.toLowerCase() === email.toLowerCase()
        && normalizeStudyId(item.consortium) === normalizeStudyId(consortiumId));
    if (!isAdmin && !manager) throw new Error("You do not have access to initiate this consortium's round.");
    if (!round?.id || !round.name || !concepts?.length || !studies?.length
        || !Number.isFinite(Date.parse(opensAt)) || !Number.isFinite(Date.parse(closesAt)) || Date.parse(closesAt) <= Date.parse(opensAt)) {
        throw new Error("Choose a round, concepts, studies, and a valid opt-in/out period.");
    }
    if (studies.some(study => study.consortium && normalizeStudyId(study.consortium) !== normalizeStudyId(consortiumId))) {
        throw new Error("Study rosters must belong to the selected consortium.");
    }
    if (!isAdmin) {
        if (!manager.collectionFolderId) throw new Error("No collection folder is configured for this consortium.");
        const published = await ensureDataManagerRequestFile(manager);
        const eligible = new Set(published.filter(row => String(row.round_id) === String(round.id)
            && normalizeStudyId(row.consortium_id) === normalizeStudyId(consortiumId)
            && ["admin_accepted", "opt_in_out"].includes(row.workflow_stage)).map(row => String(row.concept_box_id)));
        if (concepts.some(concept => !eligible.has(String(concept.fileId)))) throw new Error("Only accepted concepts published to your consortium can be initiated.");
    }
    initiatedBy = email;
    const now = new Date().toISOString();
    const report = (message) => { if (typeof onProgress === "function") onProgress(message); };
    const configFolder = await getOrCreateOptInOutFolder(testWorkspace ? testWorkspace.collectionFolderId : isAdmin ? Confluence_Opt_In_Out : manager.collectionFolderId, CONFIG_FOLDER_NAME);
    let consortiumFolder;
    if (testWorkspace) {
        consortiumFolder = await getOrCreateOptInOutFolder(testWorkspace.collectionFolderId, "studies");
    } else if (isAdmin) {
        consortiumFolder = await getOrCreateOptInOutFolder(Confluence_Opt_In_Out, consortiumId);
    } else {
        // A manager may collaborate directly on a consortium folder without
        // being able to list the parent administrative folder.
        try { consortiumFolder = await findFolder(Confluence_Opt_In_Out, consortiumId); } catch (error) { /* Try direct collaborations below. */ }
        if (!consortiumFolder) {
            const roots = await getFolderItems("0", "name,type,id", 1000);
            consortiumFolder = boxEntries(roots).find(item => item.type === "folder" && normalizeName(item.name) === normalizeName(consortiumId));
        }
        if (!consortiumFolder) throw new Error(`The ${consortiumId} Opt-In/Out study folder must be shared with this data manager in Box before initiation.`);
    }
    const roundManifestRows = [];

    report(`Preparing ${studies.length} ${consortiumId} ${studies.length === 1 ? "assignment" : "studies"}...`);
    for (const study of studies) {
        const studyId = getStudyId(study);
        const studyFolder = await getOrCreateOptInOutFolder(consortiumFolder.id, studyId);
        const roundFolder = await getOrCreateOptInOutFolder(studyFolder.id, round.name);
        const studyManifestRows = [];

        for (const concept of concepts) {
            report(`Creating ${studyId}: ${concept.title}`);
            try {
                const selectionFile = await ensureSelectionFile({ roundFolderId: roundFolder.id, round, study, concept, consortiumId, now });
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
                    consortium_id: consortiumId,
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
                    consortium_id: consortiumId,
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
    let previousRound = roundsFile.rows.find(row => String(row.round_id) === String(round.id)
        && normalizeStudyId(row.consortium_id) === normalizeStudyId(consortiumId));
    const target = dataManagersInfo.find(item => item.collectionFolderId && normalizeStudyId(item.consortium) === normalizeStudyId(consortiumId));
    if (!previousRound && target) {
        const priorConfig = await findFolder(target.collectionFolderId, CONFIG_FOLDER_NAME);
        const priorRounds = priorConfig ? await readTsvInFolder(priorConfig.id, ROUNDS_FILE_NAME) : { rows: [] };
        previousRound = priorRounds.rows.find(row => String(row.round_id) === String(round.id)
            && normalizeStudyId(row.consortium_id) === normalizeStudyId(consortiumId));
    }
    const roundRow = {
        round_id: round.id,
        round_name: round.name,
        consortium_id: consortiumId,
        source_box_folder_id: round.id,
        status: roundManifestRows.some(row => row.provision_status === "error") ? "initializing" : "open",
        opens_at_utc: opensAt,
        closes_at_utc: closesAt,
        initiated_at_utc: previousRound?.initiated_at_utc || now,
        initiated_by_email: previousRound?.initiated_by_email || initiatedBy
    };
    await writeTsv(configFolder.id, ROUNDS_FILE_NAME, ROUND_COLUMNS, upsertRows(roundsFile.rows, [roundRow], row => `${row.round_id}|${row.consortium_id || CONSORTIUM_ID}`));
    const roundManifestFileName = normalizeStudyId(consortiumId) === normalizeStudyId(CONSORTIUM_ID)
        ? `${cleanTsvValue(round.name)}_manifest.tsv`
        : `${cleanTsvValue(round.name)}_${cleanBoxName(consortiumId)}_manifest.tsv`;
    await writeTsv(configFolder.id, roundManifestFileName, ROUND_MANIFEST_COLUMNS, roundManifestRows);

    // This denormalized index is retained for administrators. The completed
    // rows are published into each Data Manager's individual consortium TSV.
    const dataManagerRequests = await readTsvInFolder(configFolder.id, DATA_MANAGER_REQUESTS_FILE_NAME);
    const conceptById = new Map(concepts.map(concept => [String(concept.fileId), concept]));
    const existingRequestByKey = new Map(dataManagerRequests.rows.map(row => [getDataManagerRequestKey(row), row]));
    const requestRows = roundManifestRows.map(assignment => ({
        ...existingRequestByKey.get(getDataManagerRequestKey(assignment)),
        schema_version: "1",
        round_id: assignment.round_id,
        round_name: assignment.round_name,
        round_status: "open",
        workflow_stage: "opt_in_out",
        opens_at_utc: opensAt,
        closes_at_utc: closesAt,
        concept_box_id: assignment.concept_box_id,
        chair_file_id: existingRequestByKey.get(getDataManagerRequestKey(assignment))?.chair_file_id || "",
        concept_title: assignment.concept_title,
        concept_file_name: conceptById.get(String(assignment.concept_box_id))?.fileName || "",
        requested_study: existingRequestByKey.get(getDataManagerRequestKey(assignment))?.requested_study || consortiumId,
        consortium_id: assignment.consortium_id,
        chair_score: existingRequestByKey.get(getDataManagerRequestKey(assignment))?.chair_score || "--",
        chair_score_updated_at_utc: existingRequestByKey.get(getDataManagerRequestKey(assignment))?.chair_score_updated_at_utc || "",
        study_id: assignment.study_id,
        study_acronym: assignment.study_acronym,
        study_name: assignment.study_name,
        selection_file_id: assignment.selection_file_id,
        provision_status: assignment.provision_status,
        provision_error: assignment.provision_error,
        collection_status: existingRequestByKey.get(getDataManagerRequestKey(assignment))?.collection_status || (assignment.provision_status === "ready" ? "awaiting_opt_in_out" : "setup_error"),
        decision: existingRequestByKey.get(getDataManagerRequestKey(assignment))?.decision || "pending",
        submitted: existingRequestByKey.get(getDataManagerRequestKey(assignment))?.submitted || "false",
        decision_updated_at_utc: existingRequestByKey.get(getDataManagerRequestKey(assignment))?.decision_updated_at_utc || "",
        initiated_at_utc: roundRow.initiated_at_utc,
        initiated_by_email: roundRow.initiated_by_email,
        updated_at_utc: now
    }));
    const otherRoundRequests = dataManagerRequests.rows.filter(row => String(row.round_id) !== String(round.id) || normalizeStudyId(row.consortium_id) !== normalizeStudyId(consortiumId));
    const updatedDataManagerRequests = [...otherRoundRequests, ...requestRows];
    await writeTsv(configFolder.id, DATA_MANAGER_REQUESTS_FILE_NAME, DATA_MANAGER_REQUEST_COLUMNS, updatedDataManagerRequests);
    await publishRowsToDataManagerFiles(updatedDataManagerRequests, [consortiumId]);
    // Publish the schedule beside the consortium's assignments so an admin can
    // read manager-initiated rounds without relying on a central index update.
    if (target) {
        const targetConfig = await getOrCreateOptInOutFolder(target.collectionFolderId, CONFIG_FOLDER_NAME);
        const targetRounds = await readTsvInFolder(targetConfig.id, ROUNDS_FILE_NAME);
        await writeTsv(targetConfig.id, ROUNDS_FILE_NAME, ROUND_COLUMNS, upsertRows(targetRounds.rows, [roundRow], row => `${row.round_id}|${normalizeStudyId(row.consortium_id)}`));
    }

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
    const testWorkspace = dataManagersInfo.find(manager => manager.isTest && normalizeStudyId(manager.consortium) === normalizeStudyId(study.consortium));
    if (testWorkspace) {
        const studies = await findFolder(testWorkspace.collectionFolderId, "studies");
        return studies ? findFolder(studies.id, studyId) : null;
    }
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

const normalizeStudyId = value => String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

const getDataManagerRequestKey = row => `${row.round_id}|${normalizeStudyId(row.consortium_id)}|${normalizeStudyId(row.study_acronym || row.study_id || row.study_name)}|${row.concept_box_id}`;

export const publishDataManagerChairRequests = async ({ round, reviews, studies, initiatedBy }) => {
    const now = new Date().toISOString();
    const configFolder = await getOrCreateOptInOutFolder(Confluence_Opt_In_Out, CONFIG_FOLDER_NAME);
    const requestFile = await readTsvInFolder(configFolder.id, DATA_MANAGER_REQUESTS_FILE_NAME);
    const requestsByKey = new Map(requestFile.rows.map(row => [getDataManagerRequestKey(row), row]));

    reviews.forEach(review => {
        const requestedStudy = String(review.consortium || CONSORTIUM_ID);
        const consortiumStudies = studies.filter(study => normalizeStudyId(study.consortium || CONSORTIUM_ID) === normalizeStudyId(requestedStudy));
        const matchingStudies = consortiumStudies.length
            ? consortiumStudies
            : studies.filter(study => [study.acronym, study.name].some(value => normalizeStudyId(value) === normalizeStudyId(requestedStudy)));
        const managerTargets = matchingStudies.length
            ? matchingStudies
            : [{ acronym: requestedStudy, name: requestedStudy, consortium: requestedStudy }];
        managerTargets.forEach(study => {
            const row = {
                schema_version: "1",
                round_id: round.id,
                round_name: round.name,
                round_status: "open",
                workflow_stage: review.workflowStage || "chair_review",
                opens_at_utc: "",
                closes_at_utc: "",
                concept_box_id: String(review.sourceFileId),
                chair_file_id: String(review.chairFileId || ""),
                concept_title: review.title || review.fileName,
                concept_file_name: review.fileName,
                requested_study: requestedStudy,
                consortium_id: requestedStudy,
                chair_score: review.chairScore || "--",
                chair_score_updated_at_utc: review.chairScore && review.chairScore !== "--" ? now : "",
                study_id: study.acronym || study.name,
                study_acronym: study.acronym,
                study_name: study.name,
                selection_file_id: "",
                provision_status: "ready",
                provision_error: "",
                collection_status: review.workflowStage || "chair_review",
                decision: "pending",
                submitted: "false",
                decision_updated_at_utc: "",
                initiated_at_utc: now,
                initiated_by_email: initiatedBy,
                updated_at_utc: now
            };
            const key = getDataManagerRequestKey(row);
            const existing = requestsByKey.get(key);
            requestsByKey.set(key, existing ? {
                ...existing,
                ...row,
                ...(existing.selection_file_id ? Object.fromEntries([
                    "selection_file_id", "workflow_stage", "round_status", "opens_at_utc", "closes_at_utc",
                    "provision_status", "provision_error", "collection_status", "decision", "submitted", "decision_updated_at_utc"
                ].map(field => [field, existing[field]])) : {}),
                chair_score: review.chairScore && review.chairScore !== "--" ? review.chairScore : (existing.chair_score || row.chair_score),
                chair_score_updated_at_utc: review.chairScore && review.chairScore !== "--" ? now : (existing.chair_score_updated_at_utc || ""),
                initiated_at_utc: existing.initiated_at_utc || now
            } : row);
        });
    });

    const updatedRequests = Array.from(requestsByKey.values());
    await writeTsv(configFolder.id, DATA_MANAGER_REQUESTS_FILE_NAME, DATA_MANAGER_REQUEST_COLUMNS, updatedRequests);
    await publishRowsToDataManagerFiles(updatedRequests, reviews.map(review => review.consortium || CONSORTIUM_ID));
};

export const updateDataManagerChairStatus = async ({ conceptBoxId, consortium, score, workflowStage }) => {
    const configFolder = await findFolder(Confluence_Opt_In_Out, CONFIG_FOLDER_NAME);
    if (!configFolder) return false;
    const requestFile = await readTsvInFolder(configFolder.id, DATA_MANAGER_REQUESTS_FILE_NAME);
    if (!requestFile.file) return false;
    const now = new Date().toISOString();
    let matched = false;
    const affectedConsortia = new Set();
    const rows = requestFile.rows.map(row => {
        const sameConcept = String(row.concept_box_id) === String(conceptBoxId);
        const sameConsortium = !consortium || String(row.consortium_id || row.requested_study).toLowerCase() === String(consortium).toLowerCase();
        if (!sameConcept || !sameConsortium) return row;
        matched = true;
        affectedConsortia.add(row.consortium_id || row.requested_study);
        return {
            ...row,
            workflow_stage: workflowStage || row.workflow_stage,
            collection_status: workflowStage || row.collection_status,
            chair_score: score === undefined ? row.chair_score : (score || "--"),
            chair_score_updated_at_utc: score === undefined ? row.chair_score_updated_at_utc : now,
            updated_at_utc: now
        };
    });
    if (!matched) return false;
    await writeTsv(configFolder.id, DATA_MANAGER_REQUESTS_FILE_NAME, DATA_MANAGER_REQUEST_COLUMNS, rows);
    await publishRowsToDataManagerFiles(rows, affectedConsortia);
    return true;
};

export const filterDataManagerRequestRows = (rows, consortium = null) => {
    const allowedConsortiumId = consortium ? normalizeStudyId(consortium) : null;
    const visibleConcepts = new Map();

    rows.forEach(row => {
        if (allowedConsortiumId && normalizeStudyId(row.consortium_id) !== allowedConsortiumId) return;
        const conceptId = String(row.concept_box_id || row.concept_file_name || row.concept_title || "").trim();
        const conceptKey = `${row.round_id || row.round_name}|${normalizeStudyId(row.consortium_id)}|${conceptId}`;
        if (!visibleConcepts.has(conceptKey)) visibleConcepts.set(conceptKey, row);
    });

    return Array.from(visibleConcepts.values());
};

export const getDataManagerFileName = consortiumId => `${cleanBoxName(consortiumId) || "unknown_consortium"}.tsv`;

const getLegacyDataManagerFileName = managerName => `${cleanBoxName(managerName) || "unknown_data_manager"}.tsv`;

const getVisibleDataManagerRequestKey = row => {
    const conceptId = String(row.concept_box_id || row.concept_file_name || row.concept_title || "").trim();
    return `${row.round_id || row.round_name}|${normalizeStudyId(row.consortium_id)}|${conceptId}`;
};

const mergeDataManagerRows = (sourceRows, managerRows) => {
    const managerRowsByKey = new Map(managerRows.map(row => [getVisibleDataManagerRequestKey(row), row]));
    const sourceKeys = new Set(sourceRows.map(getVisibleDataManagerRequestKey));
    const synchronizedRows = sourceRows.map(sourceRow => {
        const managerRow = managerRowsByKey.get(getVisibleDataManagerRequestKey(sourceRow));
        const managerOwnedValues = Object.fromEntries(DATA_MANAGER_OWNED_COLUMNS.map(column => [column, managerRow?.[column] || ""]));
        const initiatedValues = managerRow?.selection_file_id && !sourceRow.selection_file_id && sourceRow.workflow_stage !== "admin_denied"
            ? Object.fromEntries(["selection_file_id", "workflow_stage", "round_status", "opens_at_utc", "closes_at_utc", "initiated_at_utc", "initiated_by_email", "updated_at_utc"].map(column => [column, managerRow[column]])) : {};
        return { ...sourceRow, ...initiatedValues, ...managerOwnedValues };
    });
    return [...synchronizedRows, ...managerRows.filter(row => !sourceKeys.has(getVisibleDataManagerRequestKey(row)))];
};

const mergeLegacyDataManagerRows = rows => {
    const rowsByKey = new Map();
    rows.forEach(row => {
        const key = getVisibleDataManagerRequestKey(row);
        const existing = rowsByKey.get(key);
        if (!existing) {
            rowsByKey.set(key, row);
            return;
        }
        const existingUpdatedAt = Date.parse(existing.access_updated_at_utc || "") || 0;
        const rowUpdatedAt = Date.parse(row.access_updated_at_utc || "") || 0;
        const newer = rowUpdatedAt >= existingUpdatedAt ? row : existing;
        const older = newer === row ? existing : row;
        const managerOwnedValues = Object.fromEntries(DATA_MANAGER_OWNED_COLUMNS.map(column => [column, newer[column] || older[column] || ""]));
        rowsByKey.set(key, { ...older, ...newer, ...managerOwnedValues });
    });
    return Array.from(rowsByKey.values());
};

const loadLegacyDataManagerRows = async (configFolderId, consortiumId) => {
    const legacyManagerNames = Array.from(new Set(dataManagersInfo
        .filter(manager => normalizeStudyId(manager.consortium) === normalizeStudyId(consortiumId))
        .map(manager => manager.name)
        .filter(Boolean)));
    const legacyFiles = await Promise.all(legacyManagerNames.map(managerName => readTsvInFolder(configFolderId, getLegacyDataManagerFileName(managerName))));
    return mergeLegacyDataManagerRows(legacyFiles.flatMap(result => result.rows));
};

// Administrative workflows publish each consortium's request rows directly to
// its Data Managers. Managers therefore never need access to the central index.
const publishRowsToDataManagerFiles = async (sourceRows, consortiumIds = null) => {
    const requestedConsortia = consortiumIds
        ? new Set(Array.from(consortiumIds, normalizeStudyId))
        : null;
    const configuredConsortia = Array.from(dataManagersInfo.reduce((consortia, manager) => {
        if (!manager.consortium || !manager.collectionFolderId) return consortia;
        if (manager.isTest && !requestedConsortia?.has(normalizeStudyId(manager.consortium))) return consortia;
        if (requestedConsortia && !requestedConsortia.has(normalizeStudyId(manager.consortium))) return consortia;
        consortia.set(normalizeStudyId(manager.consortium), { consortium: manager.consortium, collectionFolderId: manager.collectionFolderId });
        return consortia;
    }, new Map()).values());
    for (const consortium of configuredConsortia) {
        const managerConfigFolder = await getOrCreateOptInOutFolder(consortium.collectionFolderId, CONFIG_FOLDER_NAME);
        const managerFileName = getDataManagerFileName(consortium.consortium);
        await publishStudyAccessIndex(managerConfigFolder.id, sourceRows.filter(row => normalizeStudyId(row.consortium_id) === normalizeStudyId(consortium.consortium)));
        const managerFile = await readTsvInFolder(managerConfigFolder.id, managerFileName);
        const existingRows = managerFile.file ? managerFile.rows : await loadLegacyDataManagerRows(managerConfigFolder.id, consortium.consortium);
        const visibleRows = filterDataManagerRequestRows(sourceRows, consortium.consortium);
        const mergedRows = mergeDataManagerRows(visibleRows, existingRows);
        if (!managerFile.file || serializeTsv(DATA_MANAGER_REQUEST_COLUMNS, managerFile.rows) !== serializeTsv(DATA_MANAGER_REQUEST_COLUMNS, mergedRows)) {
            await writeTsv(managerConfigFolder.id, managerFileName, DATA_MANAGER_REQUEST_COLUMNS, mergedRows);
        }
    }
};

export const ensureDataManagerRequestFile = async manager => {
    if (!manager?.consortium) throw new Error("A configured Data Manager consortium is required.");
    if (!manager.collectionFolderId) throw new Error(`${manager.consortium || "This consortium"} data collection is still in progress.`);
    const managerConfigFolder = await getOrCreateOptInOutFolder(manager.collectionFolderId, CONFIG_FOLDER_NAME);
    const managerFileName = getDataManagerFileName(manager.consortium);
    const managerFile = await readTsvInFolder(managerConfigFolder.id, managerFileName);
    if (!managerFile.file) {
        const legacyRows = await loadLegacyDataManagerRows(managerConfigFolder.id, manager.consortium);
        await writeTsv(managerConfigFolder.id, managerFileName, DATA_MANAGER_REQUEST_COLUMNS, legacyRows);
        return legacyRows;
    }
    return managerFile.rows;
};

export const seedTestDataManagerRequests = async ({ rounds, studies }) => {
    const email = String(JSON.parse(localStorage.parms || "{}").login || "").trim();
    const manager = dataManagersInfo.find(item => item.isTest && item.email.toLowerCase() === email.toLowerCase());
    if (!manager?.collectionFolderId) throw new Error("A test data-manager workspace is required.");
    if (!studies.length || studies.some(study => study.consortium !== manager.consortium)) throw new Error("Use only the TEST study roster.");
    const config = await getOrCreateOptInOutFolder(manager.collectionFolderId, CONFIG_FOLDER_NAME);
    const existing = await readTsvInFolder(config.id, DATA_MANAGER_REQUESTS_FILE_NAME);
    const previous = new Map(existing.rows.map(row => [getDataManagerRequestKey(row), row]));
    const now = new Date().toISOString();
    const added = rounds.flatMap(round => round.concepts.flatMap(concept => studies.map(study => {
        const row = { schema_version: "1", round_id: round.id, round_name: round.name, consortium_id: manager.consortium,
            workflow_stage: "admin_accepted", concept_box_id: concept.fileId, concept_title: concept.title,
            concept_file_name: concept.fileName, requested_study: manager.consortium,
            study_id: getStudyId(study), study_acronym: study.acronym, study_name: study.name,
            decision: "pending", submitted: "false", updated_at_utc: now };
        // Existing simulated decisions, schedules, and manager notes survive a refresh.
        return { ...row, ...previous.get(getDataManagerRequestKey(row)) };
    })));
    const rows = upsertRows(existing.rows, added, getDataManagerRequestKey);
    if (!existing.file || serializeTsv(DATA_MANAGER_REQUEST_COLUMNS, existing.rows) !== serializeTsv(DATA_MANAGER_REQUEST_COLUMNS, rows)) {
        await writeTsv(config.id, DATA_MANAGER_REQUESTS_FILE_NAME, DATA_MANAGER_REQUEST_COLUMNS, rows);
    }
    await publishRowsToDataManagerFiles(rows, [manager.consortium]);
    return rows;
};

export const loadDataManagerRequests = async (manager = null) => {
    if (manager?.consortium) {
        const managerRows = await ensureDataManagerRequestFile(manager);
        return hydrateStudyAccessSelections(managerRows.filter(row => normalizeStudyId(row.consortium_id) === normalizeStudyId(manager.consortium)));
    }

    const configFolder = await findFolder(Confluence_Opt_In_Out, CONFIG_FOLDER_NAME);
    if (!configFolder) return [];
    const sourceFile = await readTsvInFolder(configFolder.id, DATA_MANAGER_REQUESTS_FILE_NAME);
    const visibleRows = filterDataManagerRequestRows(sourceFile.rows);

    return Promise.all(visibleRows.map(async row => {
        if (!row.selection_file_id) return { ...row, decision: "pending", submitted: "false" };
        try {
            const selection = (await readTsv(row.selection_file_id))[0] || {};
            return { ...row, ...selection, selection_file_id: row.selection_file_id };
        } catch (error) {
            return { ...row, decision: "unavailable", submitted: "false", load_error: error.message };
        }
    }));
};

export const saveDataManagerStage = async ({ roundId, conceptBoxId, consortiumId, stage }) => {
    if (stage !== "" && !Object.hasOwn(DATA_MANAGER_STAGES, stage)) throw new Error("Invalid current stage.");
    const email = String(JSON.parse(localStorage.parms || "{}").login || "").trim();
    const managers = dataManagersInfo.filter(manager => manager.email.toLowerCase() === email.toLowerCase());
    const manager = managers.find(item => normalizeStudyId(item.consortium) === normalizeStudyId(consortiumId));
    const isAdmin = emailsAllowedToUpdateData.some(item => item.toLowerCase() === email.toLowerCase());
    if (!manager && (managers.length || !isAdmin)) throw new Error("You do not have access to this consortium.");
    const root = manager ? manager.collectionFolderId : Confluence_Opt_In_Out;
    if (!root) throw new Error("No collection folder is configured.");
    const folder = await findFolder(root, CONFIG_FOLDER_NAME);
    if (!folder) throw new Error("The request folder was not found.");
    const fileName = manager ? getDataManagerFileName(manager.consortium) : DATA_MANAGER_REQUESTS_FILE_NAME;
    const file = await readTsvInFolder(folder.id, fileName);
    if (!file.file) throw new Error("The request file was not found.");
    const updatedAt = new Date().toISOString();
    let matched = false;
    const rows = file.rows.map(row => {
        if (String(row.round_id) !== String(roundId) || String(row.concept_box_id) !== String(conceptBoxId)
            || normalizeStudyId(row.consortium_id) !== normalizeStudyId(consortiumId)) return row;
        matched = true;
        return { ...row, manager_stage: stage, stage_updated_by: email, stage_updated_at_utc: updatedAt };
    });
    if (!matched) throw new Error("The request was not found. Reload the page.");
    await writeTsv(folder.id, fileName, DATA_MANAGER_REQUEST_COLUMNS, rows);
    return { stage, updatedBy: email, updatedAt };
};

export const saveDataManagerAccessDetails = async ({ roundId, conceptBoxId, consortiumId, notes, dtaAssignments, updatedBy, dataManagerConsortium, dataManagerFolderId }) => {
    const email = String(JSON.parse(localStorage.parms || "{}").login || "").trim();
    const manager = dataManagersInfo.find(item => item.email.toLowerCase() === email.toLowerCase()
        && normalizeStudyId(item.consortium) === normalizeStudyId(consortiumId));
    const testUser = dataManagersInfo.find(item => item.isTest && item.email.toLowerCase() === email.toLowerCase());
    if (testUser && (!manager || dataManagerConsortium !== manager.consortium || String(dataManagerFolderId) !== String(manager.collectionFolderId))) {
        throw new Error("Test data-manager changes must stay inside the TEST workspace.");
    }
    const storageRootId = manager?.isTest ? manager.collectionFolderId : dataManagerConsortium ? dataManagerFolderId : Confluence_Opt_In_Out;
    if (manager?.isTest) updatedBy = email;
    if (!storageRootId) throw new Error(`${consortiumId || "This consortium"} data collection is still in progress.`);
    const configFolder = await findFolder(storageRootId, CONFIG_FOLDER_NAME);
    if (!configFolder) throw new Error("The Data Manager configuration folder was not found.");
    const requestFileName = dataManagerConsortium ? getDataManagerFileName(dataManagerConsortium) : DATA_MANAGER_REQUESTS_FILE_NAME;
    const requestFile = await readTsvInFolder(configFolder.id, requestFileName);
    if (!requestFile.file) throw new Error(`The Data Manager file ${requestFileName} was not found.`);

    const cleanAssignments = (Array.isArray(dtaAssignments) ? dtaAssignments : [])
        .map(assignment => ({
            dta: cleanTsvValue(assignment?.dta),
            people: cleanTsvValue(assignment?.people),
            files: (Array.isArray(assignment?.files) ? assignment.files : []).map(file => ({
                fileId: cleanTsvValue(file?.fileId),
                fileName: cleanTsvValue(file?.fileName),
                folderId: cleanTsvValue(file?.folderId),
                uploadedAt: cleanTsvValue(file?.uploadedAt),
                uploadedBy: cleanTsvValue(file?.uploadedBy)
            })).filter(file => file.fileId)
        }))
        .filter(assignment => assignment.dta || assignment.people || assignment.files.length);
    const now = new Date().toISOString();
    let matched = false;
    const rows = requestFile.rows.map(row => {
        const isMatch = String(row.round_id) === String(roundId)
            && String(row.concept_box_id) === String(conceptBoxId)
            && normalizeStudyId(row.consortium_id) === normalizeStudyId(consortiumId);
        if (!isMatch) return row;
        matched = true;
        return {
            ...row,
            access_notes: cleanTsvValue(notes),
            dta_assignments: JSON.stringify(cleanAssignments),
            access_updated_by: cleanTsvValue(updatedBy),
            access_updated_at_utc: now,
            updated_at_utc: now
        };
    });
    if (!matched) throw new Error("The Data Manager request could not be matched.");
    await writeTsv(configFolder.id, requestFileName, DATA_MANAGER_REQUEST_COLUMNS, rows);
    return { notes: cleanTsvValue(notes), dtaAssignments: cleanAssignments, updatedBy: cleanTsvValue(updatedBy), updatedAt: now };
};

// The manager request list is concept-level; this index must retain every study
// and round so both review tables point to the original selection TSVs.
const publishStudyAccessIndex = async (folderId, rows) => {
    const existing = await readTsvInFolder(folderId, STUDY_ACCESS_FILE_NAME);
    const existingByKey = new Map(existing.rows.map(row => [getDataManagerRequestKey(row), row]));
    const incoming = rows.filter(row => row.selection_file_id || row.workflow_stage === "opt_in_out").map(row => {
        const previous = existingByKey.get(getDataManagerRequestKey(row));
        return previous && (Date.parse(previous.updated_at_utc) || 0) > (Date.parse(row.updated_at_utc) || 0) ? previous : row;
    });
    const assignments = upsertRows(existing.rows, incoming, getDataManagerRequestKey);
    if (!existing.file || serializeTsv(DATA_MANAGER_REQUEST_COLUMNS, existing.rows) !== serializeTsv(DATA_MANAGER_REQUEST_COLUMNS, assignments)) {
        await writeTsv(folderId, STUDY_ACCESS_FILE_NAME, DATA_MANAGER_REQUEST_COLUMNS, assignments);
    }
};

const studyAccessUser = managerView => {
    const user = JSON.parse(localStorage.parms || "{}");
    const email = String(user.login || "").trim();
    const managers = dataManagersInfo.filter(manager => manager.email.toLowerCase() === email.toLowerCase());
    if (managerView ? !managers.length : !emailsAllowedToUpdateData.includes(email)) throw new Error("You do not have access to these study selections.");
    return { name: user.name || "", email, managers, managerView };
};

const applyOptInOutSchedules = async (rows, configId) => {
    const rounds = await readTsvInFolder(configId, ROUNDS_FILE_NAME);
    return rows.map(row => {
        const round = rounds.rows.find(item => String(item.round_id) === String(row.round_id)
            && normalizeStudyId(item.consortium_id || CONSORTIUM_ID) === normalizeStudyId(row.consortium_id));
        return round ? { ...row, opens_at_utc: round.opens_at_utc, closes_at_utc: round.closes_at_utc,
            initiated_at_utc: round.initiated_at_utc, initiated_by_email: round.initiated_by_email,
            round_status: round.status === "initializing" ? "initializing" : row.round_status || round.status } : row;
    });
};

const loadStudyAccessIndex = async managerView => {
    const user = studyAccessUser(managerView);
    if (managerView) {
        const uniqueManagers = Array.from(new Map(user.managers.map(manager => [normalizeStudyId(manager.consortium), manager])).values());
        const results = await Promise.all(uniqueManagers.map(async manager => {
            if (!manager.collectionFolderId) throw new Error(`No Box collection folder is configured for ${manager.consortium}.`);
            const folder = await findFolder(manager.collectionFolderId, CONFIG_FOLDER_NAME);
            const index = folder ? await readTsvInFolder(folder.id, STUDY_ACCESS_FILE_NAME) : null;
            if (!index?.file) throw new Error(`The ${manager.consortium} study assignment index has not been published. Ask an administrator to open Study Access Admin or initiate the round.`);
            return applyOptInOutSchedules(index.rows.filter(row => normalizeStudyId(row.consortium_id) === normalizeStudyId(manager.consortium)), folder.id);
        }));
        return results.flat();
    }
    const folder = await findFolder(Confluence_Opt_In_Out, CONFIG_FOLDER_NAME);
    const assignments = new Map();
    if (folder) {
        const index = await readTsvInFolder(folder.id, DATA_MANAGER_REQUESTS_FILE_NAME);
        index.rows.filter(row => row.selection_file_id || row.workflow_stage === "opt_in_out")
            .forEach(row => assignments.set(getDataManagerRequestKey(row), row));
        // Round manifests survive a request-index refresh and remain the inventory
        // of provisioned studies, including assignments whose creation failed.
        const items = await getFolderItems(folder.id, "name,type,id,parent", 1000);
        if (!Array.isArray(items?.entries)) throw new Error("Unable to read round manifests from Box.");
        for (const file of items.entries.filter(item => item.type === "file" && item.name.endsWith("_manifest.tsv"))) {
            for (const row of await readTsv(file.id)) {
                if (!row.round_id || !row.consortium_id || !row.study_id) continue;
                const key = getDataManagerRequestKey(row);
                assignments.set(key, { ...assignments.get(key), ...row, workflow_stage: "opt_in_out" });
            }
        }
        for (const row of await applyOptInOutSchedules(Array.from(assignments.values()), folder.id)) assignments.set(getDataManagerRequestKey(row), row);
    }
    // Managers publish to their own consortium folder, rather than requiring
    // write access to the central administrative configuration.
    const consortia = Array.from(new Map(dataManagersInfo.filter(manager => manager.collectionFolderId && !manager.isTest)
        .map(manager => [normalizeStudyId(manager.consortium), manager])).values());
    for (const manager of consortia) {
        const config = await findFolder(manager.collectionFolderId, CONFIG_FOLDER_NAME);
        if (!config) continue;
        const index = await readTsvInFolder(config.id, STUDY_ACCESS_FILE_NAME);
        const scopedRows = await applyOptInOutSchedules(index.rows.filter(row => normalizeStudyId(row.consortium_id) === normalizeStudyId(manager.consortium)), config.id);
        scopedRows.forEach(row => {
            const key = getDataManagerRequestKey(row);
            const previous = assignments.get(key);
            if (!previous || (Date.parse(row.updated_at_utc) || 0) >= (Date.parse(previous.updated_at_utc) || 0)) assignments.set(key, row);
        });
    }
    return Array.from(assignments.values());
};

export const loadOptInOutProgressRows = async (managerView = false) => {
    const user = studyAccessUser(managerView);
    const assignments = await loadStudyAccessAssignments(managerView);
    const managers = managerView ? user.managers : Array.from(new Map(dataManagersInfo.filter(manager => manager.collectionFolderId && !manager.isTest)
        .map(manager => [normalizeStudyId(manager.consortium), manager])).values());
    const rows = [...assignments];
    const keys = new Set(assignments.map(getVisibleDataManagerRequestKey));
    for (const manager of managers) {
        const published = await loadDataManagerRequests(manager);
        published.filter(row => row.workflow_stage === "admin_accepted" && !keys.has(getVisibleDataManagerRequestKey(row)))
            .forEach(row => rows.push({ ...row, round_status: "not_started", selection_file_id: "", opens_at_utc: "", closes_at_utc: "", initiated_at_utc: "", initiated_by_email: "" }));
    }
    return rows;
};

const hydrateStudyAccessSelections = async rows => {
    const result = [];
    for (let index = 0; index < rows.length; index += 10) {
        result.push(...await Promise.all(rows.slice(index, index + 10).map(async row => {
            if (!row.selection_file_id) return row.workflow_stage === "opt_in_out"
                ? { ...row, decision: "unavailable", load_error: "No selection file. An administrator must initiate or retry this round." }
                : { ...row, decision: row.decision || "pending", submitted: row.submitted || "false" };
            try {
                const selection = (await readTsv(row.selection_file_id))[0];
                if (!selection || !["pending", "opt_in", "opt_out"].includes(selection.decision)) throw new Error("Invalid selection file.");
                for (const field of ["round_id", "consortium_id", "study_id", "concept_box_id"]) {
                    if (String(selection[field]) !== String(row[field])) throw new Error("The selection file does not match its assignment.");
                }
                return { ...row, ...selection, selection_file_id: row.selection_file_id };
            } catch (error) {
                return { ...row, decision: "unavailable", load_error: error.message || "Unable to read the selection from Box." };
            }
        })));
    }
    return result;
};

const studyAccessLoads = new Map();
export const loadStudyAccessAssignments = async (managerView = false) => {
    const user = studyAccessUser(managerView);
    const key = `${user.email}|${managerView}`;
    if (studyAccessLoads.has(key)) return studyAccessLoads.get(key);
    const request = (async () => {
        const rows = await loadStudyAccessIndex(managerView);
        // Backfill consortium indexes for rounds initiated before this index existed.
        if (!managerView) {
            const consortia = Array.from(new Map(dataManagersInfo.filter(manager => manager.collectionFolderId && !manager.isTest)
                .map(manager => [normalizeStudyId(manager.consortium), manager])).values());
            for (const manager of consortia) {
                const folder = await getOrCreateOptInOutFolder(manager.collectionFolderId, CONFIG_FOLDER_NAME);
                await publishStudyAccessIndex(folder.id, rows.filter(row => normalizeStudyId(row.consortium_id) === normalizeStudyId(manager.consortium)));
            }
        }
        return hydrateStudyAccessSelections(rows);
    })();
    studyAccessLoads.set(key, request);
    try {
        return await request;
    } finally {
        studyAccessLoads.delete(key);
    }
};

export const saveStudyAccessSelection = async ({ assignment, decision, reason, managerView = false }) => {
    const user = studyAccessUser(managerView);
    const cleanReason = String(reason || "").trim();
    if (!cleanReason) throw new Error("A reason is required.");
    if (!["opt_in", "opt_out"].includes(decision)) throw new Error("Invalid Opt-In/Opt-Out decision.");
    const index = await loadStudyAccessIndex(managerView);
    const match = index.find(row => row.selection_file_id && String(row.selection_file_id) === String(assignment.selection_file_id)
        && ["round_id", "consortium_id", "study_id", "concept_box_id"].every(field => String(row[field]) === String(assignment[field])));
    if (!match) throw new Error("You do not have access to this study assignment.");
    const result = await saveOptInOutSelections([{
        selectionFileId: match.selection_file_id, decision, reason: cleanReason, expectedSelection: assignment
    }], user);
    if (result.failed.length) throw new Error(result.failed[0].error);
    const updated = result.saved[0].updated;
    let warning = "";
    if (dataManagersInfo.some(manager => manager.isTest && normalizeStudyId(manager.consortium) === normalizeStudyId(updated.consortium_id))) {
        return { updated: { ...assignment, ...updated }, warning };
    }
    try {
        const response = await createComment(match.concept_box_id, "Study Opt-In/Out selection updated: " + JSON.stringify({
            round: updated.round_name, consortium: updated.consortium_id, study: updated.study_acronym || updated.study_id,
            selection_file_id: match.selection_file_id, previous: assignment.decision, decision, reason: cleanReason,
            changed_by: user.email, changed_at_utc: updated.updated_at_utc
        }));
        if (response?.status !== 201) throw new Error("Box did not confirm the audit comment.");
    } catch (error) {
        warning = "The selection and reason were saved in the selection TSV, but the additional concept comment could not be posted.";
    }
    return { updated: { ...assignment, ...updated }, warning };
};

export const saveOptInOutSelections = async (changes, user) => {
    const saved = [];
    const failed = [];
    const scopedTest = (user.managerView || user.testMode) && dataManagersInfo.find(manager => manager.isTest
        && manager.email.toLowerCase() === String(user.email || "").toLowerCase());
    const testAssignments = scopedTest ? await loadStudyAccessIndex(true) : [];
    for (const change of changes) {
        try {
            if (!["opt_in", "opt_out"].includes(change.decision)) throw new Error("Invalid Opt-In/Opt-Out decision.");
            const rows = await readTsv(change.selectionFileId);
            if (!rows.length) throw new Error("The selection TSV is empty.");
            if (scopedTest && !testAssignments.some(assignment => String(assignment.selection_file_id) === String(change.selectionFileId)
                && ["round_id", "consortium_id", "study_id", "concept_box_id"].every(field => String(assignment[field]) === String(rows[0][field])))) {
                throw new Error("Test mode can update only selections in the TEST workspace.");
            }
            if (change.expectedSelection) {
                const expected = change.expectedSelection;
                for (const field of ["round_id", "consortium_id", "study_id", "concept_box_id", "decision", "updated_at_utc"]) {
                    if (String(rows[0][field] || "") !== String(expected[field] || "")) throw new Error("This selection has changed. Reload the page before editing it.");
                }
            }
            const now = new Date().toISOString();
            let history;
            if (change.reason) {
                history = JSON.parse(rows[0].decision_history || "[]");
                if (!Array.isArray(history)) throw new Error("The selection audit history is invalid.");
                history.push({ previous: rows[0].decision, decision: change.decision, reason: change.reason, changed_by: user.email, changed_at_utc: now });
            }
            const updated = {
                ...rows[0],
                decision: change.decision,
                submitted: "true",
                submitted_by_name: user.name || "",
                submitted_by_email: user.email || "",
                submitted_at_utc: now,
                updated_at_utc: now
            };
            if (history) {
                updated.decision_reason = change.reason;
                updated.decision_history = JSON.stringify(history);
            }
            const result = await uploadFileVersion(serializeTsv(SELECTION_COLUMNS, [updated]), change.selectionFileId, TSV_MIME_TYPE);
            if (!result?.entries?.length) throw new Error(result?.statusText || "Box did not confirm the update.");
            saved.push({ ...change, updated });
        } catch (error) {
            failed.push({ ...change, error: error.message });
        }
    }

    if (saved.length) {
        try {
            const roots = new Set(saved.map(item => dataManagersInfo.find(manager => manager.isTest
                && normalizeStudyId(manager.consortium) === normalizeStudyId(item.updated.consortium_id))?.collectionFolderId || Confluence_Opt_In_Out));
            for (const root of roots) {
                const configFolder = await findFolder(root, CONFIG_FOLDER_NAME);
                if (configFolder) {
                    const requestFile = await readTsvInFolder(configFolder.id, DATA_MANAGER_REQUESTS_FILE_NAME);
                    if (requestFile.file) {
                        const savedByFileId = new Map(saved.map(item => [String(item.selectionFileId), item.updated]));
                        const affectedConsortia = new Set();
                        const updatedRequests = requestFile.rows.map(row => {
                            const selection = savedByFileId.get(String(row.selection_file_id));
                            if (!selection) return row;
                            affectedConsortia.add(selection.consortium_id || row.consortium_id);
                            return {
                                ...row,
                                collection_status: selection.decision === "opt_in" ? "ready_for_data_collection" : "not_participating",
                                decision: selection.decision,
                                submitted: selection.submitted,
                                decision_updated_at_utc: selection.updated_at_utc,
                                updated_at_utc: selection.updated_at_utc
                            };
                        });
                        await writeTsv(configFolder.id, DATA_MANAGER_REQUESTS_FILE_NAME, DATA_MANAGER_REQUEST_COLUMNS, updatedRequests);
                        await publishRowsToDataManagerFiles(updatedRequests, affectedConsortia);
                    }
                }
            }
        } catch (error) {
            // Selection TSVs remain authoritative even if the administrative index refresh fails.
            console.warn("Unable to refresh the Data Manager request index:", error);
        }
    }
    return { saved, failed };
};
