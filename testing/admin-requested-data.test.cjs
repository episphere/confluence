const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync('src/pages/adminRequestedData.js', 'utf8').replace(/export /g, '');
const context = vm.createContext({});
vm.runInContext(source + '\nthis.api = { extractAdminRequestedData, matchesAdminRequestedData };', context);
const { extractAdminRequestedData: parse, matchesAdminRequestedData: matches } = context.api;
const form = `Description of Analysis Plan: BRCA2 in males, pathology and risk factors
Genotyping: Individual-level genotyped data, Individual-level imputed data
Data Requested From: females
Carrier Status requested: BRCA1
CIMBA methodological note reviewed: Yes
Risk Factor Variables: Yes
Pathology Variables: No
Survival and Treatment Variables: Yes
Mammographic Density Variable: No
Time Plan: Yes, include pathology`;

test('reads only form selections, with exact sex matching and phenotype Yes/No', () => {
    assert.deepEqual(JSON.parse(JSON.stringify(parse(form))), {
        genotyping: ['Individual-level genotyped data', 'Individual-level imputed data'],
        sex: ['Females'], carrier: ['BRCA1'], phenotype: ['Risk Factor', 'Survival and Treatment']
    });
});

test('supports older forms without the CIMBA confirmation heading', () => {
    const data = parse(form.replace('CIMBA methodological note reviewed: Yes', '').replace('BRCA1\n', 'BRCA1, BRCA2\n'));
    assert.equal(data.carrier.join(', '), 'BRCA1, BRCA2');
    assert.equal(data.phenotype.join(', '), 'Risk Factor, Survival and Treatment');
});

test('handles whitespace, case, summary results and both sexes', () => {
    const data = parse(form.replace('Individual-level genotyped data, Individual-level imputed data', 'Concept 1 GWAS Summary Results').replace('females', 'FEMALES,\n males'));
    assert.equal(data.genotyping[0], 'Concept 1 GWAS summary results');
    assert.equal(data.sex.join(', '), 'Females, Males');
});

test('missing or incomplete sections do not borrow choices from unrelated text', () => {
    assert.equal(Object.values(parse('')).flat().length, 0);
    assert.equal(Object.values(parse('Concept Background: BRCA1 males Genotyping: BRCA1 males')).flat().length, 0);
    assert.equal(parse(form.replace('Pathology Variables: No', 'Pathology Variables:')).phenotype.includes('Pathology'), false);
});

test('AND and OR combine choices within and across groups; no selections includes unloaded forms', () => {
    const data = parse(form);
    const selection = [['genotyping', 'Individual-level genotyped data'], ['genotyping', 'Individual-level imputed data'], ['phenotype', 'Pathology']];
    assert.equal(matches(data, selection, 'or'), true);
    assert.equal(matches(data, selection, 'and'), false);
    assert.equal(matches(data, selection.slice(0, 2), 'and'), true);
    assert.equal(matches(undefined, selection, 'or'), false);
    assert.equal(matches(undefined, [], 'and'), true);
});

test('data filters compose with search and round selection, including hydration refresh', () => {
    const rows = ['r1', 'r2'].map(roundId => ({
        dataset: { roundId, searchText: 'Breast cancer request' },
        requestedData: parse(form), hidden: false,
        querySelector: () => null,
        classList: { toggle(name, value) { rows.find(row => row.classList === this).hidden = value; } }
    }));
    let choices = [{dataset: {group: 'carrier'}, value: 'BRCA1'}];
    const input = {value: '', addEventListener() {}};
    const status = {};
    const round = {value: 'r1'};
    const mode = {value: 'or'};
    const panel = {querySelectorAll: () => choices, querySelector: () => mode};
    const document = {getElementById: id => ({adminConceptSearch: input, status, roundSelect: round, adminRequestedDataFilters: panel})[id], querySelectorAll: () => rows};
    const ui = fs.readFileSync('src/pages/chairmenu.js', 'utf8');
    const searchSource = ui.slice(ui.indexOf('const setupConceptSearch ='), ui.indexOf('const renderAdminRequestedDataFilters ='));
    const uiContext = vm.createContext({document, matchesAdminRequestedData: matches});
    vm.runInContext(searchSource + '\nsetupConceptSearch("adminConceptSearch", "status", "rows"); this.refresh = refreshConceptSearch;', uiContext);
    input.applyConceptSearch();
    assert.deepEqual(rows.map(row => row.hidden), [false, true]);
    input.value = 'unrelated';
    input.applyConceptSearch();
    assert.deepEqual(rows.map(row => row.hidden), [true, true]);
    input.value = '';
    round.value = 'all';
    rows[1].requestedData = undefined;
    uiContext.refresh('adminConceptSearch');
    assert.deepEqual(rows.map(row => row.hidden), [false, true]);
    rows[1].requestedData = parse(form);
    uiContext.refresh('adminConceptSearch');
    assert.deepEqual(rows.map(row => row.hidden), [false, false]);
    assert.equal(status.textContent, '2 matching concepts');
    choices = [];
    uiContext.refresh('adminConceptSearch');
    assert.deepEqual(rows.map(row => row.hidden), [false, false]);
});
