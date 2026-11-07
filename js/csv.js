/*!
 * csv.js - a small, dependency-free CSV reader.
 *
 * Handles the parts of RFC 4180 that real spreadsheet exports actually use:
 *   - quoted fields containing the delimiter, newlines or escaped ("") quotes
 *   - CRLF, LF and lone CR line endings
 *   - a leading UTF-8 byte order mark
 *   - comma / semicolon / tab / pipe delimiters, auto-detected
 *
 * Every returned row carries the 1-based source line it started on, so callers
 * can point a user at the exact line in their file. That matters because a
 * quoted field may span several lines, which makes "row number" and "line
 * number" two different things.
 */
(function (global) {
  'use strict';

  var DELIMITERS = [',', ';', '\t', '|'];

  function detectDelimiter(text) {
    var counts = {};
    var i;
    for (i = 0; i < DELIMITERS.length; i++) counts[DELIMITERS[i]] = 0;

    var inQuotes = false;
    for (i = 0; i < text.length; i++) {
      var c = text.charAt(i);

      if (c === '"') {
        if (inQuotes && text.charAt(i + 1) === '"') { i++; continue; }
        inQuotes = !inQuotes;
        continue;
      }
      if (inQuotes) continue;
      if (c === '\n' || c === '\r') break;
      if (counts.hasOwnProperty(c)) counts[c]++;
    }

    var best = ',';
    var bestCount = 0;
    for (i = 0; i < DELIMITERS.length; i++) {
      var d = DELIMITERS[i];
      if (counts[d] > bestCount) { bestCount = counts[d]; best = d; }
    }
    return best;
  }

  function parse(text, opts) {
    opts = opts || {};
    if (typeof text !== 'string') text = String(text == null ? '' : text);

    if (text.charAt(0) === '\uFEFF') text = text.slice(1);

    var delimiter = opts.delimiter || detectDelimiter(text);

    var rows = [];
    var lines = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    var quotedField = false;
    var line = 1;
    var rowStartLine = 1;
    var touched = false;
    var i = 0;

    function endField() {
      row.push(quotedField ? field : field.trim());
      field = '';
      quotedField = false;
    }

    function endRow() {
      endField();
      rows.push(row);
      lines.push(rowStartLine);
      row = [];
      touched = false;
      rowStartLine = line;
    }

    while (i < text.length) {
      var c = text.charAt(i);

      if (inQuotes) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        if (c === '\n') { line++; }
        else if (c === '\r') {
          if (text.charAt(i + 1) === '\n') { field += '\n'; line++; i += 2; continue; }
          field += '\n'; line++; i++; continue;
        }
        field += c;
        i++;
        continue;
      }

      if (c === '"' && field === '') {
        inQuotes = true;
        quotedField = true;
        touched = true;
        i++;
        continue;
      }
      if (c === delimiter) {
        touched = true;
        endField();
        i++;
        continue;
      }
      if (c === '\r' || c === '\n') {
        if (c === '\r' && text.charAt(i + 1) === '\n') i += 2; else i += 1;
        line++;
        if (touched || field !== '') {
          endRow();
        } else {
          row = [];
          rowStartLine = line;
        }
        continue;
      }

      field += c;
      touched = true;
      i++;
    }

    if (touched || field !== '' || row.length) endRow();

    return { rows: rows, lines: lines, delimiter: delimiter };
  }

  function stringify(rows, opts) {
    opts = opts || {};
    var delimiter = opts.delimiter || ',';
    var eol = opts.eol || '\r\n';

    return rows.map(function (row) {
      return row.map(function (cell) {
        var s = cell == null ? '' : String(cell);
        var mustQuote =
          s.indexOf(delimiter) !== -1 ||
          s.indexOf('"') !== -1 ||
          s.indexOf('\n') !== -1 ||
          s.indexOf('\r') !== -1 ||
          s !== s.trim();
        return mustQuote ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(delimiter);
    }).join(eol);
  }

  global.QuizApp = global.QuizApp || {};
  global.QuizApp.csv = {
    parse: parse,
    stringify: stringify,
    detectDelimiter: detectDelimiter
  };
})(typeof window !== 'undefined' ? window : globalThis);