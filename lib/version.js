import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const execAsync = promisify(exec);
const statAsync = promisify(fs.stat);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var root = null;

async function pin() {
  const v = await version();
  version.pinned = v;
}

async function version(callback) {
  try {
    // first find the package.json as this will be our root
    const dir = await findPackage(__dirname);
    
    // now try to load the package
    const v = require(path.resolve(dir, 'package.json')).version;

    if (v && v !== '0.0.0-development') {
      const result = v;
      if (callback) callback(null, result);
      return result;
    }

    root = dir;

    // else we're in development, give the commit out
    // get the last commit and whether the working dir is dirty
    const [branchName, commitHash, dirtyCount] = await Promise.all([
      branch().catch(() => 'master'),
      commit().catch(() => '<none>'),
      dirty().catch(() => 0),
    ]);

    const dirtyCountInt = parseInt(dirtyCount, 10);
    let curr = branchName + ': ' + commitHash;
    if (dirtyCountInt !== 0) {
      curr += ' (' + dirtyCountInt + ' dirty files)';
    }

    const result = curr;
    if (callback) callback(null, result);
    return result;
  } catch (error) {
    console.log(error.stack);
    if (callback) callback(error);
    throw error;
  }
}

async function findPackage(dir) {
  if (dir === '/') {
    throw new Error('package not found');
  }
  
  try {
    const exists = await statAsync(path.resolve(dir, 'package.json'));
    if (exists) {
      return dir;
    }
  } catch (error) {
    // file doesn't exist, continue searching
  }
  
  return await findPackage(path.resolve(dir, '..'));
}

async function command(cmd) {
  const { stdout, stderr } = await execAsync(cmd, { cwd: root });
  const error = stderr.trim();
  if (error) {
    throw new Error(error);
  }
  return stdout.split('\n').join('');
}

function commit() {
  return command('git rev-parse HEAD');
}

function branch() {
  return command('git rev-parse --abbrev-ref HEAD');
}

function dirty() {
  return command('expr $(git status --porcelain 2>/dev/null| ' +
    'egrep "^(M| M)" | wc -l)');
}

version.pin = pin;

export default version;
export { pin };
