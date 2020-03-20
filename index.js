const https = require('https');
const path = require('path');
const { existsSync } = require('fs');
const { spawn } = require('child_process');
const core = require('@actions/core');

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
    throw new Error(`INPUT_FILE: "${file}" not found!`);
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
  const res = await request('https://labs.w3.org/echidna/api/request', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  console.log(res);
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
        reject(new Error(`The process exited with status code: ${code}`));
      }
    });
  });
}

async function install(dependencies) {
  await shell('npm', ['install', '--silent', ...dependencies]);
}

function request(url, options) {
  return new Promise((resolve, reject) => {
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
