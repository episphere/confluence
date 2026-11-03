const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {test} = require('node:test');
const source = fs.readFileSync('src/components/dataManagerDiscussion.js', 'utf8').replace(/^import .*$/gm, '').replace(/export /g, '');
const comment = (id, message, name = 'Chair') => ({id, message, created_at:'2026-11-01T12:00:00Z',created_by:{name}});
function setup(listComments) {
    const c = vm.createContext({listComments});
    vm.runInContext(source + '\nthis.api = {loadDataManagerDiscussion, renderDataManagerDiscussion};', c);
    return c.api;
}

test('shows multiple submitter replies beneath their chair comment, including copied Box comment IDs', async () => {
    const api = setup(async id => JSON.stringify({entries: id === 'master' ? [comment('12','Please clarify age range')] : id === 'chair' ? [comment('copy','Box Comment ID: 12, Please clarify age range')] : [comment('r1','Response ID: 12, Ages 30–60','Submitter'),comment('r2','Response ID: 12, Additional explanation','Submitter'),comment('r3','Response ID: 123, Separate reply','Submitter')]}));
    const discussion = await api.loadDataManagerDiscussion({concept_box_id:'master',chair_file_id:'chair',response_file_id:'returned'});
    const html = api.renderDataManagerDiscussion(discussion);
    assert.match(html,/Ages 30–60/);
    assert.match(html,/Additional explanation/);
    assert.match(html,/3 submitter replies available/);
    assert.match(html,/Comment and reply sources checked/);
    assert.match(html,/Additional submitter replies/);
    assert.equal((html.match(/Please clarify age range/g)||[]).length,1);
    assert.ok(html.indexOf('Ages 30–60') < html.indexOf('Additional submitter replies'));
    assert.ok(html.indexOf('Separate reply') > html.indexOf('Additional submitter replies'));
});

test('reads later comment pages and avoids duplicate requests for identical source IDs', async () => {
    const calls = [];
    const api = setup(async (id,offset) => {
        calls.push([id,offset]);
        return {entries:offset ? [comment('r','Response ID: 1, Reply on next page','Submitter')] : [comment('1','Question')], total_count:2};
    });
    const discussion = await api.loadDataManagerDiscussion({concept_box_id:'same',chair_file_id:'same',response_file_id:'same'});
    assert.deepEqual(calls,[['same',0],['same',1]]);
    assert.match(api.renderDataManagerDiscussion(discussion),/Reply on next page/);
});

test('manager can see the published reply when Box denies direct access to returned-file comments', async () => {
    const api = setup(async id => {
        if (id === 'returned') return JSON.stringify({type:'error',status:403});
        return {entries:[comment('q','Chair question')]};
    });
    const discussion = await api.loadDataManagerDiscussion({concept_box_id:'master',response_file_id:'returned',discussion_snapshot:JSON.stringify({
        checked_at_utc:'2026-11-01T12:00:00Z',response_lookup_complete:true,source_file_ids:['master','returned'],
        comments:[comment('q','Chair question'),comment('r','Response ID: q, Published submitter answer','Submitter')]
    })});
    const html = api.renderDataManagerDiscussion(discussion);
    assert.match(html,/Published submitter answer/);
    assert.match(html,/Showing published discussion/);
    assert.match(html,/Latest comments could not be verified/);
    assert.match(html,/Visibility check incomplete/);
    assert.equal(discussion.errors.length,1);
});

test('unreadable sources and unknown legacy reply locations are never reported as verified', async () => {
    const api = setup(async id => id === 'master' ? {entries:[]} : Promise.reject(new Error('Forbidden')));
    const partial = await api.loadDataManagerDiscussion({concept_box_id:'master',response_file_id:'returned'});
    assert.match(api.renderDataManagerDiscussion(partial),/Submitter replies may be missing/);
    const legacy = await api.loadDataManagerDiscussion({concept_box_id:'master'});
    assert.match(api.renderDataManagerDiscussion(legacy),/submitter reply source has not been verified/);
});

test('live reads replace stale published comments and safely escape reply content', async () => {
    const api = setup(async()=>({entries:[comment('q','Question'),comment('r','Response ID: q, <script>alert(1)</script>','<b>Submitter</b>')]}));
    const discussion = await api.loadDataManagerDiscussion({concept_box_id:'master',response_file_id:'master',discussion_snapshot:JSON.stringify({comments:[comment('old','Deleted comment')]})});
    const html = api.renderDataManagerDiscussion(discussion);
    assert.equal(html.includes('Deleted comment'),false);
    assert.match(html,/&lt;script&gt;/);
    assert.match(html,/&lt;b&gt;Submitter&lt;\/b&gt;/);
    assert.equal(html.includes('<script>'),false);
});

test('the page refresh control rechecks replies even after a successful initial load', async () => {
    const page = fs.readFileSync('src/pages/dataManagers.js','utf8');
    const loader = page.slice(page.indexOf('const loadReviewerComments ='),page.indexOf('const parseDtaFiles ='));
    const section = {dataset:{}};
    const body = {dataset:{conceptBoxId:'master'},discussionRequest:{concept_box_id:'master',response_file_id:'returned'},querySelector:()=>section};
    let calls = 0;
    const c = vm.createContext({console,loadDataManagerDiscussion:async()=>{calls++;return {comments:[],errors:[],response_lookup_complete:true};},renderDataManagerDiscussion:()=>'<p>Checked</p>'});
    vm.runInContext(loader+'\nthis.load = loadReviewerComments;',c);
    await c.load(body);
    await c.load(body);
    assert.equal(calls,1);
    await c.load(body,true);
    assert.equal(calls,2);
    assert.equal(section.dataset.loaded,'true');
});
