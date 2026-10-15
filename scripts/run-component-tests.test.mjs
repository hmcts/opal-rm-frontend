import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';
import { execute, exitCodeFor, runComponentSuite } from './run-component-tests.mjs';

function temporary(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'opal-component-runner-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

const success = async () => ({ exitCode: 0, state: 'complete', diagnostics: [] });

test('report generation never hides a test failure', () => {
  assert.equal(exitCodeFor(3, 0, null), 3);
  assert.equal(exitCodeFor(3, 1, null), 3);
  assert.equal(exitCodeFor(0, 1, null), 1);
  assert.equal(exitCodeFor(0, 0, null), 0);
  assert.equal(exitCodeFor(0, 0, 'SIGTERM'), 143);
  assert.equal(exitCodeFor(0, 0, 'SIGINT'), 130);
  assert.equal(exitCodeFor(0, 0, 'SIGABRT'), 1);
  assert.equal(exitCodeFor(null, 0, null), 1);
});

test('execution preserves exit codes, spawn errors, and unsignalled null status cannot pass', async (t) => {
  const cwd = temporary(t);
  for (const code of [0, 3]) {
    assert.deepEqual(await execute(process.execPath, ['-e', `process.exit(${code})`], { cwd, env: process.env }), {
      code,
      signal: null,
    });
  }
  assert.equal((await execute(path.join(cwd, 'missing'), [], { cwd, env: process.env })).code, 1);
  assert.equal(
    (await execute(process.execPath, ['-e', 'throw new Error("fixture error")'], { cwd, env: process.env })).code,
    1,
  );
  const killed = await execute(process.execPath, ['-e', 'process.kill(process.pid, "SIGTERM")'], {
    cwd,
    env: process.env,
  });
  assert.equal(killed.signal, 'SIGTERM');
  assert.notEqual(killed.code, 0);
});

test('delegation keeps argument boundaries and finalises after execution, preserving failures', async (t) => {
  const cwd = temporary(t);
  const calls = [];
  const argv = [
    '--browser',
    'chrome',
    '--parallel',
    '--spec',
    'cypress/component/a spec.cy.ts',
    '--env',
    'label=two words',
    '--no-reset',
    '--no-reports',
  ];
  // A separate reporting-enabled invocation verifies exactly one parent finaliser.
  argv.splice(argv.indexOf('--no-reports'), 1);
  const result = await runComponentSuite(argv, {
    cwd,
    env: {},
    execute: async (command, args, options) => {
      calls.push('execute');
      assert.equal(command, process.execPath);
      assert.equal(args.filter((arg) => arg === '--no-reports').length, 1);
      assert.equal(args.filter((arg) => arg === '--no-reset').length, 1);
      assert.ok(args.includes('--parallel'));
      assert.ok(args.includes('cypress/component/a spec.cy.ts'));
      assert.ok(args.includes('label=two words'));
      assert.ok(fs.existsSync(path.join(cwd, 'cypress/parallel/weights')));
      assert.ok(path.isAbsolute(options.env.OPAL_COMPONENT_RUN_CONTEXT));
      return { code: 3, signal: null };
    },
    finalise: async (run, outcome) => {
      calls.push('finalise');
      assert.equal(outcome.testExitCode, 3);
      assert.equal(run.browser, 'chrome');
      return success();
    },
  });
  assert.equal(result, 3);
  assert.deepEqual(calls, ['execute', 'finalise']);
  assert.equal(fs.existsSync(path.join(cwd, 'functional-output/component/.publication.lock')), false);
});

test('a finaliser failure remains nonzero even when delegated parallel runner returned zero', async (t) => {
  const code = await runComponentSuite(['--browser=chrome'], {
    cwd: temporary(t),
    env: {},
    execute: async () => ({ code: 0, signal: null }),
    finalise: async () => ({ exitCode: 7, state: 'incomplete', diagnostics: ['failed worker'] }),
  });
  assert.equal(code, 7);
});

test('no-reports omits finalisation and no-reset retains old runs', async (t) => {
  const cwd = temporary(t);
  const options = {
    cwd,
    env: {},
    execute: async () => ({ code: 0, signal: null }),
    finalise: async () => assert.fail('must not finalise'),
  };
  assert.equal(await runComponentSuite(['--browser=chrome', '--no-reports'], options), 0);
  const runs = path.join(cwd, 'functional-output/component/chrome/runs');
  const old = fs.readdirSync(runs)[0];
  assert.equal(await runComponentSuite(['--browser=chrome', '--no-reports', '--no-reset'], options), 0);
  assert.ok(fs.readdirSync(runs).includes(old));
  assert.equal(fs.readdirSync(runs).length, 2);
});

test('execution and finalisation exceptions still release the lock and attempt reporting', async (t) => {
  const cwd = temporary(t);
  let called = false;
  assert.equal(
    await runComponentSuite(['--browser=chrome'], {
      cwd,
      env: {},
      execute: async () => {
        throw new Error('execution fixture');
      },
      finalise: async (_, outcome) => {
        called = true;
        assert.equal(outcome.testExitCode, 1);
        throw new Error('report fixture');
      },
    }),
    1,
  );
  assert.ok(called);
  assert.equal(fs.existsSync(path.join(cwd, 'functional-output/component/.publication.lock')), false);
});

test('dry-run and malformed input make no directories or child/report calls', async (t) => {
  const cwd = temporary(t);
  const options = {
    cwd,
    env: {},
    execute: async () => assert.fail('must not execute'),
    finalise: async () => assert.fail('must not finalise'),
  };
  assert.equal(await runComponentSuite(['--browser=chrome', '--parallel', '--dry-run'], options), 0);
  for (const argv of [
    ['--browser=../bad'],
    ['--browser'],
    ['--spec', '../outside'],
    ['--spec', '/tmp/outside'],
    ['--e2e'],
    ['--config', 'screenshotsFolder=../outside'],
  ]) {
    await assert.rejects(runComponentSuite(argv, options));
  }
  assert.deepEqual(fs.readdirSync(cwd), []);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  test(
    `parent ${signal} terminates child and grandchild and removes execution handlers`,
    { skip: process.platform === 'win32' },
    async (t) => {
      const cwd = temporary(t);
      const ready = path.join(cwd, 'ready.json');
      const moduleUrl = pathToFileURL(path.resolve('scripts/run-component-tests.mjs')).href;
      const grandchild = `process.on('SIGINT',()=>{});process.on('SIGTERM',()=>{});setInterval(()=>{},1000)`;
      const child = `const fs=require('node:fs');const{spawn}=require('node:child_process');const c=spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'ignore'});setTimeout(()=>fs.writeFileSync(${JSON.stringify(ready)},JSON.stringify([process.pid,c.pid])),100);setInterval(()=>{},1000)`;
      const fixture = `import {execute} from ${JSON.stringify(moduleUrl)}; const before=process.listenerCount('${signal}'); const result=await execute(process.execPath,['-e',${JSON.stringify(child)}],{cwd:${JSON.stringify(cwd)},env:process.env}); console.log(JSON.stringify({result,clean:process.listenerCount('${signal}')===before}));`;
      const parent = spawn(process.execPath, ['--input-type=module', '-e', fixture], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      t.after(() => {
        try {
          parent.kill('SIGKILL');
        } catch {}
      });
      let output = '';
      parent.stdout.on('data', (chunk) => {
        output += chunk;
      });
      const deadline = Date.now() + 5000;
      while (!fs.existsSync(ready) && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 20));
      assert.ok(fs.existsSync(ready), 'child and grandchild fixture started');
      const pids = JSON.parse(fs.readFileSync(ready, 'utf8'));
      const completion = once(parent, 'exit');
      parent.kill(signal);
      await completion;
      const { result, clean } = JSON.parse(output.trim());
      assert.equal(result.signal, signal);
      assert.notEqual(result.code, 0);
      assert.ok(clean);
      for (const pid of pids) {
        const until = Date.now() + 3000;
        let alive = true;
        while (alive && Date.now() < until) {
          try {
            process.kill(pid, 0);
          } catch (error) {
            if (error.code === 'ESRCH') alive = false;
            else throw error;
          }
          if (alive) await new Promise((resolve) => setTimeout(resolve, 20));
        }
        assert.equal(alive, false, `process ${pid} has exited`);
      }
    },
  );
}

test(
  'a child terminated directly by a signal cannot leave its grandchild running',
  { skip: process.platform === 'win32' },
  async (t) => {
    const cwd = temporary(t);
    const ready = path.join(cwd, 'grandchild.json');
    const grandchild = `process.on('SIGTERM',()=>{});setInterval(()=>{},1000)`;
    const child = `const fs=require('node:fs');const{spawn}=require('node:child_process');const c=spawn(process.execPath,['-e',${JSON.stringify(grandchild)}],{stdio:'ignore'});fs.writeFileSync(${JSON.stringify(ready)},JSON.stringify(c.pid));setTimeout(()=>process.kill(process.pid,'SIGTERM'),150);`;
    const outcome = await execute(process.execPath, ['-e', child], { cwd, env: process.env });
    assert.equal(outcome.signal, 'SIGTERM');
    const pid = JSON.parse(fs.readFileSync(ready, 'utf8'));
    const deadline = Date.now() + 3000;
    let alive = true;
    while (alive && Date.now() < deadline) {
      try {
        process.kill(pid, 0);
      } catch (error) {
        if (error.code === 'ESRCH') alive = false;
        else throw error;
      }
      if (alive) await new Promise((resolve) => setTimeout(resolve, 20));
    }
    assert.equal(alive, false, 'grandchild exited after direct child termination');
  },
);

test('dry-run redacts Cypress environment values while execution retains them', async (t) => {
  const cwd = temporary(t);
  const messages = [];
  t.mock.method(console, 'log', (message) => messages.push(message));
  const argv = ['--browser=chrome', '--env', 'label=private fixture', '--env=other=private inline fixture'];
  await runComponentSuite([...argv, '--dry-run'], { cwd, env: {} });
  assert.ok(messages[0].includes('<redacted>'));
  assert.equal(messages[0].includes('private'), false);
  assert.deepEqual(fs.readdirSync(cwd), []);
  await runComponentSuite([...argv, '--no-reports'], {
    cwd,
    env: {},
    execute: async (_, args) => {
      assert.ok(args.includes('label=private fixture'));
      assert.ok(args.includes('--env=other=private inline fixture'));
      return { code: 0, signal: null };
    },
  });
});

test('orchestration passes signal outcomes to finalisation and preserves signal precedence', async (t) => {
  const cwd = temporary(t);
  const code = await runComponentSuite(['--browser=chrome'], {
    cwd,
    env: {},
    execute: async () => ({ code: 1, signal: 'SIGINT' }),
    finalise: async (_, outcome) => {
      assert.deepEqual(outcome, { testExitCode: 1, signal: 'SIGINT' });
      return { exitCode: 0, state: 'incomplete', diagnostics: [] };
    },
  });
  assert.equal(code, 130);
});

test('CLI entrypoint previews a valid command and rejects unsupported browsers without mutation', async (t) => {
  const cwd = temporary(t);
  const runner = path.resolve('scripts/run-component-tests.mjs');
  const good = await execute(process.execPath, [runner, '--browser=chrome', '--dry-run'], { cwd, env: process.env });
  assert.equal(good.code, 0);
  const bad = await execute(process.execPath, [runner, '--browser=../invalid', '--dry-run'], { cwd, env: process.env });
  assert.equal(bad.code, 1);
  assert.deepEqual(fs.readdirSync(cwd), []);
});
