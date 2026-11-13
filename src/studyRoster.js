import { studyManagersInfo, refreshToken } from './shared.js';
import { studyManagerRosterFiles } from './studyRosterConfig.js';

const LEGACY_CNCI_ROSTER = './src/data/DataPlatform-Out-in-out.xlsx';
const CACHE_MS = 60000;
const rosterLoads = new Map();
const clean = value => String(value ?? '').trim();
const lower = value => clean(value).toLowerCase();
const normalizeConsortium = value => clean(value).toUpperCase();
const headers = ['Consortium', 'Name', 'Email', 'Study Acronym', 'Study Name', 'Active'];

export const buildStudyRoster = managers => {
    const studies = new Map();
    managers.forEach(manager => manager.studies.forEach(study => {
        const key = `${manager.consortium}|${lower(study.acronym || study.name)}`;
        const existing = studies.get(key) || { ...study, consortium: manager.consortium, studyManagerEmails: [] };
        if (!existing.studyManagerEmails.includes(manager.email)) existing.studyManagerEmails.push(manager.email);
        studies.set(key, existing);
    }));
    return { managers, studies: Array.from(studies.values()) };
};

// One row per manager/study pair. Multiple rows may belong to one manager,
// and multiple managers may represent the same study.
export const parseStudyManagerRoster = (matrix, consortium) => {
    const consortiumId = normalizeConsortium(consortium);
    const columns = (matrix[0] || []).map(lower);
    const positions = headers.map(header => columns.indexOf(lower(header)));
    const missing = headers.filter((header, index) => positions[index] < 0);
    if (missing.length) throw new Error(`${consortiumId} roster: missing columns: ${missing.join(', ')}.`);
    const managers = new Map();
    const studyNames = new Map();
    matrix.slice(1).forEach((row, index) => {
        if (!row.some(value => clean(value))) return;
        const [rowConsortium, name, emailValue, acronym, studyName, active] = positions.map(position => clean(row[position]));
        const fail = message => { throw new Error(`${consortiumId} roster, row ${index + 2}: ${message}`); };
        if (!['', 'yes', 'no'].includes(lower(active))) fail('Active must be Yes or No.');
        if (lower(active) === 'no') return;
        if (normalizeConsortium(rowConsortium) !== consortiumId) fail(`Consortium must be ${consortiumId}.`);
        const email = lower(emailValue);
        if (!name || !acronym || !studyName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            fail('Name, a valid Email, Study Acronym, and Study Name are required.');
        }
        const studyKey = lower(acronym);
        if (studyNames.has(studyKey) && lower(studyNames.get(studyKey)) !== lower(studyName)) fail(`Conflicting names for study ${acronym}.`);
        studyNames.set(studyKey, studyName);
        const manager = managers.get(email) || { id: `${consortiumId}:${email}`, name, email, consortium: consortiumId, studies: [] };
        if (lower(manager.name) !== lower(name)) fail(`Conflicting names for ${email}.`);
        if (!manager.studies.some(study => lower(study.acronym) === studyKey)) manager.studies.push({ name: studyName, acronym, consortium: consortiumId });
        managers.set(email, manager);
    });
    return buildStudyRoster(Array.from(managers.values()));
};

const readWorkbook = async response => {
    if (typeof XLSX === 'undefined') throw new Error('XLSX library not loaded.');
    return XLSX.read(await response.arrayBuffer(), { type: 'array' });
};

const loadLegacyCnciRoster = async () => {
    const response = await fetch(LEGACY_CNCI_ROSTER);
    if (!response.ok) throw new Error(`Unable to load the existing C-NCI study roster (${response.status}).`);
    const workbook = await readWorkbook(response);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
    const managers = rows.map(row => {
        const get = name => clean(Object.entries(row).find(([key]) => lower(key).replace(/[^a-z0-9]/g, '') === lower(name).replace(/[^a-z0-9]/g, ''))?.[1]);
        const studies = [];
        for (let index = 1; index <= 3; index++) {
            const name = get(`Study_${index}`), acronym = get(`Study_${index} Acronym`);
            if (name || acronym) studies.push({ name, acronym, consortium: 'C-NCI' });
        }
        return { id: `C-NCI:${lower(get('Email'))}`, name: get('Name'), email: lower(get('Email')), consortium: 'C-NCI', studies };
    }).filter(manager => manager.email && manager.studies.length);
    return buildStudyRoster(managers);
};

const readBoxRoster = async (fileId, consortium, retry = true) => {
    const token = JSON.parse(localStorage.parms || '{}').access_token;
    const response = await fetch(`https://api.box.com/2.0/files/${fileId}/content`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 401 && retry && await refreshToken()) return readBoxRoster(fileId, consortium, false);
    if (!response.ok) throw new Error(`Unable to read the ${consortium} study roster from Box (${response.status}).`);
    const workbook = await readWorkbook(response);
    if (!workbook.Sheets.Roster) throw new Error(`${consortium} roster: the workbook must contain a Roster sheet.`);
    return parseStudyManagerRoster(XLSX.utils.sheet_to_json(workbook.Sheets.Roster, { header: 1, defval: '', blankrows: true }), consortium);
};

export const loadStudyRoster = async consortium => {
    const consortiumId = normalizeConsortium(consortium);
    if (consortiumId === 'TEST') return buildStudyRoster(studyManagersInfo.filter(manager => manager.consortium === 'TEST'));
    if (!Object.hasOwn(studyManagerRosterFiles, consortiumId)) throw new Error(`Unknown study roster consortium: ${consortiumId}.`);
    const fileId = studyManagerRosterFiles[consortiumId];
    if (fileId !== null && !/^\d+$/.test(String(fileId))) throw new Error(`${consortiumId} roster: configure a numeric Box file ID or null.`);
    const user = lower(JSON.parse(localStorage.parms || '{}').login);
    const key = `${user}|${consortiumId}|${fileId}`;
    const cached = rosterLoads.get(key);
    if (cached && cached.expires > Date.now()) return cached.promise;
    const promise = fileId ? readBoxRoster(fileId, consortiumId)
        : consortiumId === 'C-NCI' ? loadLegacyCnciRoster() : Promise.resolve(buildStudyRoster([]));
    rosterLoads.set(key, { promise, expires: Date.now() + CACHE_MS });
    try { return await promise; }
    catch (error) { rosterLoads.delete(key); throw error; }
};

export const loadStudyRosters = async (consortia = Object.keys(studyManagerRosterFiles)) => {
    const rosters = await Promise.all([...new Set(consortia.map(normalizeConsortium))].map(loadStudyRoster));
    return buildStudyRoster(rosters.flatMap(roster => roster.managers));
};
