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
    try {
      do {
        console.log(`Fetching ${url}${offset}`);
        let next = await get(url + offset);

        if (!Array.isArray(next)) {
          console.error(
            `Error: Expected array but got ${typeof next} from ${url}${offset}`
          );
          console.error(
            'Response:',
            JSON.stringify(next).substring(0, 200) + '...'
          );
          break;
        }

        if (next.length === 0) {
          console.log(`No more results for tier ${tier}`);
          break;
        }

        res.push(...next.map((_) => ({ ..._, tier: i })));
        offset += next.length;
      } while (offset % 100 === 0 && offset > 0);
    } catch (err) {
      console.error(
        `Error fetching tier ${tier} at offset ${offset}: ${err.message}`
      );
    }
  }

  if (res.length === 0) {
    throw new Error('No results fetched from OpenCollective API');
  }

  console.log(`Writing ${res.length} members to ${out}`);
  return writeFile(out, JSON.stringify(res));
}

/**
 * @param {string} url
 * @returns Promise<any>
 */
function get(url) {
  return new Promise((resolve, reject) => {
    web
      .get(url, (res) => {
        let contents = '';

        res.on('data', (chunk) => (contents += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(contents));
          } catch (err) {
            reject(
              new Error(`Failed to parse JSON from ${url}: ${err.message}`)
            );
          }
        });

        res.on('error', (err) => {
          reject(new Error(`Request failed for ${url}: ${err.message}`));
        });
      })
      .on('error', (err) => {
        reject(new Error(`Connection failed for ${url}: ${err.message}`));
      });
  });
}

/**
 *
 * @param {string} filename
 * @returns Promise<{ markdown: string, html: string >}
 */
async function getUpdates(filename) {
  const date40DaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
    .toJSON()
    .split('T')[0];
  const { stdout: markdown } = await exec(
    `cat ${filename} | jq -r --argjson markdown true --arg date "${date40DaysAgo}" -f ${files.jq}`
  );
  const { stdout: html } = await exec(
    `cat ${filename} | jq -r --argjson markdown false --arg date "${date40DaysAgo}" -f ${files.jq}`
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

  // Use Promise.all to properly await all async operations
  await Promise.all(
    ['html', 'markdown'].map(async (type) => {
      console.log(`Combining ${type} content`);
      return combine(insert[type], source[type], files[type]);
    })
  );
}

async function main() {
  let { stdout: tmp } = await exec('mktemp');
  tmp = tmp.trim();
  console.log(`Created temporary file: ${tmp}`);

  try {
    await work(tmp);
    console.log('Successfully updated the HTML and Markdown files');
    // await unlink(tmp);
    console.log(`Removed temporary file: ${tmp}`);
  } catch (e) {
    console.error(`Error during processing: ${e.message}`);
    console.error(e.stack);

    try {
      // Attempt to clean up temp file
      // await unlink(tmp);
      console.log(`Removed temporary file: ${tmp}`);
    } catch (unlinkErr) {
      console.error(
        `Failed to remove temporary file ${tmp}: ${unlinkErr.message}`
      );
    }

    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`Unhandled error in main: ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});
