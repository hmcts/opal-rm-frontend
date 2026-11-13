const fs = require('node:fs');
const path = require('node:path');
const { parseStringPromise } = require('xml2js');

function escape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function redact(value) {
  return String(value ?? '')
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email redacted]')
    .replace(/Bearer\s+[^\s"<>]+/gi, 'Bearer [redacted]')
    .replace(/((?:password|authorization|cookie|token)\s*[:=]\s*)[^\r\n]+/gi, '$1[redacted]');
}

function resetExecutionResults(messagesOutput) {
  if (!messagesOutput) return;
  const target = `${messagesOutput}.results.json`;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, '[]');
}

function recordExecutionResults(messagesOutput, spec, results) {
  if (!messagesOutput || !results) return;
  const target = `${messagesOutput}.results.json`;
  const previous = JSON.parse(fs.readFileSync(target, 'utf8'));
  const tests = (results.tests ?? []).map((test) => ({
    title: redact(test.title.join(' / ')),
    state: test.state,
    // Only final-attempt errors count as failures; retries remain represented in the attempt count.
    attempts: test.attempts.length,
    error: redact(test.attempts.at(-1)?.error?.message),
  }));
  const stats = Object.fromEntries(
    ['tests', 'passes', 'failures', 'pending', 'skipped'].map((key) => [key, results.stats[key] ?? 0]),
  );
  const entry = { spec: spec.relative, stats, tests, error: redact(results.error) };
  fs.writeFileSync(target, JSON.stringify([...previous.filter((item) => item.spec !== spec.relative), entry]));
}

async function readJUnit(directory) {
  const names = fs.readdirSync(directory).filter((name) => /(?:-test-result|-mode-test-output-[^/]+)\.xml$/.test(name));
  // Prefer the merged file to avoid counting the raw shards twice.
  const merged = names.filter((name) => name.endsWith('-test-result.xml'));
  const files = merged.length ? merged : names;
  const cases = [];
  let declared = 0;
  function visit(node) {
    for (const suite of node.testsuite ?? []) {
      if (!suite.testsuite?.length) declared += Number(suite.$?.tests ?? 0);
      cases.push(...(suite.testcase ?? []));
      visit(suite);
    }
  }
  for (const name of files) {
    const parsed = await parseStringPromise(fs.readFileSync(path.join(directory, name), 'utf8'));
    visit(parsed.testsuites ?? { testsuite: [parsed.testsuite] });
  }
  return { files, cases, declared };
}

function failureMarkup(cases) {
  return cases
    .flatMap((test) =>
      [...(test.failure ?? []), ...(test.error ?? [])].map(
        (failure) =>
          `<li><h3>${escape(redact(test.$?.name))}</h3><pre>${escape(redact(failure.$?.message ?? failure._ ?? failure))}</pre></li>`,
      ),
    )
    .join('');
}

async function publishExecutionSummary(reportDir, reportFile, title) {
  if (path.basename(reportFile) !== reportFile) throw new Error('Expected one report filename');
  if (path.basename(reportDir.replace(/\/$/, '')) !== 'cucumber' || !fs.existsSync(reportDir)) return false;
  const nativeFiles = fs.readdirSync(reportDir).filter((name) => name.endsWith('.ndjson.results.json'));
  const specs = nativeFiles.flatMap((name) => JSON.parse(fs.readFileSync(path.join(reportDir, name), 'utf8')));
  const junit = await readJUnit(path.dirname(reportDir.replace(/\/$/, '')));
  if (!specs.length && !junit.files.length) return false;
  const failures = failureMarkup(junit.cases);
  let counts;
  let nativeFailures = '';
  if (specs.length) {
    const totals = specs.reduce(
      (sum, spec) => {
        for (const key of ['tests', 'passes', 'failures', 'pending', 'skipped']) sum[key] += spec.stats[key] ?? 0;
        return sum;
      },
      { tests: 0, passes: 0, failures: 0, pending: 0, skipped: 0 },
    );
    counts = `${totals.tests} tests: ${totals.passes} passed, ${totals.failures} failed, ${totals.pending} pending, ${totals.skipped} skipped.`;
    nativeFailures = specs
      .map((spec) => {
        const errors = spec.tests
          .filter((test) => test.state === 'failed')
          .map(
            (test) =>
              `<li><h3>${escape(test.title)}</h3><p>${test.attempts} attempt(s)</p><pre>${escape(test.error)}</pre></li>`,
          )
          .join('');
        return `<section><h2>${escape(spec.spec)}</h2>${spec.error ? `<pre>${escape(spec.error)}</pre>` : ''}<ul>${errors}</ul></section>`;
      })
      .join('');
  } else {
    counts = `JUnit declares ${junit.declared} tests and contains ${junit.cases.length} testcase results. Skipped scenarios may be absent from JUnit; these totals must not be interpreted as passes.`;
  }
  const summaryFile = 'execution-summary.html';
  const notice =
    'Cucumber details can omit entire features when Cypress hooks fail. Use the execution summary for failures and skipped tests.';
  fs.writeFileSync(
    path.join(reportDir, summaryFile),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escape(title)} — execution summary</title><style>pre{white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body><main><h1>${escape(title)} — execution summary</h1><p>${escape(counts)}</p><p>Counts cover reported specs; interrupted or missing workers may be absent.</p><p>${notice}</p>${nativeFailures}<h2>JUnit failures</h2><ul>${failures}</ul><h2>Raw JUnit evidence</h2><ul>${junit.files.map((name) => `<li>${escape(name)} (in archived parent directory)</li>`).join('')}</ul></main></body></html>\n`,
  );
  const output = path.join(reportDir, reportFile);
  const banner = `<section aria-label="Cypress execution results"><h2>Test execution summary</h2><p>${escape(counts)}</p><p>${notice} <a href="${summaryFile}">View execution summary and failures</a>.</p></section>`;
  const marked = `<!-- rm-execution-summary:start -->${banner}<!-- rm-execution-summary:end -->`;
  if (fs.existsSync(output)) {
    const html = fs.readFileSync(output, 'utf8');
    const clean = html.replace(/<!-- rm-execution-summary:start -->[\s\S]*?<!-- rm-execution-summary:end -->/g, '');
    fs.writeFileSync(
      output,
      clean.replace(/<body\b[^>]*>/i, (body) => body + marked),
    );
  } else {
    fs.writeFileSync(
      output,
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escape(title)}</title></head><body><main><h1>${escape(title)}</h1><p>Results are incomplete: the Cucumber HTML report was not generated.</p>${marked}</main></body></html>\n`,
    );
  }
  return true;
}

module.exports = { resetExecutionResults, recordExecutionResults, publishExecutionSummary };
