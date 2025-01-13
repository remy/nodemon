const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const { readFile, writeFile, unlink } = require('fs').promises;
const web = require('https');
const { resolve } = require('node:path');
const { url } = require('node:inspector');

process.chdir(resolve(__dirname, '..'));

const tiers = [26031, 2603];

const files = {
  html: './website/index.html',
  markdown: './README.md',
  jq: './website/oc.jq',
};

/**
 * @param {string} out filename to save to
 * @returns Promise<void>
 */
async function curl(out) {
  const res = [];
  for (const [i, tier] of tiers.entries()) {
    const url = `https://opencollective.com/nodemon/members/all.json?TierId=${tier}&limit=100&offset=`;
    let offset = 0;
    do {
      let next = await get(url + offset);
      console.log(url + offset);
      res.push(...next.map((_) => ({ ..._, tier: i })));
      offset += next.length;
      if (next.length === 0) break;
    } while (offset % 100 === 0);
  }

  return writeFile(out, JSON.stringify(res));
}

/**
 * @param {string} url
 * @returns Promise<void>
 */
function get(url) {
  return new Promise((resolve, reject) => {
    web.get(url, (res) => {
      let contents = '';

      res.on('data', (chunk) => (contents += chunk));
      res.on('end', () => {
        resolve(JSON.parse(contents));
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

  // console.log(insert);
  // console.log('-'.repeat(50));

  const result = source.replace(
    /<!--oc-->.+<!--oc-->/s,
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
    console.log(tmp);
  } catch (e) {
    console.log('failed: ' + tmp);
    console.log(e);
  }
}

main().catch((e) => console.error(e));
