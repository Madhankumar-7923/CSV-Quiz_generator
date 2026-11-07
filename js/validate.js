/*!
 * validate.js - turns raw CSV rows into quiz questions, or into useful errors.
 */
(function (global) {
  'use strict';

  var FIELDS = ['question', 'option1', 'option2', 'option3', 'option4', 'answer'];

  var ALIASES = {
    question: ['question', 'questiontext', 'questions', 'prompt', 'ques', 'q'],
    option1:  ['option1', 'optiona', 'choice1', 'choicea', 'opt1', 'opta', 'answer1', 'a'],
    option2:  ['option2', 'optionb', 'choice2', 'choiceb', 'opt2', 'optb', 'answer2', 'b'],
    option3:  ['option3', 'optionc', 'choice3', 'choicec', 'opt3', 'optc', 'answer3', 'c'],
    option4:  ['option4', 'optiond', 'choice4', 'choiced', 'opt4', 'optd', 'answer4', 'd'],
    answer:   ['answer', 'correctanswer', 'correct', 'correctoption', 'correctchoice',
               'answerkey', 'key', 'ans', 'solution']
  };

  var OPTION_FIELDS = ['option1', 'option2', 'option3', 'option4'];
  var LETTERS = ['A', 'B', 'C', 'D'];

  function normaliseHeader(h) {
    return String(h == null ? '' : h).toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function clean(v) {
    return String(v == null ? '' : v)
      .replace(/[^\S\n]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function mapHeader(header) {
    var normalised = (header || []).map(normaliseHeader);
    var claimed = {};
    var map = {};
    var missing = [];

    FIELDS.forEach(function (field) {
      var aliases = ALIASES[field];
      for (var a = 0; a < aliases.length; a++) {
        for (var j = 0; j < normalised.length; j++) {
          if (!claimed[j] && normalised[j] === aliases[a]) {
            map[field] = j;
            claimed[j] = true;
            return;
          }
        }
      }
      missing.push(field);
    });

    return { map: map, missing: missing, headers: header || [] };
  }

  function resolveAnswer(raw, options) {
    var value = clean(raw);
    if (value === '') return -1;

    var lower = value.toLowerCase();
    for (var i = 0; i < options.length; i++) {
      if (options[i].toLowerCase() === lower) return i;
    }

    var token = lower.replace(/[^a-z0-9]/g, '');
    var m = /^(?:option|opt|choice|answer)?([1-4a-d])$/.exec(token);
    if (m) {
      var ch = m[1];
      if (ch >= '1' && ch <= '4') return parseInt(ch, 10) - 1;
      return ch.charCodeAt(0) - 'a'.charCodeAt(0);
    }

    return -1;
  }

  function validate(parsed) {
    var rows = (parsed && parsed.rows) || [];
    var lines = (parsed && parsed.lines) || [];
    var errors = [];
    var warnings = [];
    var questions = [];
    var dataRows = 0;

    if (!rows.length) {
      errors.push({ line: null, message: 'The file is empty.' });
      return done(false);
    }

    var header = rows[0];
    var headerInfo = mapHeader(header);

    if (headerInfo.missing.length) {
      var pretty = headerInfo.missing.map(function (f) {
        return f === 'question' ? 'question'
          : f === 'answer' ? 'answer'
          : 'option ' + f.slice(-1);
      });
      errors.push({
        line: lines[0] || 1,
        message: 'Missing required column' + (pretty.length > 1 ? 's' : '') + ': ' +
                 pretty.join(', ') + '. Found instead: ' +
                 (header.filter(function (h) { return clean(h) !== ''; }).join(', ') || '(nothing)') + '.'
      });
      return done(false);
    }

    var map = headerInfo.map;
    var expectedCells = header.length;
    var widthWarned = false;

    for (var r = 1; r < rows.length; r++) {
      var row = rows[r];
      var line = lines[r] || (r + 1);

      var hasContent = row.some(function (cell) { return clean(cell) !== ''; });
      if (!hasContent) continue;

      dataRows++;

      if (row.length > expectedCells && !widthWarned) {
        warnings.push({
          line: line,
          message: 'Some rows have more columns than the header. The extra columns are ignored.'
        });
        widthWarned = true;
      }

      var get = function (field) {
        var idx = map[field];
        return clean(idx < row.length ? row[idx] : '');
      };

      var questionText = get('question');
      var options = OPTION_FIELDS.map(get);
      var rawAnswer = get('answer');
      var rowErrors = [];

      if (questionText === '') rowErrors.push('the question is blank');

      var emptyOptions = [];
      options.forEach(function (opt, i) {
        if (opt === '') emptyOptions.push(i + 1);
      });
      if (emptyOptions.length) {
        rowErrors.push(
          (emptyOptions.length === 1 ? 'option ' : 'options ') + emptyOptions.join(', ') +
          ' ' + (emptyOptions.length === 1 ? 'is' : 'are') + ' blank'
        );
      }

      if (!emptyOptions.length) {
        var seen = {};
        var dupes = [];
        options.forEach(function (opt) {
          var k = opt.toLowerCase();
          if (seen[k]) { if (dupes.indexOf(opt) === -1) dupes.push(opt); }
          seen[k] = true;
        });
        if (dupes.length) {
          rowErrors.push('duplicate option' + (dupes.length > 1 ? 's' : '') + ': ' +
                         dupes.map(function (d) { return '"' + d + '"'; }).join(', '));
        }
      }

      var answerIndex = -1;
      if (rawAnswer === '') {
        rowErrors.push('the answer is blank');
      } else if (!emptyOptions.length) {
        answerIndex = resolveAnswer(rawAnswer, options);
        if (answerIndex === -1) {
          rowErrors.push('the answer "' + rawAnswer + '" does not match any option ' +
                         '(use 1-4, A-D, or the exact option text)');
        }
      }

      if (rowErrors.length) {
        errors.push({
          line: line,
          message: 'Line ' + line + ': ' + rowErrors.join('; ') + '.',
          preview: questionText ? truncate(questionText, 70) : ''
        });
        continue;
      }

      questions.push({
        id: 'q' + questions.length,
        line: line,
        question: questionText,
        options: options,
        answerIndex: answerIndex
      });
    }

    if (!questions.length && !errors.length) {
      errors.push({ line: null, message: 'No question rows found below the header row.' });
    }

    return done(questions.length > 0 && errors.length === 0);

    function done(ok) {
      return {
        ok: ok,
        questions: questions,
        errors: errors,
        warnings: warnings,
        totalRows: dataRows,
        headers: (parsed && parsed.rows && parsed.rows[0]) || [],
        delimiter: (parsed && parsed.delimiter) || ','
      };
    }
  }

  function truncate(s, n) {
    s = String(s);
    return s.length > n ? s.slice(0, n - 1) + '\u2026' : s;
  }

  global.QuizApp = global.QuizApp || {};
  global.QuizApp.validate = {
    validate: validate,
    mapHeader: mapHeader,
    resolveAnswer: resolveAnswer,
    normaliseHeader: normaliseHeader,
    LETTERS: LETTERS,
    FIELDS: FIELDS
  };
})(typeof window !== 'undefined' ? window : globalThis);