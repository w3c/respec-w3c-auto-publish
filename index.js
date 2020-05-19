const https = require('https');
const { existsSync } = require('fs');
const { spawn } = require('child_process');
const core = require('@actions/core');

const ECHIDNA_SUCCESS_STATUS = 'success';
const ECHIDNA_FAILURE_STATUS = 'failure';

(async function main() {
  await run('Install dependencies', installDependencies);
  await run('Validate spec', validate);
  await run('Publish to /TR/', publish);
})();

async function run(name, fn) {
  try {
    core.startGroup(name);
    await fn();
    core.endGroup();
  } catch (error) {
    core.endGroup();
    core.setFailed(error.message);
    process.exit(1);
  }
}

async function installDependencies() {
  await install(['respec', 'respec-validator']);
}

async function validate() {
  const file = core.getInput('INPUT_FILE');

  if (!existsSync(file)) {
    throw new Error(`📛 INPUT_FILE: "${file}" not found!`);
  }

  const validator = './node_modules/.bin/respec-validator';
  await shell(validator, [file]);
}

async function publish() {
  const shouldPublish = process.env.GITHUB_EVENT_NAME !== 'pull_request';
  if (!shouldPublish) {
    console.log('👻 Skipped.');
    return;
  }

  console.log(
    '💁‍♂️ If it fails, check https://lists.w3.org/Archives/Public/public-tr-notifications/'
  );
  const data = {
    url: core.getInput('ECHIDNA_MANIFEST_URL', { required: true }),
    decision: core.getInput('WG_DECISION_URL', { required: true }),
    token: core.getInput('ECHIDNA_TOKEN', { required: true }),
    cc: core.getInput('CC')
  };
  core.setSecret(data.token);

  const body = new URLSearchParams(Object.entries(data)).toString();
  const id = await request('https://labs.w3.org/echidna/api/request', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const result = await getPublishStatus(id);
  console.log(result);
  switch (result.status) {
    case ECHIDNA_SUCCESS_STATUS:
      return core.info(`🎉 Published at: ${result.url}`);
    case ECHIDNA_FAILURE_STATUS:
      throw new Error('💥 Echidna publish has failed.');
    default:
      core.warning('🚧 Echidna publish job is pending.');
  }
}

async function getPublishStatus(id) {
  let url = new URL('https://labs.w3.org/echidna/api/status');
  url.searchParams.set('id', id);
  url = url.href;

  const isJSON = arg => typeof arg === 'string' && arg.startsWith('{');

  // wait this many seconds before each job status check attempt;
  // ... with a maximum of 18 seconds total wait.
  let RETRY_DURATIONS = [2, 3, 2, 4, 2, 5];

  const state = { id, status: 'pending', url, response: undefined };
  do {
    const wait = RETRY_DURATIONS.shift();
    console.log(`⏱️ Wait ${wait}s for job to finish...`);
    await new Promise(res => setTimeout(res, wait * 1000));

    let response;
    try {
      response = await request(url, { method: 'GET' });
      if (typeof response === 'string' && !response.startsWith('{')) {
        throw response;
      }
      response = isJSON(response) ? JSON.parse(response) : response;

      state.status = response.results.status;
      if (state.status !== ECHIDNA_SUCCESS_STATUS) {
        throw state.status;
      }

      return {
        id,
        status: state.status,
        url: response.results.metadata.thisVersion
      };
    } catch {
      state.response = response;
    }
  } while (
    state.status !== ECHIDNA_SUCCESS_STATUS &&
    state.status !== ECHIDNA_FAILURE_STATUS &&
    RETRY_DURATIONS.length > 0
  );
  return state;
}

// Utils

function shell(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`💲 ${command} ${args.join(' ')}`);
    const child = spawn(command, args, { stdio: 'inherit', ...options });
    child.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`💥 The process exited with status code: ${code}`));
      }
    });
  });
}

async function install(dependencies) {
  await shell('npm', ['install', '--silent', ...dependencies]);
}

function request(url, options) {
  return new Promise((resolve, reject) => {
    console.log(`📡 Request: ${url}`);
    const req = https.request(url, options, res => {
      const chunks = [];
      res.on('data', data => chunks.push(data));
      res.on('end', () => {
        let body = Buffer.concat(chunks).toString();
        if (res.headers['content-type'] === 'application/json') {
          body = JSON.parse(body);
        }
        resolve(body);
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}
