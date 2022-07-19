#!/usr/bin/env node

import * as childProcess from 'child_process';
import { exit } from 'process';
import fs from 'fs'
import semver from 'semver'
import pkg from '../../package.json'

const updatePackageJson = () => {
  const { version } = pkg
  const majorVersion = semver.major(version)
  const minorVersion = semver.minor(version)
  const patchVersion = semver.patch(version)

  pkg.version = `${majorVersion}.${minorVersion}.${patchVersion + 1}`

  const newPkgJsonData = JSON.stringify(pkg, null, 2) + '\n';

  fs.writeFileSync('../../package.json', newPkgJsonData, 'utf8');
}

const execSync = childProcess.execSync;
const log = console.log;

// 最近一次的commitId
const lastCommitId = execSync('git rev-parse HEAD').toString();
// 最近一次的commitMsg
const lastCommitMsg = execSync('git log --pretty=format:“%s” -1').toString().replace(/"|”|“|'/g, '');

log('lastCommitInfo:', { lastCommitId, lastCommitMsg });

// 获取最近2次的commitId
const res = childProcess.execSync('git log --pretty=format:“%H” -2').toString();
const ids = res.trim().match(new RegExp(/“(\S*)”/g));

let lastBeforeCommitId = '';

if (ids && Number(ids.length) >= 2) {
  // 倒数第二次的commitId
  lastBeforeCommitId = ids[1].match(/“(\S*)”/)![1];
  log('lastBeforeCommitId:', lastBeforeCommitId);
};

const diff = childProcess.execSync('git diff --name-only');
const diffStr = diff.toString().replace(/[\n\r]/g, ',').trim();

log(diffStr);

// 更新patch版本
updatePackageJson();

// 不存在文件改变
if (!diffStr) { exit(0); };

log('执行 add');
childProcess.execSync(`git add package.json`);

if (lastBeforeCommitId) {
  log('执行 reset');
  childProcess.execSync(`git reset --soft ${lastBeforeCommitId}`);
}

log('执行 commit');

childProcess.exec(`git commit -m "${lastCommitMsg}" --no-verify`, (error) => {
  if (error) {
    log(error);
    exit(0);
  }
});
