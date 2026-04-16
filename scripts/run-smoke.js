#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const result = spawnSync(
  process.execPath,
  [path.join(__dirname, 'run-test-suite.js'), 'smoke', ...process.argv.slice(2)],
  {
    env: process.env,
    stdio: 'inherit',
  },
);

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(result.error ? 1 : 0);
