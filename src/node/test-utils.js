var fs = require('fs');
var _ = require('underscore');
var assert = require('chai').assert;
var Nools = require('nools');
var nootils = require('../web/nootils');
const path = require('path');

function traverse(keys, element) {
  var keys = keys.slice(0);
  var key = keys.shift();
  if(!key || typeof element === 'undefined') return element;
  if(key === '*') {
    return _.map(element, function(e) { return traverse(keys, e); });
  }
  return traverse(keys, element[key]);
}

NoolsTest = module.exports = (function() {
  function parseRules(rulesetFilePath, scheduleFilePath, additionalScope) {
    var rawSchedules = readFile(scheduleFilePath);
    var schedules = JSON.parse(rawSchedules);
    var settings = { tasks: { schedules: schedules } };
    var Utils = nootils(settings);
    var scope = Object.assign({}, additionalScope, { Utils:Utils });

    const projectDir = path.dirname(rulesetFilePath);
    var rawRules = readFile(rulesetFilePath)
        .replace(/___TEMPLATE:([^_]*)___/g, (_, filename) =>
            readFile(`${projectDir}/${filename}`));

    var flow = Nools.compile(rawRules, { name:'test', scope:scope });
    var session = flow.getSession();

    session.emitTasks = () => {
      var actualEmits = [];

      session.on('task', t => actualEmits.push(t));

      return session.match()
        .then(() => actualEmits);
    };

    session.expectEmits = (key, ...expectedEmits) => {
      if(typeof key !== 'string') {
        expectedEmits.unshift(key);
        key = '*';
      }
      if(key === '*') expectedEmits = expectedEmits[0];

      var actualEmits = [];

      var keys = key ? key.split('.') : null;
      session.on('task', (task) => actualEmits.push(traverse(keys, task)));

      return session.match()
        .then(() => assert.deepEqual(actualEmits, expectedEmits));
    };

    return { flow:flow, session:session, utils:Utils };
  }

  return {
    parseRules: parseRules,
  };
}());

function readFile(path) {
  return fs.readFileSync(path, { encoding:'utf-8' });
}
