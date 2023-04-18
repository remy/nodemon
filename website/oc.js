const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const { readFile, writeFile, unlink } = require('fs').promises;
const web = require('https');
const { resolve } = require('node:path');

process.chdir(resolve(__dirname, '..'));

const url = 'https://opencollective.com/nodemon/members/all.json?TierId=2603';
const files = {
  html: './website/index.html',
  markdown: './README.md',
  jq: './website/oc.jq',
};

/**
 * @param {string} out filename to save to
 * @returns Promise<void>
 */
function curl(out) {
  return new Promise((resolve, reject) => {
    web.get(url, (res) => {
      let contents = '';

      res.on('data', (chunk) => (contents += chunk));
      res.on('end', () => {
        resolve(writeFile(out, contents));
      });
    });
  });
}

/**
 *
 * @param {string} filename
 * @returns Promise<{ markdown: string, html: string >}
 */
async function getUpdates(filename) {
  const { stdout: markdown } = await exec(
    `cat ${filename} | jq -r --argjson markdown true -f ${files.jq}`
  );
  const { stdout: html } = await exec(
    `cat ${filename} | jq -r --argjson markdown false -f ${files.jq}`
  );

  return { html: html.trim(), markdown: markdown.trim() };
}

/**
 * @returns Promise<{ markdown: string, html: string >}
 */
async function getContents() {
  return {
    html: await readFile(files.html, 'utf-8'),
    markdown: await readFile(files.markdown, 'utf-8'),
  };
}

/**
 * @param {string} insert
 * @param {string} source
 * @param {string} filename
 */
async function combine(insert, source, filename) {
  // `/s` = . matches new line
  const result = source.replace(
    /<!--oc-->(.+)<!--oc-->/s,
    `<!--oc-->${insert}<!--oc-->`
  );
  await writeFile(filename, result);
}

/**
 * @param {string} tmp
 */
async function work(tmp) {
  await curl(tmp);

  const insert = await getUpdates(tmp);
  const source = await getContents();

  ['html', 'markdown'].forEach(
    async (type) => await combine(insert[type], source[type], files[type])
  );
}

async function main() {
  let { stdout: tmp } = await exec('mktemp');
  tmp = tmp.trim();
  try {
    await work(tmp);
    await unlink(tmp);
  } catch (e) {
    console.log('failed: ' + tmp);
    console.log(e);
  }
}

main().catch((e) => console.error(e));
