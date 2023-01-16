import { Octokit } from "@octokit/rest";
import "zx/globals";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "0xalecks";
const GITHUB_REPO = "BSTest";
const GITHUB_COMMIT = process.env.GITHUB_COMMIT;

$.verbose = false;
const cwd = argv.cwd;
cd(cwd);

const WHITELISTED_PACKAGES = ["@beanstalk/sdk", "@beanstalk/cli"];

let localVersion, name, isPrivate;

try {
  ({ version: localVersion, name, private: isPrivate } = require(`${cwd}/package.json`));
} catch (err) {
  exit(`Failed to read ${cwd}/package.json`);
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

console.log(`Publishing ${name} version ${localVersion} no NPM`);

await createRelease(localVersion, name);

async function createRelease(version, projectName) {
  if (!GITHUB_TOKEN) {
    exit("GITHUB_TOKEN is not set");
  }

  if (!GITHUB_COMMIT) {
    exit("GITHUB_COMMIT is not set");
  }

  const octokit = new Octokit({
    auth: GITHUB_TOKEN
  });

  console.log("Creating release...");
  try {
    const res = await octokit.rest.repos.createRelease({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      tag_name: `${projectName}_${version}`,
      target_commitish: GITHUB_COMMIT,
      draft: false,
      name: `${name} Version ${version}`,
      generate_release_notes: true
    });
    console.log('Done.')
    console.log(res);
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
