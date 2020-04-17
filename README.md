# Node.js: fs-hospitality

Extra methods for Node.js File System. e.g. `readTextFile` read a file with detecting automatically a character encoding.

## Motivation

I got tired of including `chardet`, `encoding-japanese`, and `iconv-lite` in most of my projects.
And also I wanted to learn _npm_, _TypeScript_, _GitHub_, etc and English.

## Installation

```console
npm install @tuckn/fs-hospitality
```

## Usage

### Read Text File

`readTextFile` and `readTextFileSync` can automatically recognize the encoding of a text file and read the contents as an enabled string.

Asynchronous

```js
const { readTextFile } = require('@tuckn/fs-hospitality');

readTextFile(fileSjis).then(('D:\\Test\\MyNoteSJIS.txt') => {
  console.log(textString);
  // Returns strings parsed with Shift_JIS
});
```

Synchronous

```js
const { readTextFileSync } = require('@tuckn/fs-hospitality');

const textString = readTextFileSync('D:\\Test\\Utf16LE.txt');
// Returns the strings parsed with UTF-16LE
```

### Write Text File

`writeTextFile` and `writeTextFileSync` can write strings a file with specifying the valid options for text file.

Asynchronous

```js
const { writeTextFile } = require('@tuckn/fs-hospitality');

const vbsCode =
  '  Dim str As String \n' + '  str = "テスト"  \n' + ' WScript.Echo str\n';

const options = { trim: 'all', eol: 'crlf', encoding: 'SJIS' };

writeTextFile('D:\\Test\\sjis.vbs', vbsCode, options).then(() => {
  console.log('Writing successful');
});
```

Synchronous

```js
const { writeTextFileSync } = require('@tuckn/fs-hospitality');

const vbsCode =
  '<package><job>\n' +
  '<script language="JScript">WScript.Echo("テスト");</script>\n' +
  '</job></package>';

const options = { eol: 'crlf', bom: true, encoding: 'UTF-8' };

writeTextFileSync('D:\\Test\\utf8bom.wsf', vbsCode, {}).then(() => {
  console.log('Writing successful');
});
```

### Others

Make a temporary path.

```js
const { makeTmpPath } = require('@tuckn/fs-hospitality');

const tmpPath1 = makeTmpPath();
// Returns: 'C:\Users\YourName\AppData\Local\Temp\7c70ceef-28f6-4ae8-b4ef-5e5d459ef007'

// If necessary, make sure that the file does not exist.
const fs = require('fs');
if (fs.existsSync(tmpPath1)) throw new Error('Oops! Already existing');
```

Write a temporary file and get the path.

```js
const { writeTmpFileSync } = require('@tuckn/fs-hospitality');

const tmpStr = 'The Temporary Message';
const tmpPath = writeTmpFileSync(tmpStr);
// Returns: 'C:\Users\YourName\AppData\Local\Temp\7c70ceef-28f6-4ae8-b4ef-5e5d459ef007'

const fs = require('fs');
const readData = fs.readFileSync(tmpPath, { encoding: 'utf8' });
console.log(tmpStr === readData); // true
```

## CLI

### detect-text-spec

```console
$ fs-hospitality detect-text-spec --help

Usage: fs-hospitality detect-text-spec [options] <filepath>

Detecting a text specification.

Options:
  -V, --version      output the version number
  -T, --type <name>  "all" | "encoding" | "eol"
  -h, --help         display help for command
```

Below are examples on Windows.

```console
> fs-hospitality detect-text-spec "D:\Test\src.wsf" --type "encoding"
SJIS
> fs-hospitality detect-text-spec "D:\Test\src.wsf" --type "eol"
crlf
```

### conv-text

```console
$ fs-hospitality conv-text --help

Usage: fs-hospitality conv-text [options] <filepath> [destPath]

Converting a text encoding.

Options:
  -V, --version          output the version number
  -T, --trim <type>      "all" | "start" | "end"
  -E, --eol <type>       "lf" | "cr" | "crlf" or "unix" | "mac" | "dos"
  -B, --bom              Add BOM. Only UTFx encoding
  -e, --encoding <name>  "UTF-16BE", "Shift_JIS", ... "Default: "utf8" (default: "utf8")
  -h, --help             display help for command
```

Below are examples on Windows.

```console
> fs-hospitality conv-text "D:\Test\src.wsf" --trim "all" --eol "dos" --bom
```

## API

All specifications are written [here](https://docs.tuckn.net/node-fs-hospitality).

## License

MIT

Copyright (c) 2020 [Tuckn](https://github.com/tuckn)
