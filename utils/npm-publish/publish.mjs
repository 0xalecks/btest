import { Octokit } from "@octokit/rest";
import "zx/globals";

const TOKEN_GITHUB = process.env.TOKEN_GITHUB;
const YARN_NPM_AUTH_TOKEN = process.env.YARN_NPM_AUTH_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const GITHUB_COMMIT = process.env.GITHUB_COMMIT;
const WORKSPACE_ROOT = process.env.PROJECT_CWD;
const PROJECT_ROOT = argv.cwd;
const WHITELISTED_PACKAGES = ["@beanstalk/sdk", "@beanstalk/cli"];
let localVersion, name, isPrivate;

$.verbose = true;
cd(PROJECT_ROOT);
await precheck();
await createRelease(localVersion, name);
await publish(localVersion, name);

//  methods

async function publish(localVersion, name) {
  if (!YARN_NPM_AUTH_TOKEN) {
    exit("YARN_NPM_AUTH_TOKEN is not set");
  }
  // SDK needs to be built as a prerequisit for others
  if (name !== "@beanstalk/sdk") {
    // $`yarn workspace @beanstalk/sdk build`;
    console.log(`yarn workspace @beanstalk/sdk build`);
  }
  // $`yarn workspace ${name} publish`;
  console.log(`yarn workspace ${name} publish`);
  $`echo $YARN_NPM_AUTH_TOKEN`;
}

async function precheck() {
  try {
    ({ version: localVersion, name, private: isPrivate } = require(`${PROJECT_ROOT}/package.json`));
  } catch (err) {
    exit(`Failed to read ${PROJECT_ROOT}/package.json`);
  }

  if (isPrivate) {
    exit(`Package ${name} is marked as private.`);
  }

  if (!WHITELISTED_PACKAGES.includes(name)) {
    exit(`Project ${name} is not a whitelisted project`);
  }

  const versions = JSON.parse(await $`npm view ${name} versions --json --silent`);

  if (versions.includes(localVersion)) {
    console.log(`${name} version ${localVersion} is already published`);
    exit();
  }

  console.log(`Publishing ${name} version ${localVersion} on NPM`);
  console.log("Root: ");
}

async function createRelease(version, projectName) {
  if (!TOKEN_GITHUB) {
    exit("TOKEN_GITHUB is not set");
  }

  if (!GITHUB_COMMIT) {
    exit("GITHUB_COMMIT is not set");
  }

  if (!GITHUB_REPOSITORY) {
    exit("GITHUB_REPOSITORY is not set");
  }

  const octokit = new Octokit({
    auth: TOKEN_GITHUB
  });

  console.log("Creating release...");
  try {
    const [owner, repo] = GITHUB_REPOSITORY.split("/");
    const res = await octokit.rest.repos.createRelease({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      tag_name: `${projectName}_${version}`,
      target_commitish: GITHUB_COMMIT,
      name: `${name} Version ${version}`
    });
  } catch (err) {
    exit(err.message);
  }
}

function exit(error) {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  process.exit(0);
}

// Start publishing
