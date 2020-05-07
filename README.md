# Node.js: fs-hospitality

Extra methods for Node.js File System. e.g. `readAsText` read a file with detecting automatically a character encoding.

## Motivation

I got tired of including `chardet`, `encoding-japanese`, and `iconv-lite` in most of my projects.
And also I wanted to learn _npm_, _TypeScript_, _GitHub_, etc and English.

## Installation

```console
npm install @tuckn/fs-hospitality
```

## Usage

### Read Text File

`readAsText` and `readAsTextSync` can automatically recognize the encoding of a text file and read the contents as an enabled string.

Asynchronous

```js
const fsh = require('@tuckn/fs-hospitality');

fsh.readAsText('D:\\Test\\MyNoteSJIS.txt').then((textString) => {
  console.log(textString);
  // Returns String parsed with Shift_JIS
});
```

Synchronous

```js
const fsh = require('@tuckn/fs-hospitality');

const textString = fsh.readAsTextSync('D:\\Test\\NoteUtf16LE.txt');
// Returns String parsed with UTF-16LE
```

### Write Text File

`writeAsText` and `writeAsTextSync` can write strings a file with specifying the valid options for text file.

Asynchronous

```js
const fsh = require('@tuckn/fs-hospitality');

const vbsCode =
  '  Dim str As String \n' + '  str = "テスト"  \n' + ' WScript.Echo str\n';

const options = { trim: 'all', eol: 'crlf', encoding: 'SJIS' };

fsh.writeAsText('D:\\Test\\sjis.vbs', vbsCode, options).then(() => {
  console.log('Writing successful');
});
```

Synchronous

```js
const fsh = require('@tuckn/fs-hospitality');

const vbsCode =
  '<package><job>\n' +
  '<script language="JScript">WScript.Echo("テスト");</script>\n' +
  '</job></package>';

const options = { eol: 'crlf', bom: true, encoding: 'UTF-8' };

fsh.writeAsTextSync('D:\\Test\\utf8bom.wsf', vbsCode, {}).then(() => {
  console.log('Writing successful');
});
```

### Recursively Read Directory

The sample of files structure

```console
D:\Test\
│  FILE_ROOT1.TXT
│  fileRoot2-Symlink.log
│  fileRoot2.log
│
├─DirBar
│  │  fileBar1.txt
│  │
│  └─DirQuux
│          fileQuux1-Symlink.txt
│          fileQuux1.txt
│
├─DirFoo
└─DirFoo-Symlink
```

Asynchronous

```js
const fsh = require('@tuckn/fs-hospitality');

fsh.readdirRecursively('D:\\Test').then((files) => {
  console.log(files);
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
});
```

Synchronous

```js
const fsh = require('@tuckn/fs-hospitality');

const files = fsh.readdirRecursivelySync('D:\\Test');
console.log(files);
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
```

Use `withFileTypes` option

```js
const fsh = require('@tuckn/fs-hospitality');

readdirRecursively('D:\\Test', { withFileTypes: true }).then((files) => {
  console.log(files);
  // Returns [
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
  //   ...
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
  // ]
});
```

### Create Symbolic-link for Windows

Asynchronous

```js
const fsh = require('@tuckn/fs-hospitality');

// on Windows, use mklink of command in Command-Prompt and requires admin rights
fsh.mklink('D:\\MySrc\\TestDir', 'C:\\Test').then((stdout) => {
  console.log(stdout);
  // Created the symbolic link on "C:\"
});
```

Synchronous

```js
const fsh = require('@tuckn/fs-hospitality');

// on Windows, use mklink of command in Command-Prompt and requires admin rights
const stdout = fsh.mklinkSync('D:\\MySrc\\TestDir', 'C:\\Test');
// Created the symbolic link on "C:\"
console.log(stdout);
});
```

### Others

Make a temporary path.

```js
const fsh = require('@tuckn/fs-hospitality');

const tmpPath1 = fsh.makeTmpPath();
// Returns: 'C:\Users\YourName\AppData\Local\Temp\7c70ceef-28f6-4ae8-b4ef-5e5d459ef007'

// If necessary, make sure that the file does not exist.
const fs = require('fs');
if (fs.existsSync(tmpPath1)) throw new Error('Oops! Already existing');
```

Write a temporary file and get the path.

```js
const fsh = require('@tuckn/fs-hospitality');

const tmpStr = 'The Temporary Message';
const tmpPath = fsh.writeTmpFileSync(tmpStr);
// Returns: 'C:\Users\YourName\AppData\Local\Temp\7c70ceef-28f6-4ae8-b4ef-5e5d459ef007'

const fs = require('fs');
const readData = fs.readFileSync(tmpPath, { encoding: 'utf8' });
console.log(tmpStr === readData); // true
```

## CLI

### ls

```console
$ fs-hospitality ls [options] <dirPath>

Detecting a text specification.

Options:
  -V, --version                output the version number
  -D, --is-only-dir            Exacting directories only
  -F, --is-only-file           Exacting files only
  -S, --excludes-symlink       Excluding symblic-links
  -M, --matched-reg-exp <exp>  Ex. "\d+\.txt$"
  -I, --ignored-reg-exp <exp>  Ex. "[_\-.]cache\d+"
  -W, --with-file-types        Returns file info objects (fs.Dirent)
  -h, --help                   display help for command
```

Below are examples on Windows.

```console
> fs-hospitality ls "D:\Test"
[
  'DirFoo-Symlink',
  'fileRoot2-Symlink.log',
  'fileRoot2.log',
  'FILE_ROOT1.TXT',
  'DirFoo',
  'DirBar',
  'DirBar\\fileBar1.txt',
  'DirBar\\DirQuux',
  'DirBar\\DirQuux\\fileQuux1-Symlink.txt',
  'DirBar\\DirQuux\\fileQuux1.txt'
]
```

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

The below is example on Windows.

```console
> fs-hospitality conv-text "D:\Test\src.wsf" --trim "all" --eol "dos" --bom
```

## Documentation

See all specifications [here](https://docs.tuckn.net/node-fs-hospitality).

## License

MIT

Copyright (c) 2020 [Tuckn](https://github.com/tuckn)
