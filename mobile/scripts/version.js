#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '../app.json');
const packageJsonPath = path.join(__dirname, '../package.json');

function getVersion() {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  return appJson.expo.version;
}

function setVersion(version) {
  // Update app.json
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  appJson.expo.version = version;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

  // Update package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = version;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  console.log(`✅ Version updated to ${version}`);
}

function incrementVersion(type = 'patch') {
  const version = getVersion();
  const [major, minor, patch] = version.split('.').map(Number);

  let newVersion;
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }

  setVersion(newVersion);
  return newVersion;
}

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'get':
    console.log(getVersion());
    break;
  case 'set':
    if (!arg) {
      console.error('❌ Version required: node version.js set <version>');
      process.exit(1);
    }
    setVersion(arg);
    break;
  case 'increment':
    incrementVersion(arg);
    break;
  default:
    console.log('Usage:');
    console.log('  node version.js get                    - Get current version');
    console.log('  node version.js set <version>          - Set version');
    console.log('  node version.js increment [major|minor|patch] - Increment version');
    process.exit(1);
}
