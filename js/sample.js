/*!
 * sample.js - demo data and the downloadable template, embedded as strings.
 */
(function (global) {
  'use strict';

  var SAMPLE_CSV = [
    'question,option1,option2,option3,option4,answer',
    '"Which planet is known as the Red Planet?",Venus,Mars,Jupiter,Mercury,2',
    '"What is the capital of Japan?",Osaka,Kyoto,Tokyo,Nagoya,Tokyo',
    '"How many continents are there on Earth?",5,6,7,8,C',
    '"Which language runs natively in a web browser?",Python,Java,JavaScript,C++,3',
    '"What does CSV stand for?","Comma Separated Values","Common Shared Values","Clustered Sorted Values","Column String Values",A',
    '"Which element has the chemical symbol O?",Gold,Oxygen,Osmium,Iron,Oxygen',
    '"In what year did the first human land on the Moon?",1965,1969,1972,1959,2',
    '"Which data structure works first in, first out?",Stack,Queue,Tree,Graph,B',
    '"What is 15 percent of 200?",15,20,30,45,30',
    '"Which ocean is the largest by surface area?",Atlantic,Indian,Arctic,Pacific,4'
  ].join('\r\n');

  var TEMPLATE_CSV = [
    'question,option1,option2,option3,option4,answer',
    '"Replace this with your first question",First option,Second option,Third option,Fourth option,1',
    '"The answer column takes 1-4, A-D, or the exact option text",Alpha,Bravo,Charlie,Delta,B',
    '"Wrap a field in double quotes if it contains a comma, like this one",Yes,No,Maybe,Sometimes,Yes'
  ].join('\r\n');

  global.QuizApp = global.QuizApp || {};
  global.QuizApp.samples = {
    SAMPLE_CSV: SAMPLE_CSV,
    TEMPLATE_CSV: TEMPLATE_CSV
  };
})(typeof window !== 'undefined' ? window : globalThis);