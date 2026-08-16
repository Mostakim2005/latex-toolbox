import fs from 'node:fs';
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const dist = new URL('./.dist/', import.meta.url);
await fs.promises.writeFile(new URL('./package.json', dist), '{"type":"commonjs"}\n');

const natural = require(fileURLToPath(new URL('./core/natural-language.js', dist)));
const semantic = require(fileURLToPath(new URL('./core/semantic.js', dist)));
const validation = require(fileURLToPath(new URL('./core/scientific-validation.js', dist)));
const authoring = require(fileURLToPath(new URL('./core/authoring.js', dist)));
const settings = require(fileURLToPath(new URL('./settings/normalize.js', dist)));

const readJson = async (name) => JSON.parse(await fs.promises.readFile(new URL(`./${name}`, import.meta.url), 'utf8'));
const failures = [];
let total = 0;
let passed = 0;

const check = (name, got, expected) => {
  total += 1;
  if (got === expected) passed += 1;
  else failures.push(`${name}: got ${JSON.stringify(got)} expected ${JSON.stringify(expected)}`);
};

for (const file of ['phase2-cases.json', 'phase3-cases.json', 'phase4-cases.json']) {
  for (const test of await readJson(file)) check(`${file}:${test.input}`, natural.naturalLanguageToLatex(test.input, test.domain, []).latex, test.expected);
}
for (const [input, expected] of await readJson('phase5-cases.json')) check(`phase5:${input}`, natural.naturalLanguageToLatex(input, 'electronics', []).latex, expected);

const shortcuts = [
  { id: 'alpha', trigger: 'alpha', latex: '\\alpha', domain: 'all' },
  { id: 'ohm', trigger: 'ohm', latex: 'V = I\\,R', domain: 'electronics' },
];
const snippets = [{ id: 'frac', name: 'Fraction', trigger: 'frac', latex: '\\frac{${1:a}}{${2:b}}', domain: 'math' }];
const templates = [{ id: 'max', name: 'Maxwell equations', trigger: 'maxwell', description: 'Maxwell', latex: '\\begin{aligned}...\\end{aligned}', domain: 'physics' }];
const recent = [{ id: 'r1', input: 'force equals mass times acceleration', latex: 'F=ma', domain: 'physics', createdAt: 1, favorite: false }];
const favorites = [{ id: 'f1', input: 'Ohm law', latex: 'V=IR', domain: 'electronics', createdAt: 2, favorite: true }];
check('phase6:shortcut-prefix', authoring.filterAuthoringItems('alp','math',shortcuts,snippets,templates,[],[],10)[0]?.kind, 'shortcut');
check('phase6:snippet-prefix', authoring.filterAuthoringItems('fra','math',shortcuts,snippets,templates,[],[],10)[0]?.kind, 'snippet');
check('phase6:template-domain', authoring.filterAuthoringItems('maxwell','physics',shortcuts,snippets,templates,[],[],10)[0]?.kind, 'template');
check('phase6:domain-filter', authoring.filterAuthoringItems('ohm','math',shortcuts,snippets,templates,[],[],10).length, 0);
check('phase6:favorite-first', authoring.filterAuthoringItems('','electronics',shortcuts,snippets,templates,recent,favorites,10)[0]?.kind, 'favorite');
const expanded = authoring.expandSnippetWithSelection('\\frac{${1:numerator}}{${2:denominator}}');
check('phase6:placeholder-text', expanded.text, '\\frac{numerator}{denominator}');
check('phase6:placeholder-selection', `${expanded.selectionStart}:${expanded.selectionEnd}`, '6:15');
const history = authoring.createHistoryItem('x', 'x^2', 'math');
check('phase6:history-add', authoring.updateHistory([], [], history).recent.length, 1);
check('phase6:favorite-add', authoring.toggleFavorite([], history).length, 1);

for (const test of await readJson('phase7-cases.json')) {
  if (test.latex) {
    const top = semantic.analyzeSemanticInput(test.input, test.domain, shortcuts, { maxCandidates: 6 })[0];
    check(`phase7:${test.name}:latex`, top?.latex, test.latex);
    check(`phase7:${test.name}:confidence`, top?.confidence, test.confidence);
  } else if (test.inferredDomain) check(`phase7:${test.name}:domain`, semantic.inferDomainFromText(test.input, test.domain), test.inferredDomain);
  else if ('semantic' in test) check(`phase7:${test.name}:semantic`, semantic.looksLikeSemanticInput(test.input), test.semantic);
}
const ambiguous = semantic.analyzeSemanticInput('electric field', 'physics', shortcuts, { maxCandidates: 6 });
check('phase7:reviewable-candidates', ambiguous.length >= 2, true);
const converted = natural.naturalLanguageToLatex('electric field', 'physics', shortcuts);
check('phase7:conversion-candidates', (converted.candidates?.length ?? 0) >= 2, true);

for (const test of await readJson('phase8-9-cases.json')) check(`phase8-9:${test.name}`, natural.naturalLanguageToLatex(test.input, test.domain, []).latex, test.latex);
const mismatch = validation.validateScientificConversion({ latex: 'F=ma', confidence: 'high', explanation: 'ok', issues: [] }, 'physics', 'force equals velocity');
check('phase8-9:dimension-review', mismatch.confidence, 'medium');
check('phase8-9:dimension-issue', mismatch.issues.length > 0, true);
const limit = validation.sanitizeScientificInput('x'.repeat(2000));
check('phase8-9:input-bound', limit.value.length, validation.MAX_SCIENTIFIC_INPUT_LENGTH);
check('phase8-9:input-bound-issue', limit.issues.length > 0, true);
const controls = validation.sanitizeScientificInput('SO₄²⁻\u0001');
check('phase8-9:unicode-safety', controls.value, 'SO₄²⁻');

const start = performance.now();
for (let i = 0; i < 500; i += 1) natural.naturalLanguageToLatex('force equals mass times acceleration', 'physics', []);
const elapsed = performance.now() - start;
check('phase8-9:cache-performance', elapsed < 1200, true);

const css = await fs.promises.readFile(new URL('../styles.css', import.meta.url), 'utf8');
const modal = await fs.promises.readFile(new URL('../src/ui/equation-modal.ts', import.meta.url), 'utf8');
check('phase8-9:focus-visible', css.includes(':focus-visible'), true);
check('phase8-9:reduced-motion', css.includes('prefers-reduced-motion'), true);
check('phase8-9:live-status', modal.includes("aria-live"), true);
check('phase8-9:debounced-preview', modal.includes('scheduleConversion'), true);
const normalized = settings.normalizeSettings({ customShortcuts: [{ id: 'ok', trigger: 'x', latex: 'x', domain: 'math' }, { id: 4, trigger: '', latex: '', domain: 'bad' }], maxInputLength: 999999, autocompleteMaxResults: 1, recentEquations: [{ id: 'h', input: 'x', latex: 'x', domain: 'math', createdAt: 'bad', favorite: 'yes' }] });
check('phase8-9:settings-validation', normalized.customShortcuts.length, 1);
check('phase8-9:settings-clamp-input', normalized.maxInputLength, 5000);
check('phase8-9:settings-clamp-results', normalized.autocompleteMaxResults, 5);
check('phase8-9:settings-history-validation', normalized.recentEquations[0]?.createdAt, 0);

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`Regression suite: ${passed}/${total} passed`);
  process.exit(1);
}
console.log(`Regression suite: ${passed}/${total} passed`);
console.log(`Performance: 500 repeated cached conversions in ${elapsed.toFixed(1)}ms`);
