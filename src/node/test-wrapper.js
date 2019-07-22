/**
 * TODO this should be moved into Nootils so that all projects can easily use it
 *
 * Simple setup of nootils for mocha tests.
 */
const nools = require('nools');
const parseRules = require('./test-utils').parseRules;

const BASE_DATE = 1469358731456;

module.exports = async function(a, b) {
  let scheduleFilePath, additionalScope;
  if(arguments.length === 1) {
    additionalScope = a;
  } else {
    scheduleFilePath = a;
    additionalScope = b;
  }

  let overridden, flow;

  const self = {};
  const asserted = [];

  const projectDir = path.resolve('.');
  const rules = await parseRules(projectDir, scheduleFilePath, additionalScope);

  // ensure that all tests are run in reference to a specific date
  rules.utils.now = function() { return new Date(BASE_DATE); };

  flow = rules.flow;
  self.session = rules.session;

  overridden = self.session.assert;
  overridden.bind(self.session);
  self.session.assert = fact => {
    asserted.push(fact);
    overridden(fact);
  };

  self.Contact = flow.getDefined('Contact');

  self.afterEach = () => {
    asserted.forEach(oldFact => {
      self.session.retract(oldFact);
    });
    asserted.length = 0;
  };

  self.after = () => {
    nools.deleteFlow('test');
  };

  return self;
};

module.exports.BASE_DATE = BASE_DATE;
