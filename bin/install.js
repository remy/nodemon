#!/usr/bin/env node

// We have to use another dependency here, because there is
// no native Node.js support for the ZIP archive format yet.
const StreamZip = require('node-stream-zip');

const https = require('https');
const crypto = require('crypto');
const { promisify } = require('util');
const readFile = promisify(require('fs').readFile);
const writeFile = promisify(require('fs').writeFile);
const unlink = promisify(require('fs').unlink);

const uri = 'https://github.com/alirdn/windows-kill/releases/download/1.1.4/windows-kill_x64_1.1.4_lib_release.zip';
const archiveFilePath = './bin/windows-kill.zip';
const executableFilePath = './bin/windows-kill.exe';
const executableFileHashAlgorithm = 'SHA256';
const executableFileHash = 'd35c0d3af8f66984b1ead5cb56744049c1d71ef0791383250ad1086c0e21f865';

async function downloadAndUnzipWindowsKill() {

    const isWindows = process.platform === 'win32' ||
        process.env.OSTYPE === 'cygwin' ||
        process.env.OSTYPE === 'msys';

    if (!isWindows) {
        console.log("Installation of 'windows-kill.exe' is unneccessary, skipping...");
        process.exit(0);
    }

    console.log(`Downloading and extracting 'windows-kill.exe' from '${uri}'...`);

    async function download(uri) {

        return new Promise((resolve, reject) => {

            const request = (uri, resolve, reject) => {

                https.get(
                    uri,
                    response => {

                        // We are following the 302 Found redirect of GitHub to the actual file location.
                        if (response.statusCode === 302) {
                            request(response.headers.location, resolve, reject);
                            return;
                        }

                        if (response.statusCode !== 200) {
                            reject(new Error(`Failed to get '${uri}' (${response.statusCode})`));
                            return;
                        }

                        const data = [];
                        response.on('data', chunk => data.push(chunk));
                        response.on('end', () => resolve(Buffer.concat(data)));
                    }
                ).on('error', error => reject(error));
            }

            request(uri, resolve, reject);
        });
    };

    try {

        await writeFile(archiveFilePath, await download(uri));

        const zip = new StreamZip.async({ file: archiveFilePath });
        await zip.extract('windows-kill_x64_1.1.4_lib_release/windows-kill.exe', executableFilePath);
        await zip.close();

        // We are using a checksum to make sure the extracted executable has not been modified.
        const fileHash = crypto
            .createHash(executableFileHashAlgorithm)
            .update(await readFile(executableFilePath))
            .digest('hex');

        if (fileHash !== executableFileHash) {
            await unlink(executableFilePath);
            throw new Error(`${executableFileHashAlgorithm} checksum mismatch for 'windows-kill.exe', aborting...`)
        }

        await unlink(archiveFilePath);

    } catch (error) {
        console.error(error);

        // We are intentionally breaking the 'npm install' run
        // with a non-zero exit code, because nodemon relies on
        // a working 'windows-kill.exe' in a windows context.
        process.exit(1);
    }

    process.exit(0);
};

downloadAndUnzipWindowsKill();
