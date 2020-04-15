import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as fsh from './index';

const dirSamples = path.resolve(__dirname, '../../assets');
const fileNonText = path.join(dirSamples, 'src-bin.ico');
const textSjisDos = path.join(dirSamples, 'src-sjis-crlf.txt');
const textUtf16BeBomDos = path.join(dirSamples, 'src-utf16be-bom-crlf.txt');
const textUtf16LeBomDos = path.join(dirSamples, 'src-utf16le-bom-crlf.txt');
const textUtf16LeUnix = path.join(dirSamples, 'src-utf16le-lf.txt');
const textUtf8BomDos = path.join(dirSamples, 'src-utf8-bom-crlf.txt');
const textUtf8Unix = path.join(dirSamples, 'src-utf8-lf.txt');
const textUtf8None = path.join(dirSamples, 'src-utf8-none.txt');

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

  test('readTextFile', async (done) => {
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
      let textData = await fsh.readTextFile(file);
      expect(textData).toStrictEqual(expectedTopStr);
      expect(textData).toStrictEqual(expectedWordStr);
      // from a Buffer
      const bufData = fs.readFileSync(file);
      textData = await fsh.readTextFile(bufData);
      expect(textData).toStrictEqual(expectedTopStr);
      expect(textData).toStrictEqual(expectedWordStr);
    });

    // Test throwing Errors
    await expect(fsh.readTextFile('')).rejects.toThrow();

    done();
  });

  test('readTextFileSync', () => {
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
      let textData = fsh.readTextFileSync(file);
      expect(textData).toStrictEqual(expectedTopStr);
      expect(textData).toStrictEqual(expectedWordStr);
      // from a Buffer
      const bufData = fs.readFileSync(file);
      textData = fsh.readTextFileSync(bufData);
      expect(textData).toStrictEqual(expectedTopStr);
      expect(textData).toStrictEqual(expectedWordStr);
    });

    // Test throwing Errors
    expect(() => fsh.readTextFileSync('')).toThrow();
  });

  test('trimAllLines', () => {
    const expecteds = [
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
        str: 'Hoge\r\nFuga\r\nPiyo',
        all: 'Hoge\r\nFuga\r\nPiyo',
        start: 'Hoge\r\nFuga\r\nPiyo',
        end: 'Hoge\r\nFuga\r\nPiyo',
      },
    ];

    expecteds.forEach((o) => {
      expect(fsh.trimAllLines(o.str)).toBe(o.all);
      expect(fsh.trimAllLines(o.str, 'all')).toBe(o.all);
      expect(fsh.trimAllLines(o.str, 'start')).toBe(o.start);
      expect(fsh.trimAllLines(o.str, 'end')).toBe(o.end);
    });
  });

  test('convertEOL', () => {
    const expecteds = [
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

    expecteds.forEach((o) => {
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
  const expecteds = [
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
    const readDataFsh = fsh.readTextFileSync(tmpPath);

    expect(readDataUtf8).toBe(testTextLf);
    expect(readDataFsh).toBe(testTextLf);

    fs.unlinkSync(tmpPath); // Clean

    /** @todo Binary Data */
  });

  test('writeTextFile', async (done) => {
    expecteds.forEach(async (o) => {
      const tmpPath = fsh.makeTmpPath('', 'test_', '.txt');
      await fsh.writeTextFile(tmpPath, o.inputText, o.opt);

      const readData = fs.readFileSync(tmpPath);
      expect(fsh.detectTextEncoding(readData)).toBe(o.encoding);
      expect(fsh.detectTextEol(readData)).toBe(o.eol);
      expect(fsh.readTextFileSync(readData)).toBe(o.outputText);
      // Clean
      fs.unlinkSync(tmpPath);
    });

    // Test throwing Errors
    await expect(fsh.writeTextFile('')).rejects.toThrow();

    done();
  });

  test('writeTextFileSync', () => {
    expecteds.forEach((o) => {
      const tmpPath = fsh.makeTmpPath('', `test_${o.name}`, '.txt');
      fsh.writeTextFileSync(tmpPath, o.inputText, o.opt);

      const readData = fs.readFileSync(tmpPath);
      expect(fsh.detectTextEncoding(readData)).toBe(o.encoding);
      expect(fsh.detectTextEol(readData)).toBe(o.eol);
      expect(fsh.readTextFileSync(readData)).toBe(o.outputText);
      // Clean
      fs.unlinkSync(tmpPath);
    });

    // Test throwing Errors
    expect(() => fsh.writeTextFileSync('')).toThrow();
  });
});
