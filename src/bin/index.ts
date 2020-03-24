#!/usr/bin/env node

import { program } from 'commander';
import * as fs from 'fs';
import { get as obtain } from 'lodash';

import * as fsh from '../lib/index';

// detect-text-spec
program
  .command('detect-text-spec <filepath>')
  .version('1.0.0')
  .description('Detecting a text specification.')
  .option('-T, --type <name>', '"all" | "encoding" | "eol"')
  .action((filePath, options) => {
    const detectType = obtain(options, 'type', 'all');
    const data = fs.readFileSync(filePath);

    if (detectType === 'encoding' || detectType === 'all') {
      console.log(fsh.detectTextEncoding(data));
    }

    if (detectType === 'eol' || detectType === 'all') {
      console.log(fsh.detectTextEol(data));
    }
  });

// conv-text-enc
program
  .command('conv-text-enc <filepath> [destPath]')
  .version('1.0.0')
  .description('Converting a text encoding.')
  .option('-T, --trim <type>', '"all" | "start" | "end"')
  .option('-E, --eol <type>', '"lf" | "cr" | "crlf" or "unix" | "mac" | "dos"')
  .option('-B, --bom', 'Add BOM. Only UTFx encoding')
  .option(
    '-e, --encoding <name>',
    '"UTF-16BE", "Shift_JIS", ... "Default: "utf8"',
    'utf8',
  )
  .action((filePath, destPath, options) => {
    const trim = obtain(options, 'trim', null);
    const eol = obtain(options, 'eol', null);
    const bom = obtain(options, 'bom', null);
    const encoding = obtain(options, 'encoding', null);
    const textData = fsh.readTextFileSync(filePath);

    let dest = destPath;
    if (!dest) dest = filePath;

    fsh.writeTextFileSync(dest, textData, {
      trim,
      eol,
      bom,
      encoding,
    });
  });

program.parse(process.argv);
