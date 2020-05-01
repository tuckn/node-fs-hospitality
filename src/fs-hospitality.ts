import * as chardet from 'chardet';
import { exec, execSync } from 'child_process';
import * as encodingJp from 'encoding-japanese';
import * as fs from 'fs';
import * as iconv from 'iconv-lite';
import * as _ from 'lodash';
import * as os from 'os';
import * as path from 'path';
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
 * @param {(Buffer|string)} textData - A Buffer or a file-path
 * @returns {Buffer} - The entire contents
 * @example
  const { textDataToBuf } = require('@tuckn/fs-hospitality');
 
  const buf = textDataToBuf('D:\\Test\\SjisNote.txt'); // file-path
  // Returns: fs.readFileSync('D:\\Test\\SjisNote.txt')
 
  const buf2 = textDataToBuf(buf); // Buffer
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
 * @param {(Buffer|string)} textData - A Buffer or a file-path
 * @returns {string} - A name of character encoding. A binary file would be detected as UTF32.
 * @example
  const { detectTextEncoding } = require('@tuckn/fs-hospitality');
 
  const encoding = detectTextEncoding('D:\\Test\\SjisNote.txt');
  // Returns: 'SJIS'
 
  const encoding2 = detectTextEncoding('D:\\Test\\Utf16LeNote.doc');
  // Returns: 'UTF-16LE'
 
  const encoding3 = detectTextEncoding('D:\\Test\\image.png');
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
 * Decodes a Buffer of text with automatically detecting encoding
 *
 * @memberof API
 * @param {Buffer} textBuf - A Buffer of text
 * @param {string} [encoding=''] - A specifying encoding. falsy to auto
 * @returns {string} - A encoded string
 * @example
  const { decodeTextBuffer } = require('@tuckn/fs-hospitality');
 
  const textBuf = fs.readFileSync('D:\\Test\\SjisCRLF.txt');
  const text = decodeTextBuffer(textBuf);
  // Returns: 'これはshift-JISで書かれたファイルです。'
 */
export function decodeTextBuffer(textBuf: Buffer, encoding = ''): string {
  let enc = encoding;
  if (!encoding) enc = detectTextEncoding(textBuf);

  return iconv.decode(textBuf, enc);
}

/**
 * Detects the EOL (End of Line) character of a Buffer or a file-path.
 *
 * @memberof API
 * @param {(Buffer|string)} textData - Buffer of file-path
 * @returns {string} - "crlf" | "cr" | "lf" | ""
 * @example
  const { detectTextEol } = require('@tuckn/fs-hospitality');
 
  const eol = detectTextEol('D:\\Test\\SjisCRLF.txt'); // file-path
  // Returns: 'crlf'
 
  const buf = 'D:\\Test\\Utf8.doc'
  const eol2 = detectTextEol(buf); // Buffer
  // Returns: 'lf'
 */
export function detectTextEol(textData: Buffer | string): string {
  const buf = textDataToBuf(textData);
  const text = decodeTextBuffer(buf);
  if (!text) {
    throw new Error(`${ARG_ERR}textData is empty.${_errLoc(Function)}`);
  }

  if (_.isString(text)) {
    if (/\r\n/.test(text)) return 'crlf';
    if (/\r/.test(text)) return 'cr';
    if (/\n/.test(text)) return 'lf';
  }

  return '';
}

/**
 * fs.readFile Promisification
 *
 * @memberof API
 * @param {string} filePath - A Filename
 * @param {object} [options] - See {@link https://nodejs.org/api/fs.html#fs_fs_readfile_path_options_callback|Node.js fs.readFile}
 * @returns {Promise<Buffer|string>} -
 * @example
  const { readFilePromise } = require('@tuckn/fs-hospitality');
 
  // All arguments are same with fs.readFile
  const data = await readFilePromise('D:\\Test\\myData.dat');
  console.log(data);
 */
export function readFilePromise(
  filePath: Buffer | string,
  options = {},
): Promise<Buffer | string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, options, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
}

/**
 * Reads a Buffer or a file-path as text and encodes it into a String.
 *
 * @memberof API
 * @param {(Buffer|string)} textFile - Buffer or file-path
 * @param {string} [encoding=''] - If empty, auto-detecting
 * @returns {Promise<string>} -
 * @example
  const { readAsText } = require('@tuckn/fs-hospitality');
 
  // Ex.1 From a file-path
  const fileSjis = 'D:\\Test\\MyNoteSJIS.txt'
 
  readAsText(fileSjis).then((textString) => {
    console.log(textString);
    // Returns String parsed with Shift_JIS
  });
 
  // Ex.2 From a Buffer
  const fileUtf16LE = 'D:\\Test\\Utf16LE.log'
 
  fs.readFile(fileUtf16LE, async (err, data) => {
    const textString = await readAsText(data);
    console.log(textString);
    // Returns String parsed with UTF-16LE
  });
 */
export async function readAsText(
  textFile: Buffer | string,
  encoding = '',
): Promise<string> {
  if (!textFile) {
    return Promise.reject(
      new Error(`${ARG_ERR}textFile is empty.${_errLoc(Function)}`),
    );
  }

  // Buffer
  if (Buffer.isBuffer(textFile)) {
    return decodeTextBuffer(textFile, encoding);
  }

  // String (A file-path)
  const filePath = path.resolve(textFile);
  const data = (await readFilePromise(filePath)) as Buffer;

  // if (encoding === 'binary') return resolve(data);
  // @todo When enc is 'binary'
  return decodeTextBuffer(data, encoding);
}

/**
 * The synchronous version of this API: readAsText().
 *
 * @memberof API
 * @param {(Buffer|string)} textFile - Buffer or file-path
 * @param {string} [encoding=''] - If empty, auto-detecting
 * @returns {string} -
 * @example
 * const { readAsTextSync } = require('@tuckn/fs-hospitality');
 *
 * // Ex.1 From the file-path
 * const textString = readAsTextSync('D:\\Test\\MyNoteSJIS.txt');
 * // Returns String parsed with Shift_JIS
 *
 * // Ex.2 From the Buffer
 * const buf = fs.readFile('D:\\Test\\Utf16LE.log');
 * const textString2 = readAsTextSync(buf);
 * // Returns String parsed with UTF-16LE
 */
export function readAsTextSync(
  textFile: string | Buffer,
  encoding = '',
): string {
  if (!textFile) {
    throw new Error(`${ARG_ERR}textFile is empty.${_errLoc(Function)}`);
  }

  // Buffer
  if (Buffer.isBuffer(textFile)) return decodeTextBuffer(textFile, encoding);

  // String (A file-path)
  const filePath = path.resolve(textFile);
  const data = fs.readFileSync(filePath);

  // if (encoding === 'binary') return data;
  // @todo When enc is 'binary'
  return decodeTextBuffer(data, encoding);
}

/**
 * Replaces the EOL (End of Line) character of a String.
 *
 * @memberof API
 * @param {string} strData - A string to be replaced
 * @param {string} eol - "(lf|unix|\n)" | "(cr|mac|\r)" | "(crlf|dos|\r\n)"
 * @returns {string} - A replaced string
 * @example
  const { convertEOL } = require('@tuckn/fs-hospitality');
 
  const textCrLf = 'foo\r\n'
    + 'bar\r\n'
    + '\r\n'
    + 'baz';
 
  const textLf = convertEOL(textCrLf, 'lf');
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
 * @param {string} [baseDir] - The default is os.tmpdir
 * @param {string} [prefix]
 * @param {string} [postfix]
 * @returns {string} - A temporary path
 * @example
  const { makeTmpPath } = require('@tuckn/fs-hospitality');
 
  const tmpPath1 = makeTmpPath();
  // Returns: 'C:\Users\YourName\AppData\Local\Temp\7c70ceef-28f6-4ae8-b4ef-5e5d459ef007'
 
  // If necessary, make sure that the file does not exist.
  const fs = require('fs');
  if (fs.existsSync(tmpPath1)) throw new Error('Oops!');
 
  // Makes on the current working directory
  const tmpPath2 = makeTmpPath('.');
  // Returns: 'D:\test\2a5d35c8-7214-4ec7-a41d-a371b19273e7'
 
  // Make on SMB path
  const tmpPath3 = makeTmpPath('\\\\server\\public');
  // Returns: '\\server\public\01fa6ce7-e6d3-4b50-bdcd-19679c49bef2'
 
  // with the prefix name
  const tmpPath2 = makeTmpPath('', 'MyTemp_');
  // Returns: 'C:\Users\YourName\AppData\Local\Temp\MyTemp_42dc1759-b744-4f2a-840f-e6fa27191cff'
 
  const tmpPath4 = makeTmpPath('R:', 'tmp_', '.log');
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
  const { writeTmpFileSync } = require('@tuckn/fs-hospitality');
 
  const tmpStr = 'The Temporary Message';
  const tmpPath = writeTmpFileSync(tmpStr);
  // Returns: 'C:\Users\YourName\AppData\Local\Temp\7c70ceef-28f6-4ae8-b4ef-5e5d459ef007'
 
  const fs = require('fs');
  const readData = fs.readFileSync(tmpPath, { encoding: 'utf8' });
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
 * @param {string} strLines - A string to be trimmed
 * @param {string} [option='all'] - 'all' | 'start' | 'end';
 * @returns {string} - A trimmed string
 * @example
  const { trimAllLines } = require('@tuckn/fs-hospitality');
 
  const str = '  foo  \n'
    + '  bar  \n'
    + ' baz  ';
 
  const trimmedStr1 = trimAllLines(str);
  // Returns: 'foo\n'
  //   + 'bar\n'
  //   + 'baz';
 
  const trimmedStr2 = trimAllLines(str, 'end');
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
 * @typedef {object} PrewriteAsTextOptions
 * @readonly
 * @property {TrimAllLinesOption} [trim]
 * @property {string} [eol] - See {@link convertEOL}
 * @property {boolean} [bom]
 * @property {string} [encoding] - See {@link https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings|iconv-lite Supported Encodings}
 */
type PrewriteAsTextOptions = {
  trim?: string;
  eol?: string;
  bom?: boolean;
  encoding?: string;
};

/**
 * @private
 * @param {string} [strData='']
 * @param {PrewriteAsTextOptions} [options]
 * @returns {string} - A formatted text
 */
function _prewriteAsText(
  strData = '',
  options: PrewriteAsTextOptions = {},
): string {
  let writtenData = strData;

  const trimOpt = _.get(options, 'trim', undefined);
  if (trimOpt) {
    writtenData = trimAllLines(writtenData, trimOpt);
  }

  const eol = _.get(options, 'eol', null);
  if (eol) writtenData = convertEOL(writtenData, eol);

  return writtenData;
}

/**
 * Write a String to the file as text. Also can specify an encoding, an EOL, BOM and trimming every line.
 *
 * @memberof API
 * @param {string} destPath - A destination file-path
 * @param {string} [strData=''] - A string of data to write
 * @param {PrewriteAsTextOptions} [options]
 * @returns {Promise<void>} - { resolve:undefined, reject: Error }
 * @example
  const { writeAsText } = require('@tuckn/fs-hospitality');
  const vbsFile = 'D:\\Test\\utf8bom.vbs';
  const strData = 'Dim str As String  \n  str = "foo"\n  WScript.Echo str';
 
  writeAsText(vbsFile, strData, {
    trim: 'all',
    eol: 'crlf',
    bom: true,
    encoding: 'UTF-8',
  }).then(() => {
    console.log('Writing successful');
  });
 */
export function writeAsText(
  destPath: string,
  strData = '',
  options: PrewriteAsTextOptions = {},
): Promise<void> {
  if (!destPath) {
    return Promise.reject(
      new Error(`${ARG_ERR}destPath is empty.${_errLoc(Function)}`),
    );
  }

  const filePath = path.resolve(destPath);
  const writtenData = _prewriteAsText(strData, options);

  let addBOM = { addBOM: false };
  if (_.get(options, 'bom', false)) addBOM = { addBOM: true };

  const encoding = _.get(options, 'encoding', 'utf8');

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
 * The synchronous version of this API: writeAsText().
 *
 * @memberof API
 * @param {string} destPath - A destination file-path
 * @param {string} [strData=''] - A string of data to write
 * @param {object} options - See {@link API.writeAsText}
 * @returns {void}
 * @example
 * const { writeAsText } = require('@tuckn/fs-hospitality');
 * const vbsFile = 'D:\\Test\\utf8bom.vbs';
 * const strData = 'Dim str As String  \n  str = "foo"\n  WScript.Echo str';
 *
 * writeAsText(vbsFile, strData, {
 * trim: 'all',
 * eol: 'crlf',
 * bom: true,
 * encoding: 'UTF-8',
 * }).then(() => {
 * console.log('Writing successful');
 * });
 */
export function writeAsTextSync(
  destPath: string,
  strData = '',
  options: PrewriteAsTextOptions = {},
): void {
  if (!destPath) {
    throw new Error(`${ARG_ERR}destPath is empty.${_errLoc(Function)}`);
  }

  const filePath = path.resolve(destPath);
  const writtenData = _prewriteAsText(strData, options);

  let addBOM = { addBOM: false };
  if (_.get(options, 'bom', false)) addBOM = { addBOM: true };

  const encoding = _.get(options, 'encoding', 'utf8');

  return fs.writeFileSync(
    filePath,
    iconv.encode(writtenData, encoding, addBOM),
  );
}

/**
 *  Creates a new link (also known as Symbolic Link) to an existing file. Similar to {@link https://nodejs.org/api/fs.html#fs_fs_linksync_existingpath_newpath|Node.js-Path}. But on Windows, use mklink of command in Command-Prompt. so requires admin rights.
 *
 * @memberof API
 * @param {string} existingPath - A source file or direcotry
 * @param {string} newPath - A destination path
 * @returns {Promise<string>} - Returns mklink stdout
 * @example
  const { mklink } = require('@tuckn/fs-hospitality');
 
  // on Windows, use mklink of command in Command-Prompt and requires admin rights
  mklink('D:\\MySrc\\TestDir', 'C:\\Test').then((stdout) => {
    console.log(stdout);
    // Created the symbolic link on "C:\"
  });
 */
export async function mklink(
  existingPath: string,
  newPath: string,
): Promise<void | string> {
  if (os.platform() !== 'win32') {
    return new Promise((resolve, reject) => {
      fs.link(existingPath, newPath, (err) => {
        if (err) return reject(err);
        return resolve();
      });
    });
  }

  if (!existingPath) {
    throw new Error(`${ARG_ERR}existingPath is empty.${_errLoc(Function)}`);
  }

  if (!newPath) {
    throw new Error(`${ARG_ERR}newPath is empty.${_errLoc(Function)}`);
  }

  const mainCmd = 'mklink';
  let argsStr = '';

  return new Promise((resolve, reject) => {
    fs.stat(existingPath, (fsErr, statSrc) => {
      if (fsErr) return reject(fsErr);

      if (statSrc.isFile()) {
        argsStr = `"${newPath}" "${existingPath}"`;
      } else if (statSrc.isDirectory()) {
        argsStr = `/D "${newPath}" "${existingPath}"`;
      } else {
        return reject(
          new Error(
            `${ARG_ERR}${newPath} is not the file or directory.${_errLoc(
              Function,
            )}`,
          ),
        );
      }

      return exec(
        `${mainCmd} ${argsStr}`,
        { encoding: 'buffer' },
        (err, stdout, stderr) => {
          if (err) return reject(decodeTextBuffer(stderr));
          return resolve(decodeTextBuffer(stdout));
        },
      );
    });
  });
}

/**
 * The synchronous version of this API: mklink().
 *
 * @memberof API
 * @param {string} existingPath - A source file or direcotry
 * @param {string} newPath - A destination path
 * @returns {string} - Returns mklink stdout
 * @example
  const { mklinkSync } = require('@tuckn/fs-hospitality');
 
  // on Windows, use mklink of command in Command-Prompt and requires admin rights
  const stdout = mklinkSync('D:\\MySrc\\TestDir', 'C:\\Test');
  // Created the symbolic link on "C:\"
 */
export function mklinkSync(
  existingPath: string,
  newPath: string,
): void | string {
  if (os.platform() !== 'win32') {
    return fs.linkSync(existingPath, newPath);
  }

  if (!existingPath) {
    throw new Error(`${ARG_ERR}existingPath is empty.${_errLoc(Function)}`);
  }

  if (!newPath) {
    throw new Error(`${ARG_ERR}newPath is empty.${_errLoc(Function)}`);
  }

  const mainCmd = 'mklink';
  let argsStr = '';

  const statSrc = fs.statSync(existingPath);
  if (statSrc.isFile()) {
    argsStr = `"${newPath}" "${existingPath}"`;
  } else if (statSrc.isDirectory()) {
    argsStr = `/D "${newPath}" "${existingPath}"`;
  } else {
    throw new Error(
      `${ARG_ERR}${newPath} is not the file or direcotry.${_errLoc(Function)}`,
    );
  }

  return decodeTextBuffer(execSync(`${mainCmd} ${argsStr}`));
}

/**
 * fs.readdir Promisification. {@link https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback|Node.js fs.readdir}
 *
 * @memberof API
 * @param {string} dirPath - A directory path
 * @param {object} [options] - See {@link https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback|Node.js fs.readdir}
 * @returns {Promise<string[]|Buffer[]|fs.Dirent[]>} - Returns array of fs.Dirent
 */
export function readdirPromise(
  dirPath: string,
  options = {},
): Promise<string[] | Buffer[] | fs.Dirent[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, options, (err, files) => {
      if (err) return reject(err);
      return resolve(files);
    });
  });
}

/**
 * @typedef {object} FileInfo
 * @property {string} name -
 * @property {string} path -
 * @property {boolean} isDirectory -
 * @property {boolean} isFile -
 * @property {boolean} isSymbolicLink -
 */
export interface FileInfo {
  name: string;
  relPath: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  isSymbolicLink: boolean;
}

/**
 * Sort-Function for FileInfo objects of Array. Sorts with name and file-type.
 *
 * @private
 * @param {FileInfo} a -
 * @param {FileInfo} b -
 * @returns {number} - 0|1|-1
 */
function sortFileInfo(a: FileInfo, b: FileInfo): 0 | 1 | -1 {
  let comparison: 0 | 1 | -1 = 0;

  if (a.isDirectory && !b.isDirectory) {
    comparison = 1;
  } else if (!a.isDirectory && b.isDirectory) {
    comparison = -1;
  } else if (a.relPath > b.relPath) {
    comparison = 1;
  } else if (a.relPath < b.relPath) {
    comparison = -1;
  }

  return comparison;
}

/**
 * Recursively list all file paths in a directory.
 *
 * @memberof API
 * @param {string} dirPath - A directory path
 * @param {object} options - Optional parameters
 * @param {boolean} [options.isOnlyDir=false] - Exacting directories only
 * @param {boolean} [options.isOnlyFile=false] - Exacting files only
 * @param {boolean} [options.excludesSymlink=false] - Excluding symbolic-links
 * @param {string|RegExp} [options.matchedRegExp] - Ex. "\\d+\\.txt$"
 * @param {string|RegExp} [options.ignoredRegExp] - Ex. "[_\\-.]cache\\d+"
 * @param {boolean} [options.withFileTypes=false] - If true, return fs.Dirent[]
 * @param {string} [options._prefixDirName] - @private The internal option
 * @returns {Promise<string[]|FileInfo[]>} - { resolve:string, reject:Error }
 * @example
  const { readdirRecursively } = require('@tuckn/fs-hospitality');
 
  // D:\Test\
  // │  FILE_ROOT1.TXT
  // │  fileRoot2-Symlink.log
  // │  fileRoot2.log
  // │
  // ├─DirBar
  // │  │  fileBar1.txt
  // │  │
  // │  └─DirQuux
  // │          fileQuux1-Symlink.txt
  // │          fileQuux1.txt
  // │
  // ├─DirFoo
  // └─DirFoo-Symlink
 
  readdirRecursively('D:\\Test').then((files) => {
    console.dir(files);
    // Returns [
    //   'DirFoo-Symlink',
    //   'fileRoot2-Symlink.log',
    //   'fileRoot2.log',
    //   'FILE_ROOT1.TXT',
    //   'DirFoo',
    //   'DirBar',
    //   'DirBar\\fileBar1.txt',
    //   'DirBar\\DirQuux',
    //   'DirBar\\DirQuux\\fileQuux1-Symlink.txt',
    //   'DirBar\\DirQuux\\fileQuux1.txt' ]
 
  readdirRecursively('D:\\Test', { withFileTypes: true }).then((files) => {
    console.dir(files);
    // Returns [
    //   {
    //     name: 'DirFoo-Symlink',
    //     relPath: 'DirFoo-Symlink',
    //     path: 'D:\\Test\\DirFoo-Symlink',
    //     isDirectory: false,
    //     isFile: false,
    //     isSymbolicLink: true
    //   },
    //   {
    //     name: 'fileRoot2-Symlink.log',
    //     relPath: 'fileRoot2-Symlink.log',
    //     path: 'D:\\Test\\fileRoot2-Symlink.log',
    //     isDirectory: false,
    //     isFile: false,
    //     isSymbolicLink: true
    //   },
    //   {
    //     name: 'fileRoot2.log',
    //     relPath: 'fileRoot2.log',
    //     path: 'D:\\Test\\fileRoot2.log',
    //     isDirectory: false,
    //     isFile: true,
    //     isSymbolicLink: false
    //   },
    //   {
    //     name: 'FILE_ROOT1.TXT',
    //     relPath: 'FILE_ROOT1.TXT',
    //     path: 'D:\\Test\\FILE_ROOT1.TXT',
    //     isDirectory: false,
    //     isFile: true,
    //     isSymbolicLink: false
    //   },
    //   {
    //     name: 'DirFoo',
    //     relPath: 'DirFoo',
    //     path: 'D:\\Test\\DirFoo',
    //     isDirectory: true,
    //     isFile: false,
    //     isSymbolicLink: false
    //   },
    //   {
    //     name: 'DirBar',
    //     relPath: 'DirBar',
    //     path: 'D:\\Test\\DirBar',
    //     isDirectory: true,
    //     isFile: false,
    //     isSymbolicLink: false
    //   },
    //   {
    //     name: 'fileBar1.txt',
    //     relPath: 'DirBar\\fileBar1.txt',
    //     path: 'D:\\Test\\DirBar\\fileBar1.txt',
    //     isDirectory: false,
    //     isFile: true,
    //     isSymbolicLink: false
    //   },
    //   {
    //     name: 'DirQuux',
    //     relPath: 'DirBar\\DirQuux',
    //     path: 'D:\\Test\\DirBar\\DirQuux',
    //     isDirectory: true,
    //     isFile: false,
    //     isSymbolicLink: false
    //   },
    //   {
    //     name: 'fileQuux1-Symlink.txt',
    //     relPath: 'DirBar\\DirQuux\\fileQuux1-Symlink.txt',
    //     path: 'D:\\Test\\DirBar\\DirQuux\\fileQuux1-Symlink.txt',
    //     isDirectory: false,
    //     isFile: false,
    //     isSymbolicLink: true
    //   },
    //   {
    //     name: 'fileQuux1.txt',
    //     relPath: 'DirBar\\DirQuux\\fileQuux1.txt',
    //     path: 'D:\\Test\\DirBar\\DirQuux\\fileQuux1.txt',
    //     isDirectory: false,
    //     isFile: true,
    //     isSymbolicLink: false
    //   }
    // ]
  });
 */
export async function readdirRecursively(
  dirPath: string,
  options = {},
): Promise<string[] | FileInfo[]> {
  // Get the all of top files
  const dirents = (await readdirPromise(dirPath, {
    withFileTypes: true,
  })) as Array<fs.Dirent>;

  // Filtering Options
  const isOnlyFile = _.get(options, 'isOnlyFile', false);
  const isOnlyDir = _.get(options, 'isOnlyDir', false);
  const excludesSymlink = _.get(options, 'excludesSymlink', false);

  const matchedRegExp = _.get(options, 'matchedRegExp', null);
  let mtchRE: RegExp | null = null;
  if (matchedRegExp) {
    if (_.isRegExp(matchedRegExp)) {
      mtchRE = matchedRegExp;
    } else {
      mtchRE = new RegExp(matchedRegExp, 'i');
    }
  }

  const ignoredRegExp = _.get(options, 'ignoredRegExp', null);
  let ignrRE: RegExp | null = null;
  if (ignoredRegExp) {
    if (_.isRegExp(ignoredRegExp)) {
      ignrRE = ignoredRegExp;
    } else {
      ignrRE = new RegExp(ignoredRegExp, 'i');
    }
  }

  const _prefixDirName = _.get(options, '_prefixDirName', '');

  // let files: string[] | FileInfo[] = [];
  const files: FileInfo[] = [];
  const dirs: FileInfo[] = [];

  dirents.forEach((dirent) => {
    const relPath = path.join(_prefixDirName, dirent.name);

    if (!dirent.isDirectory()) {
      // Filtering
      if (isOnlyDir) return;
      if (excludesSymlink && dirent.isSymbolicLink()) return;
      if (mtchRE && !mtchRE.test(relPath)) return;
      if (ignrRE && ignrRE.test(relPath)) return;

      files.push({
        name: dirent.name,
        relPath,
        path: path.resolve(dirPath, dirent.name),
        isDirectory: false,
        isFile: dirent.isFile(),
        isSymbolicLink: dirent.isSymbolicLink(),
      });
    } else {
      // @note
      // The dires will be filterd after getting subdirectory information
      dirs.push({
        name: dirent.name,
        relPath,
        path: path.resolve(dirPath, dirent.name),
        isDirectory: true,
        isFile: false,
        isSymbolicLink: dirent.isSymbolicLink(),
      });
    }
  });

  // Get the all of sub directoies files recursively
  // let dirsBranches: string[] | FileInfo[] = [];
  let dirsBranches: FileInfo[] = [];

  await Promise.all(
    dirs.map(async (dir) => {
      const subDir = (await readdirRecursively(dir.path, {
        ...options,
        withFileTypes: true,
        _prefixDirName: dir.relPath,
      })) as Array<FileInfo>;

      // Filtering the top directory
      if (
        !isOnlyFile &&
        !(excludesSymlink && dir.isSymbolicLink) &&
        (!mtchRE || (mtchRE && mtchRE.test(dir.relPath))) &&
        !(ignrRE && ignrRE.test(dir.relPath))
      ) {
        dirsBranches = dirsBranches.concat(dir);
      }

      if (subDir.length > 0) dirsBranches = dirsBranches.concat(subDir);
    }),
  );

  // Join
  let rtnFilesInfo: FileInfo[] = [];
  if (files.length > 0) rtnFilesInfo = rtnFilesInfo.concat(files);
  if (dirsBranches.length > 0) rtnFilesInfo = rtnFilesInfo.concat(dirsBranches);

  // @todo
  // Sort
  // files.sort(sortFileInfo);

  const withFileTypes = _.get(options, 'withFileTypes', false);
  if (!withFileTypes) {
    return rtnFilesInfo.map((file) => file.relPath);
  }

  return rtnFilesInfo;
}

/**
 * The synchronous version of this API: readdirRecursivelySync().
 *
 * @memberof API
 * @param {string} dirPath - A directory path
 * @param {object} options - See {@link API.readdirRecursively}
 * @returns {string[]|FileInfo[]} -
 * @example
 * const { readdirRecursivelySync } = require('@tuckn/fs-hospitality');
 *
 * // D:\Test\
 * // │  FILE_ROOT1.TXT
 * // │  fileRoot2-Symlink.log
 * // │  fileRoot2.log
 * // │
 * // ├─DirBar
 * // │  │  fileBar1.txt
 * // │  │
 * // │  └─DirQuux
 * // │          fileQuux1-Symlink.txt
 * // │          fileQuux1.txt
 * // │
 * // ├─DirFoo
 * // └─DirFoo-Symlink
 *
 * const files = readdirRecursivelySync('D:\\Test');
 * console.dir(files);
 * // Returns [
 * //   'DirFoo-Symlink',
 * //   'fileRoot2-Symlink.log',
 * //   'fileRoot2.log',
 * //   'FILE_ROOT1.TXT',
 * //   'DirFoo',
 * //   'DirBar',
 * //   'DirBar\\fileBar1.txt',
 * //   'DirBar\\DirQuux',
 * //   'DirBar\\DirQuux\\fileQuux1-Symlink.txt',
 * //   'DirBar\\DirQuux\\fileQuux1.txt' ]
 */
export function readdirRecursivelySync(
  dirPath: string,
  options = {},
): string[] | FileInfo[] {
  // Get the all of top files
  const dirents = fs.readdirSync(dirPath, {
    withFileTypes: true,
  });

  // Filtering Options
  const isOnlyFile = _.get(options, 'isOnlyFile', false);
  const isOnlyDir = _.get(options, 'isOnlyDir', false);
  const excludesSymlink = _.get(options, 'excludesSymlink', false);

  const matchedRegExp = _.get(options, 'matchedRegExp', null);
  let mtchRE: RegExp | null = null;
  if (matchedRegExp) {
    if (_.isRegExp(matchedRegExp)) {
      mtchRE = matchedRegExp;
    } else {
      mtchRE = new RegExp(matchedRegExp, 'i');
    }
  }

  const ignoredRegExp = _.get(options, 'ignoredRegExp', null);
  let ignrRE: RegExp | null = null;
  if (ignoredRegExp) {
    if (_.isRegExp(ignoredRegExp)) {
      ignrRE = ignoredRegExp;
    } else {
      ignrRE = new RegExp(ignoredRegExp, 'i');
    }
  }

  const _prefixDirName = _.get(options, '_prefixDirName', '');

  // let files: string[] | FileInfo[] = [];
  const files: FileInfo[] = [];
  const dirs: FileInfo[] = [];

  dirents.forEach((dirent) => {
    const relPath = path.join(_prefixDirName, dirent.name);

    if (!dirent.isDirectory()) {
      // Filtering
      if (isOnlyDir) return;
      if (excludesSymlink && dirent.isSymbolicLink()) return;
      if (mtchRE && !mtchRE.test(relPath)) return;
      if (ignrRE && ignrRE.test(relPath)) return;

      files.push({
        name: dirent.name,
        relPath,
        path: path.resolve(dirPath, dirent.name),
        isDirectory: false,
        isFile: dirent.isFile(),
        isSymbolicLink: dirent.isSymbolicLink(),
      });
    } else {
      // @note
      // The dires will be filtered after getting subdirectory information
      dirs.push({
        name: dirent.name,
        relPath,
        path: path.resolve(dirPath, dirent.name),
        isDirectory: true,
        isFile: false,
        isSymbolicLink: dirent.isSymbolicLink(),
      });
    }
  });

  // Get the all of sub directories files recursively
  // let dirsBranches: string[] | FileInfo[] = [];
  let dirsBranches: FileInfo[] = [];

  dirs.forEach((dir) => {
    const subDir = readdirRecursivelySync(dir.path, {
      ...options,
      withFileTypes: true,
      _prefixDirName: dir.relPath,
    }) as Array<FileInfo>;

    // Filtering the top directory
    if (
      !isOnlyFile &&
      !(excludesSymlink && dir.isSymbolicLink) &&
      (!mtchRE || (mtchRE && mtchRE.test(dir.relPath))) &&
      !(ignrRE && ignrRE.test(dir.relPath))
    ) {
      dirsBranches = dirsBranches.concat(dir);
    }

    if (subDir.length > 0) dirsBranches = dirsBranches.concat(subDir);
  });

  // Join
  let rtnFilesInfo: FileInfo[] = [];
  if (files.length > 0) rtnFilesInfo = rtnFilesInfo.concat(files);
  if (dirsBranches.length > 0) rtnFilesInfo = rtnFilesInfo.concat(dirsBranches);

  // @todo
  // Sort
  // files.sort(sortFileInfo);

  const withFileTypes = _.get(options, 'withFileTypes', false);
  if (!withFileTypes) {
    return rtnFilesInfo.map((file) => file.relPath);
  }

  return rtnFilesInfo;
}
