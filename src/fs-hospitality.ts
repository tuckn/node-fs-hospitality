import chardet from 'chardet';
import encodingJp from 'encoding-japanese';
import fs from 'fs';
import iconv from 'iconv-lite';
import { get as obtain, isString } from 'lodash';
import os from 'os';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/** @namespace API */

/** @private */
const ARG_ERR = 'TypeError [ERR_INVALID_ARG_VALUE]: ';

/**
 * @private
 * @param {Function} fn - Function where the Error occurred
 * @returns {string} - Returns "  at ${Function.name} (${__filename})"
 */
const _errLoc = (fn: Function) => `\n    at ${fn.name} (${__filename})`;

/**
 * Reads the entire contents of a file. If a type of the param is Buffer, direct return it.
 *
 * @memberof API
 * @param {(Buffer|string)} textData - Buffer of file-path
 * @returns {Buffer} - The entire contents
 * @example
  var { textDataToBuf } = require('@tuckn/fs-hospitality');
 
  var buf = textDataToBuf('D:\\Test\\SjisNote.txt'); // file-path
  // Returns: fs.readFileSync('D:\\Test\\SjisNote.txt')
 
  var buf2 = textDataToBuf(buf); // Buffer
  // Returns: buf
 */
export function textDataToBuf(textData: Buffer | string): Buffer {
  if (Buffer.isBuffer(textData)) return textData;

  if (!fs.existsSync(textData)) {
    throw new Error(
      `${ARG_ERR}textData is not a valid file-path.${_errLoc(Function)}`,
    );
  }

  return fs.readFileSync(textData);
}

/**
 * Detects the character encoding of a Buffer or a file-path. A binary file would be detected as UTF32. See {@link https://github.com/runk/node-chardet#supported-encodings|chardet Supported Encodings}. If chardet detect windows-1252, Re-detect with {@link https://github.com/polygonplanet/encoding.js#available-encodings|encoding.js}.
 *
 * @memberof API
 * @param {(Buffer|string)} textData - Buffer of file-path
 * @returns {string} - A name of character encoding. A binary file would be detected as UTF32.
 * @example
  var { detectTextEncoding } = require('@tuckn/fs-hospitality');
 
  var encoding = detectTextEncoding('D:\\Test\\SjisNote.txt');
  // Returns: 'SJIS'
 
  var encoding = detectTextEncoding('D:\\Test\\Utf16LeNote.doc');
  // Returns: 'UTF-16LE'
 
  var encoding = detectTextEncoding('D:\\Test\\image.png');
  // Returns: 'UTF32'
 */
export function detectTextEncoding(textData: Buffer | string): string {
  const buf = textDataToBuf(textData);

  const chardetVal = chardet.detect(buf);
  if (!chardetVal) {
    throw new Error(
      `TypeError [ERR_INVALID_CONTENT]: encoding is empty.${_errLoc(Function)}`,
    );
  }

  if (chardetVal === 'windows-1252') return encodingJp.detect(buf);
  return chardetVal;
}

/**
 * Detects the EOL (End of Line) character of a Buffer or a file-path.
 *
 * @memberof API
 * @param {(Buffer|string)} textData - Buffer of file-path
 * @returns {string} - "crlf" | "cr" | "lf" | ""
 * @example
  var { detectTextEol } = require('@tuckn/fs-hospitality');
 
  var eol = detectTextEol('D:\\Test\\SjisCRLF.txt'); // file-path
  // Returns: 'crlf'
 
  var buf = 'D:\\Test\\Utf8.doc'
  var eol = detectTextEol(buf); // Buffer
  // Returns: 'lf'
 */
export function detectTextEol(textData: Buffer | string): string {
  const buf = textDataToBuf(textData);
  const enc = detectTextEncoding(buf);

  const text = iconv.decode(buf, enc);
  if (!text) {
    throw new Error(`${ARG_ERR}textData is empty.${_errLoc(Function)}`);
  }

  if (isString(text)) {
    if (/\r\n/.test(text)) return 'crlf';
    if (/\r/.test(text)) return 'cr';
    if (/\n/.test(text)) return 'lf';
  }

  return '';
}

/**
 * Reads a Buffer or a file-path as text file and encodes it into a String.
 *
 * @memberof API
 * @param {(Buffer|string)} textFile - Buffer or file-path
 * @param {string} [encoding=''] - If empty, auto-detecting
 * @returns {Promise<string>} - { resolve:string, reject:Error }
 * @example
  var { readTextFile } = require('@tuckn/fs-hospitality');
 
  // Ex.1 From a file-path
  var fileSjis = 'D:\\Test\\MyNoteSJIS.txt'
 
  readTextFile(fileSjis).then((textString) => {
    console.log(textString);
    // Returns text strings parsed with Shift_JIS
  });
 
  // Ex.2 From a Buffer
  var fileUtf16LE = 'D:\\Test\\Utf16LE.log'
 
  fs.readFile(fileUtf16LE, async (err, data) => {
    var textString = await readTextFile(data);
    console.log(textString);
    // Returns text strings parsed with UTF-16LE
  });
 */
export function readTextFile(
  textFile: Buffer | string,
  encoding = '',
): Promise<string> {
  if (!textFile) {
    return Promise.reject(
      new Error(`${ARG_ERR}textFile is empty.${_errLoc(Function)}`),
    );
  }

  return new Promise((resolve, reject) => {
    // Buffer
    if (Buffer.isBuffer(textFile)) {
      try {
        let enc = encoding;
        if (!encoding) enc = detectTextEncoding(textFile);

        resolve(iconv.decode(textFile, enc));
      } catch (e) {
        reject(e);
      }
      return;
    }

    // String (A file-path)
    const filePath = path.resolve(textFile);
    fs.readFile(filePath, (err, data) => {
      if (err) return reject(err);

      try {
        let enc = encoding;
        if (!encoding) enc = detectTextEncoding(data);

        return resolve(iconv.decode(data, enc));
      } catch (e) {
        return reject(e);
      }
    });
  });
}

/**
 * The asynchronous version of this API: readTextFile().
 *
 * @memberof API
 * @param {(Buffer|string)} textFile - Buffer or file-path
 * @param {string} [encoding=''] - If empty, auto-detecting
 * @returns {string} - The entire contents as String
 * @example
  var { readTextFileSync } = require('@tuckn/fs-hospitality');
 
  // Ex.1 From the file-path
  var textString = readTextFileSync('D:\\Test\\MyNoteSJIS.txt');
  // Returns the text strings parsed with Shift_JIS
 
  // Ex.2 From the Buffer
  var buf = fs.readFile('D:\\Test\\Utf16LE.log');
  var textString = readTextFileSync(buf);
  // Returns the text strings parsed with UTF-16LE
 */
export function readTextFileSync(
  textFile: string | Buffer,
  encoding = '',
): string {
  if (!textFile) {
    throw new Error(`${ARG_ERR}textFile is empty.${_errLoc(Function)}`);
  }

  // Buffer
  if (Buffer.isBuffer(textFile)) {
    let enc = encoding;
    if (!encoding) enc = detectTextEncoding(textFile);

    return iconv.decode(textFile, enc);
  }

  // String (A file-path)
  const filePath = path.resolve(textFile);
  const data = fs.readFileSync(filePath);

  let enc = encoding;
  if (!encoding) enc = detectTextEncoding(data);

  return iconv.decode(data, enc);
}

/**
 * Replaces the EOL (End of Line) character of a String.
 *
 * @memberof API
 * @param {string} strData - A string to be replaced
 * @param {string} eol - "(lf|unix|\n)" | "(cr|mac|\r)" | "(crlf|dos|\r\n)"
 * @returns {string} - A replaced string
 * @example
  var { convertEOL } = require('@tuckn/fs-hospitality');
 
  var textCrLf = 'foo\r\n'
    + 'bar\r\n'
    + '\r\n'
    + 'baz';
 
  var textLf = convertEOL(textCrLf, 'lf');
  // Returns:
  // 'foo\n'
  //   + 'bar\n
  //   + '\n
  //   + 'baz'
 */
export function convertEOL(strData: string, eol = ''): string {
  let eolCode;
  if (/^(crlf|dos)$/i.test(eol)) eolCode = '\r\n';
  else if (/^(lf|unix)$/i.test(eol)) eolCode = '\n';
  else if (/^(cr|mac)$/i.test(eol)) eolCode = '\r';
  else eolCode = eol;

  return strData.replace(/\r?\n/g, eolCode);
}

/**
 * Create a temporary path on the {@link https://nodejs.org/api/os.html#os_os_tmpdir|Node.js os.tmpdir}
 *
 * @memberof API
 * @param {string} [baseDir] - The defalut is os.tmpdir
 * @param {string} [prefix]
 * @param {string} [postfix]
 * @returns {string} - A temporary path
 * @example
  var fs = require('fs');
  var { makeTmpPath } = require('@tuckn/fs-hospitality');
 
  var tmpPath1 = makeTmpPath();
  // Returns: 'C:\Users\YourName\AppData\Local\Temp\7c70ceef-28f6-4ae8-b4ef-5e5d459ef007'
 
  // If necessary, make sure that file does not exist.
  if (fs.existsSync(tmpPath1)) throw new Error('Oops!');
 
  var tmpPath2 = makeTmpPath('.');
  // Returns: 'D:\test\2a5d35c8-7214-4ec7-a41d-a371b19273e7'
 
  var tmpPath3 = makeTmpPath('\\\\server\\public');
  // Returns: '\\server\public\01fa6ce7-e6d3-4b50-bdcd-19679c49bef2'
 
  var tmpPath4 = makeTmpPath('R:', 'tmp_', '.log');
  // Returns: 'R:\tmp_14493643-792d-4b0d-b2af-c74531db625e.log'
 */
export function makeTmpPath(baseDir = '', prefix = '', postfix = ''): string {
  let basePath = baseDir;
  if (!basePath) basePath = os.tmpdir();

  return path.resolve(basePath, prefix + uuidv4() + postfix);
}

/**
 * Write the data to a new temporary path, and Return the path.
 *
 * @memberof API
 * @param {(Buffer|string|TypedArray|DataView)} data - A data to write
 * @param {object} [options] - See {@link https://nodejs.org/api/fs.html#fs_fs_writefilesync_file_data_options|Node.js fs.writeFileSync}
 * @returns {string} - A temporary file path
 * @example
  var fs = require('fs');
  var { writeTmpFileSync } = require('@tuckn/fs-hospitality');
 
  var tmpStr = 'Temporary Message';
  var tmpPath = writeTmpFileSync(tmpStr);
  // Returns: 'C:\Users\YourName\AppData\Local\Temp\7c70ceef-28f6-4ae8-b4ef-5e5d459ef007'
 
  var readData = fs.readFileSync(tmpPath, { encoding: 'utf8' });
  console.log(tmpStr === readData); // true
 */
export function writeTmpFileSync(
  data: Buffer | string | ArrayBuffer,
  options = {},
): string {
  const tmpPath = makeTmpPath();
  fs.writeFileSync(tmpPath, data, options);
  return tmpPath;
}

/**
 * @private
 * @param {string} matched
 * @returns {string} - A replaced string
 */
function _trimAllLinesReplacer(matched: string): string {
  return matched.replace(/[^\r\n]/g, '');
}

/**
 * Trims a string at every each line
 *
 * @memberof API
 * @param {string} strLines - A string to be trimed
 * @param {string} [option='all'] - 'all' | 'start' | 'end';
 * @returns {string} - A trimed string
 * @example
  var { trimAllLines } = require('@tuckn/fs-hospitality');
 
  var str = '  foo  \n'
    + '  bar  \n'
    + ' baz  ';
 
  var trimedStr = trimAllLines(str);
  // Returns: 'foo\n'
  //   + 'bar\n'
  //   + 'baz';
 
  var trimedStr = trimAllLines(str, 'end');
  // Returns: '  foo\n'
  //   + '  bar\n'
  //   + ' baz';
 */
export function trimAllLines(strLines: string, option = 'all'): string {
  let trimmed = strLines;
  if (option === 'start' || option === 'all') {
    trimmed = trimmed.replace(/^\s+/gm, _trimAllLinesReplacer);
  }

  if (option === 'end' || option === 'all') {
    trimmed = trimmed.replace(/\s+$/gm, _trimAllLinesReplacer);
  }

  return trimmed;
}

/**
 * @typedef {object} PreWriteTextFileOptions
 * @readonly
 * @property {TrimAllLinesOption} [trim]
 * @property {string} [eol] - See {@link convertEOL}
 * @property {boolean} [bom]
 * @property {string} [encoding] - See {@link https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings|iconv-lite Supported Encodings}
 */
type PreWriteTextFileOptions = {
  trim?: string;
  eol?: string;
  bom?: boolean;
  encoding?: string;
};

/**
 * @private
 * @param {string} [strData='']
 * @param {PreWriteTextFileOptions} [options]
 * @returns {string}
 */
function _preWriteTextFile(
  strData = '',
  options: PreWriteTextFileOptions = {},
): string {
  let writtenData = strData;

  const trimOpt = obtain(options, 'trim', undefined);
  if (trimOpt) {
    writtenData = trimAllLines(writtenData, trimOpt);
  }

  const eol = obtain(options, 'eol', null);
  if (eol) writtenData = convertEOL(writtenData, eol);

  return writtenData;
}

/**
 * Write a String to the file as text. Also can specify an encoding, an EOL, BOM and trimming every line.
 *
 * @memberof API
 * @param {string} destPath - A destination file-path
 * @param {string} [strData=''] - A string of data to write
 * @param {PreWriteTextFileOptions} [options]
 * @returns {Promise<void>} - { resolve:undefined, reject: Error }
 * @example
  var { writeTextFile } = require('@tuckn/fs-hospitality');
  var vbsFile = 'D:\\Test\\utf8bom.vbs';
  var strData = 'Dim str As String  \n  str = "hoge"\n  WScript.Echo str';
 
  writeTextFile(vbsFile, strData, {
    trim: 'all',
    eol: 'crlf',
    bom: true,
    encoding: 'UTF-8',
  }).then(() => {
    console.log('Writing successful');
  });
 */
export function writeTextFile(
  destPath: string,
  strData = '',
  options: PreWriteTextFileOptions = {},
): Promise<void> {
  if (!destPath) {
    return Promise.reject(
      new Error(`${ARG_ERR}destPath is empty.${_errLoc(Function)}`),
    );
  }

  const filePath = path.resolve(destPath);
  const writtenData = _preWriteTextFile(strData, options);

  let addBOM = { addBOM: false };
  if (obtain(options, 'bom', false)) addBOM = { addBOM: true };

  const encoding = obtain(options, 'encoding', 'utf8');

  return new Promise((resolve, reject) => {
    fs.writeFile(
      filePath,
      iconv.encode(writtenData, encoding, addBOM),
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      },
    );
  });
}

/**
 * The asynchronous version of this API: writeTextFile().
 *
 * @memberof API
 * @param {string} destPath - A destination file-path
 * @param {string} [strData=''] - A string of data to write
 * @param {PreWriteTextFileOptions} [options]
 * @returns {void}
 * @example
  var { writeTextFile } = require('@tuckn/fs-hospitality');
  var vbsFile = 'D:\\Test\\utf8bom.vbs';
  var strData = 'Dim str As String  \n  str = "hoge"\n  WScript.Echo str';
 
  writeTextFile(vbsFile, strData, {
    trim: 'all',
    eol: 'crlf',
    bom: true,
    encoding: 'UTF-8',
  }).then(() => {
    console.log('Writing successful');
  });
 */
export function writeTextFileSync(
  destPath: string,
  strData = '',
  options: PreWriteTextFileOptions = {},
): void {
  if (!destPath) {
    throw new Error(`${ARG_ERR}destPath is empty.${_errLoc(Function)}`);
  }

  const filePath = path.resolve(destPath);
  const writtenData = _preWriteTextFile(strData, options);

  let addBOM = { addBOM: false };
  if (obtain(options, 'bom', false)) addBOM = { addBOM: true };

  const encoding = obtain(options, 'encoding', 'utf8');

  return fs.writeFileSync(
    filePath,
    iconv.encode(writtenData, encoding, addBOM),
  );
}
