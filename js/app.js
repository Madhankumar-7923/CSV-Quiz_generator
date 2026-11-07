/*!
 * app.js - the UI layer: file intake, screen switching, rendering, results.
 *
 * Security note: every string that originates in the user's CSV is written with
 * textContent (or as a text node), never innerHTML. A CSV is untrusted input
 * and could easily contain markup.
 */
(function (global) {
  'use strict';

  var csv = global.QuizApp.csv;
  var validator = global.QuizApp.validate;
  var createQuiz = global.QuizApp.createQuiz;
  var samples = global.QuizApp.samples;

  var LETTERS = ['A', 'B', 'C', 'D'];
  var MAX_LISTED_ISSUES = 12;
  var DIAL_CIRCUMFERENCE = 2 * Math.PI * 52;

  var state = {
    quiz: null,
    questions: [],
    fileName: '',
    instantFeedback: false,
    lastResult: null
  };

  var el = {};

  function $(id) { return document.getElementById(id); }

  function cacheElements() {
    [
      'screen-upload', 'screen-quiz', 'screen-results',
      'dropZone', 'fileInput', 'btnSample', 'btnTemplate',
      'optShuffleQuestions', 'optShuffleOptions', 'optInstantFeedback',
      'report', 'reportTitle', 'reportSummary', 'reportList', 'reportMore', 'reportActions',
      'quizCounter', 'quizFile', 'progressBar', 'questionText', 'choices', 'feedback',
      'btnPrev', 'btnNext', 'btnQuit',
      'dialValue', 'scorePercent', 'scoreHeadline', 'scoreLine',
      'statCorrect', 'statWrong', 'statSkipped',
      'optOnlyWrong', 'review', 'reviewEmpty',
      'btnRetry', 'btnNewFile', 'btnExport'
    ].forEach(function (id) { el[id] = $(id); });
  }

  function setScreen(name) {
    el['screen-upload'].hidden = name !== 'upload';
    el['screen-quiz'].hidden = name !== 'quiz';
    el['screen-results'].hidden = name !== 'results';
    global.scrollTo(0, 0);
  }

  function node(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function downloadText(filename, text, mime) {
    var blob = new Blob([text], { type: (mime || 'text/csv') + ';charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    global.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : (many || one + 's'));
  }

  function handleFile(file) {
    if (!file) return;
    var name = file.name || 'quiz.csv';
    if (!/\.(csv|txt|tsv)$/i.test(name)) {
      showReport({ title: 'That does not look like a CSV file',
        summary: 'Got "' + name + '". Export your sheet as CSV and try again.',
        issues: [], questions: [] }); return;
    }
    if (file.size === 0) {
      showReport({ title: 'That file is empty',
        summary: 'There was nothing to read in "' + name + '".',
        issues: [], questions: [] }); return;
    }
    var reader = new FileReader();
    reader.onerror = function () {
      showReport({ title: 'Could not read that file',
        summary: 'The browser refused to read "' + name + '". Try re-saving it.',
        issues: [], questions: [] });
    };
    reader.onload = function () { loadCsvText(String(reader.result || ''), name); };
    reader.readAsText(file);
  }

  function loadCsvText(text, fileName) {
    var parsed;
    try { parsed = csv.parse(text); }
    catch (err) {
      showReport({ title: 'Could not parse that file',
        summary: 'Something broke the reader: ' + err.message,
        issues: [], questions: [] }); return;
    }
    var result = validator.validate(parsed);
    if (result.ok) { hideReport(); startQuiz(result.questions, fileName); return; }
    var issues = result.errors.concat(result.warnings);
    if (result.questions.length) {
      showReport({ title: plural(result.errors.length, 'row') + ' could not be used',
        summary: 'The rest of the sheet is fine. ' + plural(result.questions.length, 'question') + ' ready to play.',
        issues: issues, questions: result.questions, fileName: fileName, playable: true });
    } else {
      showReport({ title: 'This sheet cannot be played yet',
        summary: 'Fix the points below and upload it again.',
        issues: issues, questions: [] });
    }
  }

  function showReport(cfg) {
    el.reportTitle.textContent = cfg.title;
    el.reportSummary.textContent = cfg.summary || '';
    el.report.classList.toggle('report--playable', !!cfg.playable);
    el.reportList.textContent = '';
    var shown = (cfg.issues || []).slice(0, MAX_LISTED_ISSUES);
    shown.forEach(function (issue) {
      var li = node('li', 'report__item');
      li.appendChild(node('span', 'report__msg', issue.message));
      if (issue.preview) li.appendChild(node('span', 'report__preview', issue.preview));
      el.reportList.appendChild(li);
    });
    var hidden = (cfg.issues || []).length - shown.length;
    el.reportMore.hidden = hidden <= 0;
    if (hidden > 0) el.reportMore.textContent = 'and ' + plural(hidden, 'more issue') + ' not listed here.';
    el.reportActions.textContent = '';
    if (cfg.playable && cfg.questions && cfg.questions.length) {
      var btn = node('button', 'btn btn--primary',
        'Play the ' + plural(cfg.questions.length, 'good question') + ' anyway');
      btn.type = 'button';
      btn.addEventListener('click', function () { hideReport(); startQuiz(cfg.questions, cfg.fileName); });
      el.reportActions.appendChild(btn);
    }
    el.report.hidden = false;
    el.report.scrollIntoView({ block: 'nearest' });
  }

  function hideReport() {
    el.report.hidden = true;
    el.reportList.textContent = '';
    el.reportActions.textContent = '';
  }

  function startQuiz(questions, fileName) {
    state.questions = questions;
    state.fileName = fileName || state.fileName || 'quiz.csv';
    state.instantFeedback = el.optInstantFeedback.checked;
    state.quiz = createQuiz(questions, {
      shuffleQuestions: el.optShuffleQuestions.checked,
      shuffleOptions: el.optShuffleOptions.checked
    });
    el.quizFile.textContent = state.fileName;
    setScreen('quiz');
    renderQuestion({ focus: true });
  }

  function renderQuestion(opts) {
    opts = opts || {};
    var quiz = state.quiz;
    var q = quiz.current();
    if (!q) return;
    var number = quiz.index + 1;
    el.quizCounter.textContent = 'Question ' + number + ' of ' + quiz.total;
    el.progressBar.style.width = ((number / quiz.total) * 100) + '%';
    el.questionText.textContent = q.question;
    var selected = quiz.selected();
    var locked = state.instantFeedback && selected != null;
    el.choices.textContent = '';
    q.options.forEach(function (optionText, i) {
      var inputId = 'choice-' + i;
      var label = node('label', 'choice');
      label.setAttribute('for', inputId);
      var input = document.createElement('input');
      input.type = 'radio'; input.name = 'choice'; input.id = inputId;
      input.className = 'choice__input'; input.value = String(i);
      input.checked = selected === i; input.disabled = locked;
      input.addEventListener('change', function () { onSelect(i); });
      label.appendChild(input);
      label.appendChild(node('span', 'choice__letter', LETTERS[i]));
      label.appendChild(node('span', 'choice__text', optionText));
      if (selected === i) label.classList.add('choice--chosen');
      if (locked) {
        if (i === q.answerIndex) { label.classList.add('choice--correct'); label.appendChild(node('span', 'choice__tag', 'Correct answer')); }
        else if (i === selected) { label.classList.add('choice--wrong'); label.appendChild(node('span', 'choice__tag', 'Your answer')); }
      }
      el.choices.appendChild(label);
    });
    if (locked) {
      var right = selected === q.answerIndex;
      el.feedback.hidden = false;
      el.feedback.className = 'feedback ' + (right ? 'feedback--good' : 'feedback--bad');
      el.feedback.textContent = right ? 'Correct.'
        : 'Not quite. The answer is ' + LETTERS[q.answerIndex] + ': ' + q.options[q.answerIndex];
    } else {
      el.feedback.hidden = true; el.feedback.textContent = '';
    }
    el.btnPrev.disabled = !quiz.hasPrev();
    el.btnNext.textContent = quiz.hasNext() ? 'Next' : 'Finish';
    el.btnNext.classList.toggle('btn--finish', !quiz.hasNext());
    if (opts.focus) {
      var target = el.choices.querySelector('.choice__input:checked') ||
                   el.choices.querySelector('.choice__input');
      if (target && !target.disabled) target.focus();
    }
  }

  function onSelect(optionIndex) {
    if (!state.quiz) return;
    var alreadyLocked = state.instantFeedback && state.quiz.selected() != null;
    if (alreadyLocked) return;
    state.quiz.select(optionIndex);
    if (state.instantFeedback) {
      renderQuestion();
    } else {
      var labels = el.choices.querySelectorAll('.choice');
      for (var i = 0; i < labels.length; i++) labels[i].classList.toggle('choice--chosen', i === optionIndex);
    }
  }

  function goNext() {
    var quiz = state.quiz;
    if (!quiz) return;
    if (quiz.hasNext()) { quiz.next(); renderQuestion({ focus: true }); return; }
    var unanswered = quiz.unansweredCount();
    if (unanswered > 0) {
      var ok = global.confirm(plural(unanswered, 'question') + ' still unanswered. Unanswered questions count as wrong. Finish anyway?');
      if (!ok) return;
    }
    showResults(quiz.finish());
  }

  function goPrev() { if (state.quiz && state.quiz.prev()) renderQuestion({ focus: true }); }

  function quitQuiz() {
    if (!global.confirm('Leave this quiz? Your answers so far will be lost.')) return;
    state.quiz = null; setScreen('upload'); el.dropZone.focus();
  }

  function showResults(result) {
    state.lastResult = result;
    el.scorePercent.textContent = result.percent + '%';
    el.scoreLine.textContent = result.correct + ' out of ' + result.total + ' correct \u00b7 ' + formatTime(result.elapsedMs);
    el.scoreHeadline.textContent = headlineFor(result.percent);
    el.statCorrect.textContent = String(result.correct);
    el.statWrong.textContent = String(result.wrong);
    el.statSkipped.textContent = String(result.skipped);
    el.dialValue.style.strokeDasharray = DIAL_CIRCUMFERENCE + ' ' + DIAL_CIRCUMFERENCE;
    el.dialValue.style.strokeDashoffset = String(DIAL_CIRCUMFERENCE - (result.percent / 100) * DIAL_CIRCUMFERENCE);
    el.dialValue.setAttribute('data-band', bandFor(result.percent));
    renderReview();
    setScreen('results');
  }

  function headlineFor(percent) {
    if (percent === 100) return 'Flawless. Every single one.';
    if (percent >= 80) return 'Strong run.';
    if (percent >= 60) return 'Solid, with room to grow.';
    if (percent >= 40) return 'Halfway there.';
    if (percent > 0) return 'Rough one. Worth another go.';
    return 'No luck this time. Try again?';
  }

  function bandFor(percent) {
    if (percent >= 80) return 'high';
    if (percent >= 50) return 'mid';
    return 'low';
  }

  function formatTime(ms) {
    var total = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(total / 60), s = total % 60;
    if (m === 0) return s + 's';
    return m + 'm ' + (s < 10 ? '0' : '') + s + 's';
  }

  function renderReview() {
    var result = state.lastResult;
    if (!result) return;
    var onlyWrong = el.optOnlyWrong.checked;
    var items = result.review.filter(function (item) { return onlyWrong ? !item.correct : true; });
    el.review.textContent = '';
    el.reviewEmpty.hidden = items.length > 0;
    if (!items.length) return;
    items.forEach(function (item) {
      var li = node('li', 'review__item');
      li.classList.add(item.correct ? 'review__item--correct' : item.skipped ? 'review__item--skipped' : 'review__item--wrong');
      var head = node('div', 'review__head2');
      head.appendChild(node('span', 'review__num', 'Q' + item.number));
      head.appendChild(node('span', 'review__badge', item.correct ? 'Correct' : item.skipped ? 'Skipped' : 'Wrong'));
      li.appendChild(head);
      li.appendChild(node('p', 'review__question', item.question));
      var list = node('ul', 'review__options');
      item.options.forEach(function (optText, i) {
        var row = node('li', 'review__option');
        var isAnswer = i === item.answerIndex, isChosen = i === item.chosenIndex;
        if (isAnswer) row.classList.add('review__option--answer');
        if (isChosen && !isAnswer) row.classList.add('review__option--chosen');
        row.appendChild(node('span', 'review__optletter', LETTERS[i]));
        row.appendChild(node('span', 'review__opttext', optText));
        if (isAnswer) row.appendChild(node('span', 'review__note', 'Correct answer'));
        else if (isChosen) row.appendChild(node('span', 'review__note', 'You picked this'));
        list.appendChild(row);
      });
      li.appendChild(list);
      if (item.skipped) li.appendChild(node('p', 'review__skipnote', 'You did not answer this one.'));
      el.review.appendChild(li);
    });
  }

  function exportResults() {
    var result = state.lastResult;
    if (!result) return;
    var rows = [['#', 'Question', 'Your answer', 'Correct answer', 'Result']];
    result.review.forEach(function (item) {
      rows.push([item.number, item.question,
        item.chosenIndex == null ? '(not answered)' : LETTERS[item.chosenIndex] + '. ' + item.options[item.chosenIndex],
        LETTERS[item.answerIndex] + '. ' + item.options[item.answerIndex],
        item.correct ? 'Correct' : item.skipped ? 'Skipped' : 'Wrong']);
    });
    rows.push([]);
    rows.push(['Score', result.correct + '/' + result.total, result.percent + '%', 'Time', formatTime(result.elapsedMs)]);
    var base = state.fileName.replace(/\.(csv|txt|tsv)$/i, '') || 'quiz';
    downloadText(base + '-results.csv', csv.stringify(rows));
  }

  function bindEvents() {
    el.dropZone.addEventListener('click', function () { el.fileInput.click(); });
    el.dropZone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.fileInput.click(); }
    });
    el.fileInput.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      handleFile(file); e.target.value = '';
    });
    ['dragenter', 'dragover'].forEach(function (type) {
      el.dropZone.addEventListener(type, function (e) { e.preventDefault(); e.stopPropagation(); el.dropZone.classList.add('dropzone--over'); });
    });
    ['dragleave', 'drop'].forEach(function (type) {
      el.dropZone.addEventListener(type, function (e) {
        e.preventDefault(); e.stopPropagation();
        if (type === 'dragleave' && el.dropZone.contains(e.relatedTarget)) return;
        el.dropZone.classList.remove('dropzone--over');
      });
    });
    el.dropZone.addEventListener('drop', function (e) {
      var dt = e.dataTransfer;
      if (!dt) return;
      handleFile(dt.files && dt.files[0]);
    });
    ['dragover', 'drop'].forEach(function (type) {
      global.addEventListener(type, function (e) { if (!el.dropZone.contains(e.target)) e.preventDefault(); });
    });
    el.btnSample.addEventListener('click', function () { loadCsvText(samples.SAMPLE_CSV, 'sample-quiz.csv'); });
    el.btnTemplate.addEventListener('click', function () { downloadText('quiz-template.csv', samples.TEMPLATE_CSV); });
    el.btnNext.addEventListener('click', goNext);
    el.btnPrev.addEventListener('click', goPrev);
    el.btnQuit.addEventListener('click', quitQuiz);
    el.btnRetry.addEventListener('click', function () {
      if (!state.questions.length) { setScreen('upload'); return; }
      startQuiz(state.questions, state.fileName);
    });
    el.btnNewFile.addEventListener('click', function () { state.quiz = null; setScreen('upload'); el.dropZone.focus(); });
    el.btnExport.addEventListener('click', exportResults);
    el.optOnlyWrong.addEventListener('change', renderReview);
    document.addEventListener('keydown', function (e) {
      if (el['screen-quiz'].hidden || !state.quiz) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var tag = (e.target && e.target.tagName) || '';
      var typing = tag === 'INPUT' && e.target.type !== 'radio';
      if (typing || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key >= '1' && e.key <= '4') {
        var idx = parseInt(e.key, 10) - 1;
        var inputs = el.choices.querySelectorAll('.choice__input');
        if (inputs[idx] && !inputs[idx].disabled) { e.preventDefault(); inputs[idx].checked = true; onSelect(idx); }
        return;
      }
      if (e.key === 'Enter') { if (tag === 'BUTTON') return; e.preventDefault(); goNext(); return; }
      if (e.key === 'ArrowLeft' && tag !== 'INPUT') { e.preventDefault(); goPrev(); }
    });
  }

  function init() {
    cacheElements();
    var missing = Object.keys(el).filter(function (k) { return !el[k]; });
    if (missing.length) { global.console.error('CSV Quiz Generator: missing elements:', missing.join(', ')); return; }
    var fieldset = el.choices.closest('fieldset');
    if (fieldset) fieldset.setAttribute('aria-labelledby', 'questionText');
    bindEvents();
    setScreen('upload');
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})(typeof window !== 'undefined' ? window : globalThis);