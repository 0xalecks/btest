import "zx/globals";

$.verbose = false;
const cwd = argv.cwd;
cd(cwd);

const WHITELISTED_PACKAGES = [
  '@beanstalk/sdk',
  '@beanstalk/cli'
]

let localVersion, name, isPrivate;

try {
  ({ version: localVersion, name, private: isPrivate } = require(`${cwd}/package.json`));
} catch (err) {
  console.error(`Failed to read ${cwd}/package.json`);
  process.exit(1)
}

if (isPrivate) {
  console.error(`Package ${name} is marked as private.`);
  process.exit(1);
}

if (!WHITELISTED_PACKAGES.includes(name)){
  console.error(`Project ${name} is not a whitelisted project`)
  process.exit(1)
}

const versions = JSON.parse(await $`npm view ${name} versions --json --silent`);

if (versions.includes(localVersion)) {
  console.log(`${name} version ${localVersion} is already published`);
  process.exit(0);
}

console.log(`Publishing ${name} version ${localVersion} no NPM`)



// Start publishing
