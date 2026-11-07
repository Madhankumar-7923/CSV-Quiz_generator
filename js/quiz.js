/*!
 * quiz.js - quiz state, kept free of any DOM knowledge.
 */
(function (global) {
  'use strict';

  function shuffled(list) {
    var out = list.slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  function shuffleOptions(question) {
    var pairs = question.options.map(function (text, i) {
      return { text: text, wasCorrect: i === question.answerIndex };
    });
    var mixed = shuffled(pairs);
    var answerIndex = 0;
    for (var i = 0; i < mixed.length; i++) {
      if (mixed[i].wasCorrect) { answerIndex = i; break; }
    }
    return {
      id: question.id,
      line: question.line,
      question: question.question,
      options: mixed.map(function (p) { return p.text; }),
      answerIndex: answerIndex
    };
  }

  function createQuiz(questions, opts) {
    opts = opts || {};

    var prepared = (questions || []).map(function (q) {
      return opts.shuffleOptions ? shuffleOptions(q) : {
        id: q.id, line: q.line, question: q.question,
        options: q.options.slice(), answerIndex: q.answerIndex
      };
    });
    if (opts.shuffleQuestions) prepared = shuffled(prepared);

    var answers = new Array(prepared.length);
    for (var i = 0; i < answers.length; i++) answers[i] = null;

    var index = 0;
    var startedAt = Date.now();
    var finishedAt = null;

    var api = {
      get total() { return prepared.length; },
      get index() { return index; },
      get questions() { return prepared; },

      current: function () { return prepared[index] || null; },
      selected: function () { var v = answers[index]; return v === undefined ? null : v; },
      selectedAt: function (i) { var v = answers[i]; return v === undefined ? null : v; },

      select: function (optionIndex) {
        if (optionIndex < 0 || optionIndex > 3) return false;
        if (!prepared[index]) return false;
        answers[index] = optionIndex;
        return true;
      },

      isCorrectAt: function (i) {
        var chosen = answers[i];
        return chosen != null && prepared[i] && chosen === prepared[i].answerIndex;
      },

      hasPrev: function () { return index > 0; },
      hasNext: function () { return index < prepared.length - 1; },
      next: function () { if (index < prepared.length - 1) { index++; return true; } return false; },
      prev: function () { if (index > 0) { index--; return true; } return false; },
      goTo: function (i) { if (i >= 0 && i < prepared.length) { index = i; return true; } return false; },

      answeredCount: function () { return answers.filter(function (a) { return a != null; }).length; },
      unansweredCount: function () { return prepared.length - api.answeredCount(); },
      allAnswered: function () { return api.unansweredCount() === 0; },

      finish: function () { finishedAt = Date.now(); return api.result(); },

      result: function () {
        var correct = 0, wrong = 0, skipped = 0;
        var review = prepared.map(function (q, i) {
          var chosen = answers[i];
          var isSkipped = chosen == null;
          var isCorrect = !isSkipped && chosen === q.answerIndex;
          if (isSkipped) skipped++;
          else if (isCorrect) correct++;
          else wrong++;
          return {
            number: i + 1, line: q.line, question: q.question,
            options: q.options.slice(), answerIndex: q.answerIndex,
            chosenIndex: isSkipped ? null : chosen,
            correct: isCorrect, skipped: isSkipped
          };
        });
        var total = prepared.length;
        return {
          total: total, correct: correct, wrong: wrong, skipped: skipped,
          percent: total ? Math.round((correct / total) * 100) : 0,
          elapsedMs: (finishedAt || Date.now()) - startedAt,
          review: review
        };
      },

      reset: function () {
        for (var i = 0; i < answers.length; i++) answers[i] = null;
        index = 0; startedAt = Date.now(); finishedAt = null;
      }
    };

    return api;
  }

  global.QuizApp = global.QuizApp || {};
  global.QuizApp.createQuiz = createQuiz;
  global.QuizApp.shuffled = shuffled;
})(typeof window !== 'undefined' ? window : globalThis);