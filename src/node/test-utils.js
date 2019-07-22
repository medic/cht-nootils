var fs = require('fs');
var _ = require('underscore');
var assert = require('chai').assert;
var Nools = require('nools');
var nootils = require('../web/nootils');
const compileNoolsRules = require('@kennsippell/medic-conf/src/lib/compile-nools-rules');

function traverse(keys, element) {
  keys = keys.slice(0);
  var key = keys.shift();
  if(!key || typeof element === 'undefined') return element;
  if(key === '*') {
    return _.map(element, function(e) { return traverse(keys, e); });
  }
  return traverse(keys, element[key]);
}

NoolsTest = module.exports = (function() {
  async function parseRules(projectDir, scheduleFilePath, additionalScope) {
    const settings = { tasks: {} };

    if(arguments.length === 2) {
      // no scheduleFilePath (tasks.json) provided - this means that the project
      // doesn't use them.
      additionalScope = scheduleFilePath;
      scheduleFilePath = null;
    }

    if(scheduleFilePath) {
      const rawSchedules = readFile(scheduleFilePath);
      settings.tasks.schedules = JSON.parse(rawSchedules);
    }

    var Utils = nootils(settings);
    var scope = Object.assign({}, additionalScope, { Utils:Utils });

    const rawRules = await compileNoolsRules(projectDir);

    var flow = Nools.compile(rawRules, { name:'test', scope:scope });
    var session = flow.getSession();

    session.emitTasks = () => {
      var actualEmits = [];

      session.on('task', t => actualEmits.push(t));

      return session.match()
        .then(() => actualEmits);
    };

    session.emitTargets = () => {
      var actualEmits = [];

      session.on('target', t => actualEmits.push(t));

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

  return { parseRules };
}());

function readFile(path) {
  return fs.readFileSync(path, { encoding:'utf-8' });
}
