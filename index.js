const https = require('https');
const { existsSync } = require('fs');
const { join: joinPath } = require('path');
const { spawn } = require('child_process');

// GitHub JavaScript Actions require we "must include any package dependencies
// required to run the JavaScript code" - import node_modules in version control
// or other weird things.
// (https://help.github.com/en/articles/creating-a-javascript-action#commit-and-push-your-action-to-github).
// To overcome that, we do `npm install` dynamically from within this script 🎉.
let core; // this will become lazily imported '@actions/core'

main().catch(err => {
  console.error(err);
  core && core.setFailed(err);
  process.exit(1);
});

async function main() {
  await install(['@actions/core']);
  try {
    const actionsCore = joinPath(process.cwd(), 'node_modules/@actions/core');
    console.log(require.resolve(actionsCore));
  } catch (error) {
    console.error(error);
  }

  core = require('@actions/core');

  await core.group('Install dependencies', installDependencies);
  await core.group('Validate spec', validate);
  await core.group('Publish to /TR/', publish);
}

async function installDependencies() {
  await install(['respec', 'respec-validator']);
}

async function validate() {
  const file = 'index.html';

  if (!existsSync(file)) {
    throw `❌ ${file} not found!`;
  }

  const ghUser = core.getInput('GH_USER');
  const ghToken = core.getInput('GH_USER');

  const validator = './node_modules/.bin/respec-validator';

  if (!ghUser || !ghToken) {
    await shell(validator, [file]);
  } else {
    await shell(validator, [
      `--gh-user=${ghUser}`,
      `--gh-token=${ghToken}`,
      file
    ]);
  }
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
  const res = await request('https://labs.w3.org/echidna/api/request', {
    method: 'POST',
    body: JSON.stringify({
      url: core.getInput('ECHIDNA_MANIFEST_URL'),
      decision: core.getInput('WG_DECISION_URL'),
      token: core.getInput('ECHIDNA_TOKEN'),
      cc: core.getInput('CC')
    })
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
        reject(`❌ The process exited with status code: ${code}`);
      }
    });
  });
}

async function install(dependencies) {
  await shell('npm', ['install', '--quiet', ...dependencies]);
}

function request(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, res => {
      const chunks = [];
      res.on('data', data => chunks.push(data));
      res.on('end', () => {
        let body = Buffer.concat(chunks);
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
