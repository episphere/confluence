const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync('src/optInOutStore.js', 'utf8').replace(/^import\s*\{[\s\S]*?\}\s*from\s*"\.\/shared.js";/, '').replace(/export /g, '');
const progressSource = fs.readFileSync('src/components/optInOutProgress.js', 'utf8').replace(/^import .*$/gm, '').replace(/export /g, '');
const manager = { email: 'manager@example.org', name: 'Manager', consortium: 'C-NCI', collectionFolderId: 'collection' };
const args = () => ({ round: {id: 'r1', name: 'Round_1'}, concepts: [{fileId: 'c1', title: 'Test concept', fileName: 'Test_R1_1.docx'}],
    studies: [{acronym: 'STUDY', name: 'Test study', consortium: 'C-NCI'}], consortiumId: 'C-NCI',
    opensAt: '2026-10-01T12:00:00Z', closesAt: '2026-11-01T12:00:00Z', initiatedBy: 'spoof@example.org' });

function setup(login = manager.email) {
    const files = new Map();
    const folders = new Map([['root', [{id: 'central', name: '_config', type: 'folder'}, {id: 'study-root', name: 'C-NCI', type: 'folder'}]],
        ['0', [{id: 'study-root', name: 'C-NCI', type: 'folder'}]],
        ['collection', [{id: 'manager-config', name: '_config', type: 'folder'}]]]);
    const writes = [], reads = [];
    const context = vm.createContext({console, localStorage: {parms: JSON.stringify({login})}, Confluence_Opt_In_Out: 'root', dataManagersInfo: [manager], emailsAllowedToUpdateData: ['admin@example.org'],
        getFolderItems: async id => {
            reads.push(id);
            if (JSON.parse(context.localStorage.parms).login !== 'admin@example.org' && ['central', 'root'].includes(id)) throw new Error('Central access denied');
            return {entries: folders.get(id) || []};
        }, getFile: async id => files.get(id),
        createFolder: async (parent, name) => {
            const id = parent + '/' + name;
            const folder = {id, name, type: 'folder'};
            folders.set(parent, [...(folders.get(parent) || []), folder]);
            writes.push(id);
            return folder;
        },
        uploadFile: async (data, name, folder) => {
            const id = folder + '/' + name;
            files.set(id, data); writes.push(id);
            folders.set(folder, [...(folders.get(folder) || []), {id, name, type: 'file'}]);
            return {entries: [{id}]};
        }, uploadFileVersion: async (data, id) => { files.set(id, data); writes.push(id); return {entries: [{id}]}; }
    });
    vm.runInContext(source + '\nthis.api = {provisionOptInOutRound, loadStudyAccessAssignments, loadOptInOutProgressRows, publishRowsToDataManagerFiles, serializeTsv, parseTsv};', context);
    const {api} = context;
    function put(folder, name, rows) {
        const id = folder + '/' + name;
        files.set(id, api.serializeTsv([...new Set(rows.flatMap(row => Object.keys(row)))], rows));
        folders.set(folder, [...(folders.get(folder) || []), {id, name, type: 'file'}]);
    }
    const accepted = {schema_version: '1', round_id: 'r1', round_name: 'Round_1', consortium_id: 'C-NCI', concept_box_id: 'c1', concept_title: 'Test concept', workflow_stage: 'admin_accepted', study_id: 'STUDY', study_acronym: 'STUDY', updated_at_utc: '2026-01-01T00:00:00Z'};
    put('manager-config', 'C-NCI.tsv', [accepted]);
    put('manager-config', 'study_access_assignments.tsv', []);
    put('central', 'data_manager_requests.tsv', [accepted]);
    return {context, api, writes, reads, files, folders, put, accepted};
}

test('manager initiates their published accepted round without central access and admin sees it', async () => {
    const app = setup();
    const result = await app.api.provisionOptInOutRound(args());
    assert.equal(result.createdAssignments, 1);
    assert.equal(app.writes.some(id => id.startsWith('central/')), false);
    const schedules = app.api.parseTsv(app.files.get('manager-config/rounds.tsv'));
    assert.equal(schedules[0].initiated_by_email, manager.email);
    assert.equal(schedules[0].opens_at_utc, args().opensAt);
    const managerRows = await app.api.loadStudyAccessAssignments(true);
    assert.equal(managerRows.length, 1);
    assert.equal(managerRows[0].decision, 'pending');
    app.context.localStorage.parms = JSON.stringify({login: 'admin@example.org'});
    const adminRows = await app.api.loadStudyAccessAssignments();
    assert.equal(adminRows.length, 1);
    assert.equal(adminRows[0].selection_file_id, managerRows[0].selection_file_id);
    assert.equal(adminRows[0].closes_at_utc, args().closesAt);
    assert.equal(adminRows[0].initiated_by_email, manager.email);
    await app.api.provisionOptInOutRound(args());
    const [retriedByAdmin] = await app.api.loadStudyAccessAssignments();
    assert.equal(retriedByAdmin.initiated_by_email, manager.email);
    assert.equal(retriedByAdmin.initiated_at_utc, adminRows[0].initiated_at_utc);
});

test('authorization, accepted-concept validation and invalid periods fail before writes', async () => {
    const app = setup();
    await assert.rejects(app.api.provisionOptInOutRound({...args(), consortiumId: 'BCAC'}), /access/);
    await assert.rejects(app.api.provisionOptInOutRound({...args(), closesAt: args().opensAt}), /period/);
    await assert.rejects(app.api.provisionOptInOutRound({...args(), concepts: [{fileId: 'other'}]}), /accepted concepts/);
    app.context.localStorage.parms = JSON.stringify({login: 'ordinary@example.org'});
    await assert.rejects(app.api.provisionOptInOutRound(args()), /access/);
    assert.equal(app.writes.length, 0);
});

test('retry preserves submitted decisions, audit identity, selection links and manager initiation during publishing', async () => {
    const app = setup();
    await app.api.provisionOptInOutRound(args());
    const [before] = await app.api.loadStudyAccessAssignments(true);
    const saved = {...before, decision: 'opt_out', submitted: 'true', submitted_by_email: 'study@example.org'};
    app.files.set(before.selection_file_id, app.api.serializeTsv(Object.keys(saved), [saved]));
    await app.api.provisionOptInOutRound(args());
    await app.api.publishRowsToDataManagerFiles([app.accepted]);
    const [after] = await app.api.loadStudyAccessAssignments(true);
    assert.equal(after.selection_file_id, before.selection_file_id);
    assert.equal(after.decision, 'opt_out');
    assert.equal(after.initiated_at_utc, before.initiated_at_utc);
    const [request] = app.api.parseTsv(app.files.get('manager-config/C-NCI.tsv'));
    assert.equal(request.workflow_stage, 'opt_in_out');
    assert.equal(request.selection_file_id, before.selection_file_id);
});

test('admin retains fallback initiation, and published accepted concepts are visible before starting', async () => {
    const app = setup('admin@example.org');
    const rows = await app.api.loadOptInOutProgressRows();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].round_status, 'not_started');
    await app.api.provisionOptInOutRound(args());
    const [after] = await app.api.loadOptInOutProgressRows();
    assert.equal(after.initiated_by_email, 'admin@example.org');
    assert.equal(after.closes_at_utc, args().closesAt);
});

test('partial provisioning failures stay visible and can be retried', async () => {
    const app = setup();
    const upload = app.context.uploadFile;
    app.context.uploadFile = async (data, name, folder) => name === 'concept_c1.tsv' ? {status: 403} : upload(data, name, folder);
    const result = await app.api.provisionOptInOutRound(args());
    assert.equal(result.failures.length, 1);
    assert.equal(result.createdAssignments, 0);
    const [failed] = await app.api.loadStudyAccessAssignments(true);
    assert.equal(failed.decision, 'unavailable');
    app.context.uploadFile = upload;
    await app.api.provisionOptInOutRound(args());
    const [recovered] = await app.api.loadStudyAccessAssignments(true);
    assert.equal(recovered.decision, 'pending');
    assert.equal(recovered.provision_status, 'ready');
});

const progressContext = vm.createContext({dataManagersInfo: [manager], emailsAllowedToUpdateData: ['admin@example.org']});
vm.runInContext(progressSource + '\nthis.api = {summarizeOptInOutRounds, buildOptInOutEmailDraft};', progressContext);
const {summarizeOptInOutRounds: summarize, buildOptInOutEmailDraft: draft} = progressContext.api;
const progressRow = (overrides = {}) => ({round_id: 'r1', round_name: 'Round_1', consortium_id: 'C-NCI', concept_box_id: 'c1', study_id: 'S1', selection_file_id: 's1', workflow_stage: 'opt_in_out', round_status: 'open', opens_at_utc: args().opensAt, closes_at_utc: args().closesAt, decision: 'pending', submitted: 'false', ...overrides});

test('progress separates not-started, scheduled, in-progress, ended and completed periods', () => {
    const now = Date.parse('2026-10-20T12:00:00Z');
    assert.equal(summarize([progressRow({round_status: 'not_started', selection_file_id: ''})], now)[0].status, 'Not started');
    assert.equal(summarize([progressRow({opens_at_utc: '2026-10-25T12:00:00Z'})], now)[0].status, 'Scheduled');
    assert.equal(summarize([progressRow()], now)[0].status, 'In progress');
    assert.equal(summarize([progressRow({closes_at_utc: '2026-10-19T12:00:00Z'})], now)[0].status, 'Ended with pending decisions');
    assert.equal(summarize([progressRow({decision: 'opt_in', submitted: 'true'})], now)[0].status, 'Completed');
    assert.equal(summarize([progressRow({decision: 'unavailable'})], now)[0].status, 'Needs attention');
    assert.equal(summarize([progressRow({opens_at_utc: '', closes_at_utc: ''})], now)[0].period, 'Dates unavailable');
});

test('response statistics distinguish pending, unavailable and submitted study/concept decisions', () => {
    const [summary] = summarize([progressRow({decision: 'opt_in', submitted: 'true'}),
        progressRow({study_id: 'S2', selection_file_id: 's2', decision: 'opt_out', submitted: 'true'}),
        progressRow({study_id: 'S3', selection_file_id: 's3', decision: 'opt_in'}),
        progressRow({study_id: 'S4', selection_file_id: 's4', decision: 'unavailable'}),
        progressRow({decision: 'opt_in', submitted: 'true'})], Date.parse('2026-12-01T00:00:00Z'));
    assert.equal(summary.total, 4);
    assert.equal(summary.optedIn, 1);
    assert.equal(summary.optedOut, 1);
    assert.equal(summary.pending, 1);
    assert.equal(summary.unavailable, 1);
    assert.equal(summary.overdue, 1);
    assert.equal(summary.responseRate, 50);
    assert.equal(summary.studies, 4);
});

test('email drafts include round counts and use a mailto link without sending', () => {
    const summaries = summarize([progressRow({decision: 'opt_out', submitted: 'true'})]);
    const url = draft(summaries[0], summaries);
    assert.ok(url.startsWith('mailto:'));
    const decoded = decodeURIComponent(url);
    assert.match(decoded, /manager@example.org/);
    assert.match(decoded, /admin@example.org/);
    assert.match(decoded, /1 opted out/);
    assert.match(decoded, /Round_1/);
});
