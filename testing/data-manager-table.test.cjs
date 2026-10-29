const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {test} = require('node:test');
const c = vm.createContext({});
vm.runInContext(fs.readFileSync('src/components/dataManagerTable.js', 'utf8').replace(/export /g, '') + '\nthis.api = {getDataManagerRoundLabel, compareDataManagerValues, setupDataManagerTable};', c);
const {getDataManagerRoundLabel: label, compareDataManagerValues: compare, setupDataManagerTable: setup} = c.api;

test('round display removes TEST and date suffixes, with a concept filename fallback', () => {
    assert.equal(label({round_name:'TEST_Round_1_Oct_31_2025'}), 'Round 1');
    assert.equal(label({round_name:'Round_12_Jan_01_2026'}), 'Round 12');
    assert.equal(label({round_name:'Round 2'}), 'Round 2');
    assert.equal(label({concept_file_name:'Concept_R3_14.docx'}), 'Round 3');
    assert.equal(label({round_name:'Unknown'}), 'Round unknown');
});

test('column comparisons use numeric rounds and scores and leave missing scores last', () => {
    assert.ok(compare('2', '10', 'round', true) < 0);
    assert.ok(compare('2', '10', 'round', false) > 0);
    assert.ok(compare('5', '777', 'score', true) < 0);
    assert.ok(compare('--', '5', 'score', false) > 0);
    assert.ok(compare('NA', '5', 'score', false) > 0);
    assert.ok(compare('100', '200', 'availability', true) < 0);
    assert.ok(compare('Alpha', 'Beta', 'concept', true) < 0);
});

function fixture() {
    const control = (value = '') => ({value, handlers:{}, addEventListener(event, handler) {this.handlers[event] = handler;}});
    const search = control(), round = control(), clear = control();
    const checkboxes = ['1', '2', '--'].map(value => ({value, checked:false}));
    const summary = {}, count = {};
    const scores = {...control(), querySelectorAll: selector => selector === 'input:checked' ? checkboxes.filter(item => item.checked) : checkboxes,
        querySelector: selector => selector === '[data-clear-scores]' ? clear : summary};
    const makeRow = (id, score, roundNumber, concept) => ({id, dataset:{score,round:`Round ${roundNumber}`,detailRow:`${id}Details`,sortScore:score,sortRound:String(roundNumber),sortConcept:concept,search:concept.toLowerCase()},hidden:false,
        classList:{toggle(name,value){this.owner.hidden = value;}}});
    const rows = [makeRow('a','2',10,'Beta'),makeRow('b','1',2,'Alpha'),makeRow('c','--',2,'Gamma')];
    const details = rows.map(row => ({id:row.dataset.detailRow,hidden:false,classList:{toggle(name,value){this.owner.hidden=value;}}}));
    [...rows,...details].forEach(row => {row.classList.owner=row;});
    const children = rows.flatMap((row,index)=>[row,details[index]]);
    const body = {appendChild(row){children.splice(children.indexOf(row),1);children.push(row);}};
    const buttons = ['Concept','Round','Score'].map(column => {
        const header = {setAttribute(name,value){this[name]=value;}};
        const icon = {};
        return {...control(),dataset:{managerSort:column},closest:()=>header,querySelector:()=>icon,header};
    });
    const bySelector = {'#dataManagerRequestSearch':search,'#dataManagerRoundFilter':round,'#dataManagerScoreFilter':scores,'#dataManagerRequestCount':count,'.data-manager-accordion-table tbody':body};
    [...rows,...details].forEach(row=>{bySelector['#'+row.id]=row;});
    const container = {querySelector:selector=>bySelector[selector],querySelectorAll:selector=>selector==='[data-manager-sort]'?buttons:rows};
    setup(container);
    return {search,round,scores,clear,checkboxes,rows,details,children,buttons,count};
}

test('score multiselect matches any selected score and combines with round and text search', () => {
    const app = fixture();
    app.checkboxes[0].checked = true;
    app.checkboxes[1].checked = true;
    app.scores.handlers.change();
    assert.deepEqual(app.rows.map(row=>row.hidden),[false,false,true]);
    app.round.value = 'Round 2';
    app.round.handlers.change();
    assert.deepEqual(app.rows.map(row=>row.hidden),[true,false,true]);
    assert.deepEqual(app.details.map(row=>row.hidden),[true,false,true]);
    app.search.value = 'missing';
    app.search.handlers.input();
    assert.equal(app.count.textContent,'0 requests');
    app.search.value = '';
    app.clear.handlers.click();
    assert.deepEqual(app.rows.map(row=>row.hidden),[true,false,false]);
});

test('header sorting toggles direction and keeps each expanded detail row with its request', () => {
    const app = fixture();
    const button = app.buttons[1];
    button.handlers.click();
    assert.deepEqual(app.children.map(row=>row.id),['b','bDetails','c','cDetails','a','aDetails']);
    assert.equal(button.header['aria-sort'],'ascending');
    button.handlers.click();
    assert.deepEqual(app.children.map(row=>row.id),['a','aDetails','b','bDetails','c','cDetails']);
    assert.equal(button.header['aria-sort'],'descending');
    app.buttons[2].handlers.click();
    assert.equal(button.header['aria-sort'],'none');
    assert.deepEqual(app.children.map(row=>row.id),['b','bDetails','a','aDetails','c','cDetails']);
});
