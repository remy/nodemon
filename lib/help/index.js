import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supportsColor from 'supports-color';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const highlight = supportsColor.stdout ? '\x1B\[$1m' : '';

export default function help(item) {
  if (!item) {
    item = 'help';
  } else if (item === true) { // if used with -h or --help and no args
    item = 'help';
  }

  // cleanse the filename to only contain letters
  // aka: /\W/g but figured this was eaiser to read
  item = item.replace(/[^a-z]/gi, '');

  try {
    const dir = path.join(__dirname, '..', '..', 'doc', 'cli', item + '.txt');
    const body = fs.readFileSync(dir, 'utf8');
    return body.replace(/\\x1B\[(.)m/g, highlight);
  } catch (e) {
    return '"' + item + '" help can\'t be found';
  }
}
