import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';

import * as fsh from './index';

const dirAssets = path.resolve(__dirname, '../../assets');
const fileNonText = path.join(dirAssets, 'src-bin.ico');
const textSjisDos = path.join(dirAssets, 'src-sjis-crlf.txt');
const textUtf16BeBomDos = path.join(dirAssets, 'src-utf16be-bom-crlf.txt');
const textUtf16LeBomDos = path.join(dirAssets, 'src-utf16le-bom-crlf.txt');
const textUtf16LeUnix = path.join(dirAssets, 'src-utf16le-lf.txt');
const textUtf8BomDos = path.join(dirAssets, 'src-utf8-bom-crlf.txt');
const textUtf8Unix = path.join(dirAssets, 'src-utf8-lf.txt');
const textUtf8None = path.join(dirAssets, 'src-utf8-none.txt');

const TEST_WORDS_TOP = 'file: Mock file to test';
const TEST_WORDS_STR = 'テスト用2バイト文字';

describe('fs-hospitality', () => {
  test('textDataToBuf', () => {
    const passVals = [
      fileNonText,
      textSjisDos,
      fs.readFileSync(textUtf16BeBomDos),
      fs.readFileSync(textUtf8BomDos),
    ];

    passVals.forEach((textData) => {
      expect(Buffer.isBuffer(fsh.textDataToBuf(textData))).toBeTruthy();
    });

    // Test throwing Errors
    [''].forEach((errVal) => {
      expect(() => fsh.textDataToBuf(errVal)).toThrow();
    });
  });

  test('detectTextEncoding', () => {
    const answers = [
      { file: fileNonText, encoding: 'UTF32' },
      { file: textSjisDos, encoding: 'SJIS' },
      { file: textUtf16BeBomDos, encoding: 'UTF-16BE' },
      { file: textUtf16LeBomDos, encoding: 'UTF-16LE' },
      { file: textUtf16LeUnix, encoding: 'UTF16' },
      { file: textUtf8BomDos, encoding: 'UTF-8' },
      { file: textUtf8Unix, encoding: 'UTF-8' },
    ];

    answers.forEach((o) => {
      // file-path
      expect(fsh.detectTextEncoding(o.file)).toBe(o.encoding);
      // Buffer
      const data = fs.readFileSync(o.file);
      expect(fsh.detectTextEncoding(data)).toBe(o.encoding);
    });

    // Test throwing Errors
    [''].forEach((errVal) => {
      expect(() => fsh.detectTextEncoding(errVal)).toThrow();
    });
  });

  test('decodeTextBuffer', () => {
    const examples = [
      textSjisDos,
      textUtf16BeBomDos,
      textUtf16LeBomDos,
      textUtf16LeUnix,
      textUtf8BomDos,
      textUtf8Unix,
    ];
    const expectedTopStr = expect.stringContaining(TEST_WORDS_TOP);
    const expectedWordStr = expect.stringContaining(TEST_WORDS_STR);

    examples.forEach(async (file) => {
      const bufData = fs.readFileSync(file);
      const textData = fsh.decodeTextBuffer(bufData);
      expect(textData).toStrictEqual(expectedTopStr);
      expect(textData).toStrictEqual(expectedWordStr);
    });
  });

  test('detectTextEol', () => {
    const answers = [
      { file: fileNonText, eol: 'lf' }, // Can not be identified
      { file: textSjisDos, eol: 'crlf' },
      { file: textUtf16BeBomDos, eol: 'crlf' },
      { file: textUtf16LeBomDos, eol: 'crlf' },
      { file: textUtf16LeUnix, eol: 'lf' },
      { file: textUtf8BomDos, eol: 'crlf' },
      { file: textUtf8Unix, eol: 'lf' },
      { file: textUtf8None, eol: '' },
    ];

    answers.forEach((o) => {
      // file-path
      expect(fsh.detectTextEol(o.file)).toBe(o.eol);
      // Buffer
      const data = fs.readFileSync(o.file);
      expect(fsh.detectTextEol(data)).toBe(o.eol);
    });

    // A binary file would be detected as UTF32.
    const anyEol = expect.stringMatching(/^(cr)?(lf)?$/);
    // file-path
    expect(fsh.detectTextEol(fileNonText)).toEqual(anyEol);
    // Buffer
    const data = fs.readFileSync(fileNonText);
    expect(fsh.detectTextEol(data)).toEqual(anyEol);

    // Test throwing Errors
    [''].forEach((errVal) => {
      expect(() => fsh.detectTextEol(errVal)).toThrow();
    });
  });

  test('readAsText', async (done) => {
    const examples = [
      textSjisDos,
      textUtf16BeBomDos,
      textUtf16LeBomDos,
      textUtf16LeUnix,
      textUtf8BomDos,
      textUtf8Unix,
    ];
    const expectedTopStr = expect.stringContaining(TEST_WORDS_TOP);
    const expectedWordStr = expect.stringContaining(TEST_WORDS_STR);

    examples.forEach(async (file) => {
      // from a file-path
      let textData = await fsh.readAsText(file);
      expect(textData).toStrictEqual(expectedTopStr);
      expect(textData).toStrictEqual(expectedWordStr);
      // from a Buffer
      const bufData = fs.readFileSync(file);
      textData = await fsh.readAsText(bufData);
      expect(textData).toStrictEqual(expectedTopStr);
      expect(textData).toStrictEqual(expectedWordStr);
    });

    // Test throwing Errors
    await expect(fsh.readAsText('')).rejects.toThrow();

    done();
  });

  test('readAsTextSync', () => {
    const examples = [
      textSjisDos,
      textUtf16BeBomDos,
      textUtf16LeBomDos,
      textUtf16LeUnix,
      textUtf8BomDos,
      textUtf8Unix,
    ];
    const expectedTopStr = expect.stringContaining(TEST_WORDS_TOP);
    const expectedWordStr = expect.stringContaining(TEST_WORDS_STR);

    examples.forEach((file) => {
      // from a file-path
      let textData = fsh.readAsTextSync(file);
      expect(textData).toStrictEqual(expectedTopStr);
      expect(textData).toStrictEqual(expectedWordStr);
      // from a Buffer
      const bufData = fs.readFileSync(file);
      textData = fsh.readAsTextSync(bufData);
      expect(textData).toStrictEqual(expectedTopStr);
      expect(textData).toStrictEqual(expectedWordStr);
    });

    // Test throwing Errors
    expect(() => fsh.readAsTextSync('')).toThrow();
  });

  test('trimAllLines', () => {
    const argSets = [
      {
        str: 'foo',
        all: 'foo',
        start: 'foo',
        end: 'foo',
      },
      {
        str: '  foo',
        all: 'foo',
        start: 'foo',
        end: '  foo',
      },
      {
        str: '  foo  ',
        all: 'foo',
        start: 'foo  ',
        end: '  foo',
      },
      {
        str: '  foo  \n  bar  \n baz  ',
        all: 'foo\nbar\nbaz',
        start: 'foo  \nbar  \nbaz  ',
        end: '  foo\n  bar\n baz',
      },
      {
        str: ' foo\r\n\r\n  \r\n  bar  \r\n baz\r\n  \r\n',
        all: 'foo\r\n\r\n\r\nbar\r\nbaz\r\n\r\n',
        start: 'foo\r\n\r\n\r\nbar  \r\nbaz\r\n\r\n',
        end: ' foo\r\n\r\n\r\n  bar\r\n baz\r\n\r\n',
      },
      {
        str: '  foo  \r\n  bar  \r\n baz  ',
        all: 'foo\r\nbar\r\nbaz',
        start: 'foo  \r\nbar  \r\nbaz  ',
        end: '  foo\r\n  bar\r\n baz',
      },
      {
        str: 'Foo\r\nBar\r\nBaz',
        all: 'Foo\r\nBar\r\nBaz',
        start: 'Foo\r\nBar\r\nBaz',
        end: 'Foo\r\nBar\r\nBaz',
      },
    ];

    argSets.forEach((o) => {
      expect(fsh.trimAllLines(o.str)).toBe(o.all);
      expect(fsh.trimAllLines(o.str, 'all')).toBe(o.all);
      expect(fsh.trimAllLines(o.str, 'start')).toBe(o.start);
      expect(fsh.trimAllLines(o.str, 'end')).toBe(o.end);
    });
  });

  test('convertEOL', () => {
    const argSets = [
      {
        str: 'foo',
        empty: 'foo',
        cr: 'foo',
        lf: 'foo',
        crlf: 'foo',
      },
      {
        str: 'foo\r\nbar\r\n\r\nbaz',
        empty: 'foobarbaz',
        cr: 'foo\rbar\r\rbaz',
        lf: 'foo\nbar\n\nbaz',
        crlf: 'foo\r\nbar\r\n\r\nbaz',
      },
      {
        str: 'foo\nbar\n\nbaz',
        empty: 'foobarbaz',
        cr: 'foo\rbar\r\rbaz',
        lf: 'foo\nbar\n\nbaz',
        crlf: 'foo\r\nbar\r\n\r\nbaz',
      },
      {
        str: 'foo\r\nbar\r\nbaz\r\n\r\n',
        empty: 'foobarbaz',
        cr: 'foo\rbar\rbaz\r\r',
        lf: 'foo\nbar\nbaz\n\n',
        crlf: 'foo\r\nbar\r\nbaz\r\n\r\n',
      },
    ];

    argSets.forEach((o) => {
      expect(fsh.convertEOL(o.str)).toBe(o.empty);
      expect(fsh.convertEOL(o.str, '')).toBe(o.empty);
      expect(fsh.convertEOL(o.str, '\n')).toBe(o.lf);
      expect(fsh.convertEOL(o.str, '\r\n')).toBe(o.crlf);
      expect(fsh.convertEOL(o.str, '\r')).toBe(o.cr);
      expect(fsh.convertEOL(o.str, '\n')).toBe(o.lf);
      expect(fsh.convertEOL(o.str, 'lf')).toBe(o.lf);
      expect(fsh.convertEOL(o.str, 'LF')).toBe(o.lf);
      expect(fsh.convertEOL(o.str, 'crlf')).toBe(o.crlf);
      expect(fsh.convertEOL(o.str, 'CRLF')).toBe(o.crlf);
      expect(fsh.convertEOL(o.str, 'cr')).toBe(o.cr);
      expect(fsh.convertEOL(o.str, 'CR')).toBe(o.cr);
    });
  });

  test('makeTmpPath', () => {
    const { makeTmpPath } = fsh; // shorthand
    const dirTmp = os.tmpdir(); // caching
    let tmpPath: string;

    tmpPath = makeTmpPath();
    expect(tmpPath.indexOf(dirTmp) === 0).toBeTruthy();
    expect(tmpPath).toEqual(expect.stringMatching(/[0-9a-z-]+$/));

    tmpPath = makeTmpPath('');
    expect(tmpPath.indexOf(dirTmp) === 0).toBeTruthy();
    expect(tmpPath).toEqual(expect.stringMatching(/[0-9a-z-]+$/));

    tmpPath = makeTmpPath('.');
    expect(tmpPath.indexOf(process.cwd()) === 0).toBeTruthy();
    expect(tmpPath).toEqual(expect.stringMatching(/[0-9a-z-]+$/));

    tmpPath = makeTmpPath('', 'prefix_');
    expect(tmpPath.indexOf(dirTmp) === 0).toBeTruthy();
    expect(tmpPath).toEqual(expect.stringMatching(/prefix_[0-9a-z-]+$/));

    tmpPath = makeTmpPath('', '', '.postfix');
    expect(tmpPath.indexOf(dirTmp) === 0).toBeTruthy();
    expect(tmpPath).toEqual(expect.stringMatching(/[0-9a-z-]+\.postfix$/));

    if (os.platform() === 'win32') {
      tmpPath = makeTmpPath('R:', 'tmp_', '.log');
      expect(tmpPath.indexOf('R:\\') === 0).toBeTruthy();
      expect(tmpPath).toEqual(expect.stringMatching(/tmp_[0-9a-z-]+\.log$/));

      tmpPath = makeTmpPath('\\\\server\\public');
      expect(tmpPath.indexOf('\\\\server\\public\\') === 0).toBeTruthy();
      expect(tmpPath).toEqual(expect.stringMatching(/[0-9a-z-]+/));
    }
  });

  const testTextLf =
    '{\n  "title": "test",  \n  "message": "テスト文字列"\n } ';
  const testTextCrLf = fsh.convertEOL(testTextLf, 'crlf');
  const argSets = [
    {
      name: 'no-options_lf',
      opt: undefined,
      inputText: testTextLf,
      outputText: testTextLf,
      eol: 'lf',
      encoding: 'UTF-8',
    },
    {
      name: 'no-options_crlf',
      opt: undefined,
      inputText: testTextCrLf,
      outputText: testTextCrLf,
      eol: 'crlf',
      encoding: 'UTF-8',
    },
    {
      name: 'utf8',
      opt: { encoding: 'utf8' },
      inputText: testTextLf,
      outputText: testTextLf,
      eol: 'lf',
      encoding: 'UTF-8',
    },
    {
      name: 'trim-all',
      opt: { trim: 'all' },
      inputText: testTextLf,
      outputText: fsh.trimAllLines(testTextLf, 'all'),
      eol: 'lf',
      encoding: 'UTF-8',
    },
    {
      name: 'trim-start_lf',
      opt: { trim: 'start', eol: 'lf' },
      inputText: testTextLf,
      outputText: fsh.trimAllLines(testTextLf, 'start'),
      eol: 'lf',
      encoding: 'UTF-8',
    },
    {
      name: 'trim-end_crlf_bom_utf16',
      opt: {
        trim: 'end',
        eol: 'crlf',
        bom: true,
        encoding: 'utf16-le',
      },
      inputText: testTextLf,
      outputText: fsh.trimAllLines(testTextCrLf, 'end'),
      eol: 'crlf',
      encoding: 'UTF-16LE',
    },
    {
      name: 'sjis',
      opt: { trim: 'all', eol: 'crlf', encoding: 'Shift_JIS' },
      inputText: testTextLf,
      outputText: fsh.trimAllLines(testTextCrLf, 'all'),
      eol: 'crlf',
      encoding: 'SJIS',
    },
    /** @todo Add test pattern */
  ];

  test('writeTmpFileSync', () => {
    // String Data
    const tmpPath = fsh.writeTmpFileSync(testTextLf);
    const readDataUtf8 = fs.readFileSync(tmpPath, { encoding: 'utf8' });
    const readDataFsh = fsh.readAsTextSync(tmpPath);

    expect(readDataUtf8).toBe(testTextLf);
    expect(readDataFsh).toBe(testTextLf);

    fs.unlinkSync(tmpPath); // Clean

    /** @todo Binary Data */
  });

  test('writeAsText', async (done) => {
    argSets.forEach(async (o) => {
      const tmpPath = fsh.makeTmpPath('', 'test_', '.txt');
      await fsh.writeAsText(tmpPath, o.inputText, o.opt);

      const readData = fs.readFileSync(tmpPath);
      expect(fsh.detectTextEncoding(readData)).toBe(o.encoding);
      expect(fsh.detectTextEol(readData)).toBe(o.eol);
      expect(fsh.readAsTextSync(readData)).toBe(o.outputText);
      // Clean
      fs.unlinkSync(tmpPath);
    });

    // Auto mkdir
    const noneExistingDir = fsh.makeTmpPath();
    const nePath = path.join(noneExistingDir, 'foo', 'bar', 'to-write.txt');
    await fsh.writeAsText(nePath, 'The .txt Content');
    // Clean
    rimraf.sync(noneExistingDir);

    // Test throwing Errors
    await expect(fsh.writeAsText('')).rejects.toThrow();

    done();
  });

  test('writeAsTextSync', () => {
    argSets.forEach((o) => {
      const tmpPath = fsh.makeTmpPath('', `test_${o.name}`, '.txt');
      fsh.writeAsTextSync(tmpPath, o.inputText, o.opt);

      const readData = fs.readFileSync(tmpPath);
      expect(fsh.detectTextEncoding(readData)).toBe(o.encoding);
      expect(fsh.detectTextEol(readData)).toBe(o.eol);
      expect(fsh.readAsTextSync(readData)).toBe(o.outputText);
      // Clean
      fs.unlinkSync(tmpPath);
    });

    // Auto mkdir
    const noneExistingDir = fsh.makeTmpPath();
    const nePath = path.join(noneExistingDir, 'foo', 'bar', 'to-write.txt');
    fsh.writeAsTextSync(nePath, 'The .txt Content');
    // Clean
    rimraf.sync(noneExistingDir);

    // Test throwing Errors
    expect(() => fsh.writeAsTextSync('')).toThrow();
  });

  test('mklink', async (done) => {
    const pathPairs = [
      { srcPath: dirAssets, destPath: fsh.makeTmpPath() },
      { srcPath: fileNonText, destPath: fsh.makeTmpPath() },
    ];

    await Promise.all(
      pathPairs.map(async (pair) => {
        // ** Administrator authority is required to execute **
        await fsh.mklink(pair.srcPath, pair.destPath);

        /**
         * @description fs.stat.isSymbolicLink() returns false for a symbolic link on Windows
         * `const destStat = fs.statSync(pair.destPath);` is not work.
         * Must use fs.lstat
         */
        return fs.lstat(pair.destPath, (fsErr, destStat) => {
          if (fsErr) return fsErr;

          expect(destStat.isSymbolicLink()).toBeTruthy();

          return fs.unlink(pair.destPath, (err) => {
            if (err) return err;
            return true;
          });
        });
      }),
    );

    // Test throwing Errors
    await Promise.all(
      [''].map(async (errVal) => {
        await expect(fsh.mklink(errVal, errVal)).rejects.toThrow();
        await expect(fsh.mklink('dummy-path', errVal)).rejects.toThrow();
        await expect(fsh.mklink(errVal, 'dummy-path')).rejects.toThrow();
      }),
    );

    done();
  });

  test('mklinkSync', () => {
    const pathPairs = [
      { srcPath: dirAssets, destPath: fsh.makeTmpPath() },
      { srcPath: fileNonText, destPath: fsh.makeTmpPath() },
    ];

    pathPairs.forEach((pair) => {
      // ** Administrator authority is required to execute **
      fsh.mklinkSync(pair.srcPath, pair.destPath);

      /**
       * @description fs.stat.isSymbolicLink() returns false for a symbolic link on Windows
       * `const destStat = fs.statSync(pair.destPath);` is not work.
       * Must use fs.lstat
       */
      const destStat = fs.lstatSync(pair.destPath);
      expect(destStat.isSymbolicLink()).toBeTruthy();

      fs.unlinkSync(pair.destPath);
    });

    // Test throwing Errors
    [''].forEach((errVal) => {
      expect(() => fsh.mklinkSync(errVal, errVal)).toThrow();
      expect(() => fsh.mklinkSync('dummy-path', errVal)).toThrow();
      expect(() => fsh.mklinkSync(errVal, 'dummy-path')).toThrow();
    });
  });

  const createTestFiles = (dirTest: string): fsh.FileInfo[] => {
    /*
     * @note A structure to test
      %TEMP%test-readdirRecursively_xxxxx/
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
     */
    // The root files
    const fileRoot1 = path.join(dirTest, 'FILE_ROOT1.TXT');
    const fileRoot2 = path.join(dirTest, 'fileRoot2.log');
    const fileRoot2Sym = path.join(dirTest, 'fileRoot2-Symlink.log');
    // Create files
    fs.mkdirSync(dirTest);
    fs.writeFileSync(fileRoot1, 'fileRoot1');
    fs.writeFileSync(fileRoot2, 'fileRoot2');
    fsh.mklinkSync(fileRoot2, fileRoot2Sym);

    // The sub directory1 (DirFoo)
    const dirFoo = path.join(dirTest, 'DirFoo');
    const dirFooSym = path.join(dirTest, 'DirFoo-Symlink');
    // Create files
    fs.mkdirSync(dirFoo);
    fsh.mklinkSync(dirFoo, dirFooSym);

    // The sub directory2 (DriBar)
    const dirBar = path.join(dirTest, 'DirBar');
    const fileBar1 = path.join(dirBar, 'fileBar1.txt');
    const dirQuux = path.join(dirBar, 'DirQuux');
    const fileQuux1 = path.join(dirQuux, 'fileQuux1.txt');
    const fileQuux1Sym = path.join(dirQuux, 'fileQuux1-Symlink.txt');
    // Create files
    fs.mkdirSync(dirBar);
    fs.writeFileSync(fileBar1, 'fileBar1');
    fs.mkdirSync(dirQuux);
    fs.writeFileSync(fileQuux1, 'fileQuux1');
    fsh.mklinkSync(fileQuux1, fileQuux1Sym);

    const expectingFileObjs: fsh.FileInfo[] = [
      {
        name: 'DirFoo-Symlink',
        relPath: 'DirFoo-Symlink',
        path: dirFooSym,
        isDirectory: false,
        isFile: false,
        isSymbolicLink: true,
      },
      {
        name: 'FILE_ROOT1.TXT',
        relPath: 'FILE_ROOT1.TXT',
        path: fileRoot1,
        isDirectory: false,
        isFile: true,
        isSymbolicLink: false,
      },
      {
        name: 'fileRoot2-Symlink.log',
        relPath: 'fileRoot2-Symlink.log',
        path: fileRoot2Sym,
        isDirectory: false,
        isFile: false,
        isSymbolicLink: true,
      },
      {
        name: 'fileRoot2.log',
        relPath: 'fileRoot2.log',
        path: fileRoot2,
        isDirectory: false,
        isFile: true,
        isSymbolicLink: false,
      },
      {
        name: 'DirBar',
        relPath: 'DirBar',
        path: dirBar,
        isDirectory: true,
        isFile: false,
        isSymbolicLink: false,
      },
      {
        name: 'DirFoo',
        relPath: 'DirFoo',
        path: dirFoo,
        isDirectory: true,
        isFile: false,
        isSymbolicLink: false,
      },
      {
        name: `fileBar1.txt`,
        relPath: `DirBar${path.sep}fileBar1.txt`,
        path: fileBar1,
        isDirectory: false,
        isFile: true,
        isSymbolicLink: false,
      },
      {
        name: `DirQuux`,
        relPath: `DirBar${path.sep}DirQuux`,
        path: dirQuux,
        isDirectory: true,
        isFile: false,
        isSymbolicLink: false,
      },
      {
        name: `fileQuux1-Symlink.txt`,
        relPath: `DirBar${path.sep}DirQuux${path.sep}fileQuux1-Symlink.txt`,
        path: fileQuux1Sym,
        isDirectory: false,
        isFile: false,
        isSymbolicLink: true,
      },
      {
        name: `fileQuux1.txt`,
        relPath: `DirBar${path.sep}DirQuux${path.sep}fileQuux1.txt`,
        path: fileQuux1,
        isDirectory: false,
        isFile: true,
        isSymbolicLink: false,
      },
    ];

    return expectingFileObjs;
  };

  test('readdirRecursively', async (done) => {
    const dirTest = fsh.makeTmpPath('', 'test-readdirRecursively_');
    const expectingFileObjs = createTestFiles(dirTest);

    // No options
    const allRelPaths = (await fsh.readdirRecursively(dirTest)) as Array<
      string
    >;

    expect(allRelPaths).toHaveLength(expectingFileObjs.length);

    expectingFileObjs.forEach((expectObj) => {
      expect(allRelPaths).toEqual(expect.arrayContaining([expectObj.relPath]));
    });

    // The withFileTypes option
    const allFileObjs = (await fsh.readdirRecursively(dirTest, {
      withFileTypes: true,
    })) as Array<fsh.FileInfo>;

    expect(allFileObjs).toHaveLength(expectingFileObjs.length);

    allFileObjs.forEach((fileObj) => {
      expect(expectingFileObjs).toEqual(expect.arrayContaining([fileObj]));
    });

    const allFileNums = allRelPaths.length;
    const allDirNums = allFileObjs.filter((obj) => obj.isDirectory).length;
    const allNoneDirNums = allFileNums - allDirNums;
    let relPaths: string[];
    let fileObjs: fsh.FileInfo[];

    // isOnlyDir option
    fileObjs = (await fsh.readdirRecursively(dirTest, {
      isOnlyDir: true,
      withFileTypes: true,
    })) as Array<fsh.FileInfo>;

    expect(fileObjs).toHaveLength(allDirNums);

    fileObjs.forEach((fileObj) => {
      expect(fileObj.isDirectory).toBeTruthy();
    });

    // isOnlyFile option
    fileObjs = (await fsh.readdirRecursively(dirTest, {
      isOnlyFile: true,
      withFileTypes: true,
    })) as Array<fsh.FileInfo>;

    expect(fileObjs).toHaveLength(allNoneDirNums);

    fileObjs.forEach((fileObj) => {
      expect(fileObj.isDirectory).toBeFalsy();
    });

    // excludesSymlink option
    fileObjs = (await fsh.readdirRecursively(dirTest, {
      excludesSymlink: true,
      withFileTypes: true,
    })) as Array<fsh.FileInfo>;

    fileObjs.forEach((fileObj) => {
      expect(fileObj.isSymbolicLink).toBeFalsy();
    });

    // matchedRegExp
    relPaths = (await fsh.readdirRecursively(dirTest, {
      matchedRegExp: '\\.txt$',
    })) as Array<string>;

    relPaths.forEach((relPath) => {
      expect(relPath).toMatch(/\.txt$/i);
    });

    relPaths = (await fsh.readdirRecursively(dirTest, {
      matchedRegExp: /\.log$/i,
    })) as Array<string>;

    relPaths.forEach((relPath) => {
      expect(relPath).toMatch(/\.log$/i);
    });

    // ignoredRegExp
    relPaths = (await fsh.readdirRecursively(dirTest, {
      ignoredRegExp: '\\.txt$',
    })) as Array<string>;

    relPaths.forEach((relPath) => {
      expect(relPath).not.toMatch(/\.txt$/i);
    });

    relPaths = (await fsh.readdirRecursively(dirTest, {
      ignoredRegExp: /\.txt$/i,
    })) as Array<string>;

    relPaths.forEach((relPath) => {
      expect(relPath).not.toMatch(/\.txt$/i);
    });

    // // Test throwing Errors
    // [''].forEach(async (errVal) => {
    //   await expect(fsh.readdirRecursively(errVal)).rejects.toThrow();
    // });

    rimraf.sync(dirTest);

    done();
  });

  test('readdirRecursivelySync', () => {
    const dirTest = fsh.makeTmpPath('', 'test-readdirRecursivelySync_');
    const expectingFileObjs = createTestFiles(dirTest);

    // No options
    const allRelPaths = fsh.readdirRecursivelySync(dirTest) as Array<string>;

    expect(allRelPaths).toHaveLength(expectingFileObjs.length);

    expectingFileObjs.forEach((expectObj) => {
      expect(allRelPaths).toEqual(expect.arrayContaining([expectObj.relPath]));
    });

    // The withFileTypes option
    const allFileObjs = fsh.readdirRecursivelySync(dirTest, {
      withFileTypes: true,
    }) as Array<fsh.FileInfo>;

    expect(allFileObjs).toHaveLength(expectingFileObjs.length);

    allFileObjs.forEach((fileObj) => {
      expect(expectingFileObjs).toEqual(expect.arrayContaining([fileObj]));
    });

    const allFileNums = allRelPaths.length;
    const allDirNums = allFileObjs.filter((obj) => obj.isDirectory).length;
    const allNoneDirNums = allFileNums - allDirNums;
    let relPaths: string[];
    let fileObjs: fsh.FileInfo[];

    // isOnlyDir option
    fileObjs = fsh.readdirRecursivelySync(dirTest, {
      isOnlyDir: true,
      withFileTypes: true,
    }) as Array<fsh.FileInfo>;

    expect(fileObjs).toHaveLength(allDirNums);

    fileObjs.forEach((fileObj) => {
      expect(fileObj.isDirectory).toBeTruthy();
    });

    // isOnlyFile option
    fileObjs = fsh.readdirRecursivelySync(dirTest, {
      isOnlyFile: true,
      withFileTypes: true,
    }) as Array<fsh.FileInfo>;

    expect(fileObjs).toHaveLength(allNoneDirNums);

    fileObjs.forEach((fileObj) => {
      expect(fileObj.isDirectory).toBeFalsy();
    });

    // excludesSymlink option
    fileObjs = fsh.readdirRecursivelySync(dirTest, {
      excludesSymlink: true,
      withFileTypes: true,
    }) as Array<fsh.FileInfo>;

    fileObjs.forEach((fileObj) => {
      expect(fileObj.isSymbolicLink).toBeFalsy();
    });

    // matchedRegExp
    relPaths = fsh.readdirRecursivelySync(dirTest, {
      matchedRegExp: '\\.txt$',
    }) as Array<string>;

    relPaths.forEach((relPath) => {
      expect(relPath).toMatch(/\.txt$/i);
    });

    // ignoredRegExp
    relPaths = fsh.readdirRecursivelySync(dirTest, {
      ignoredRegExp: '\\.txt$',
    }) as Array<string>;

    relPaths.forEach((relPath) => {
      expect(relPath).not.toMatch(/\.txt$/i);
    });

    rimraf.sync(dirTest);
  });
});
