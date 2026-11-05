const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const childProcess = require('node:child_process');
const {
  runOpalSuite,
} = require('../node_modules/@hmcts/opal-frontend-common-cypress/dist/runner/opal-suite-runner.js');

for (const [testCode, reportCode, noReports, expectedCode, expectedBuilds] of [
  [0, 0, false, 0, 1],
  [1, 0, false, 1, 1],
  [2, 0, false, 2, 1],
  [0, 7, false, 7, 1],
  [2, 7, false, 2, 1],
  [1, 0, true, 1, 0],
]) {
  test(`component: test=${testCode}, report=${reportCode}, noReports=${noReports}`, () => {
    const originalSpawn = childProcess.spawnSync;
    const calls = [];
    childProcess.spawnSync = (command, args) => {
      calls.push([command, args]);
      if (path.basename(command) === 'cypress') return { status: testCode };
      if (args.some((arg) => String(arg).endsWith('build-component-report.js'))) {
        return { status: reportCode };
      }
      return { status: 0 };
    };
    try {
      const args = ['component', '--serial', '--no-reset', '--browser=edge'];
      if (noReports) args.push('--no-reports');
      assert.equal(runOpalSuite(args, process.cwd(), {}), expectedCode);
      assert.equal(
        calls.filter(([, values]) => values.some((value) => String(value).endsWith('build-component-report.js')))
          .length,
        expectedBuilds,
      );
    } finally {
      childProcess.spawnSync = originalSpawn;
    }
  });
}
