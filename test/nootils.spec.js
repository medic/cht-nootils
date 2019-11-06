var nootils = require('../src/web/nootils')({});

const format = function(date) {
  const result = date.toString();
  // strip off the TZ info at the end so tests will pass wherever they're run
  return result.substr(0, 24);
};

exports['addDate adds days to the date'] = function(test) {
  const date = new Date(2017, 0, 1);
  const actual = nootils.addDate(date, 2);
  test.equal(format(actual), 'Tue Jan 03 2017 00:00:00');
  test.done();
};

exports['addDate date defaults to now'] = function(test) {
  const actual = nootils.addDate(null, 2);
  const expected = new Date();
  expected.setDate(expected.getDate() + 2);
  test.equal(actual.getDate(), expected.getDate());
  test.done();
};

exports['addDate returns the start of the day'] = function(test) {
  const date = new Date(2017, 0, 1, 16, 32, 12, 555);
  const actual = nootils.addDate(date, 4);
  test.equal(format(actual), 'Thu Jan 05 2017 00:00:00');
  test.done();
};

exports['getLmpDate subtracts given weeks off reported date'] = function(test) {
  const date = new Date(2017, 0, 30);
  const doc = {
    reported_date: date.valueOf(),
    fields: { last_menstrual_period: 3 }
  };
  const actual = nootils.getLmpDate(doc);
  test.equal(format(actual), 'Mon Jan 09 2017 00:00:00');
  test.done();
};

exports['getLmpDate defaults to 4 weeks'] = function(test) {
  const date = new Date(2017, 0, 30);
  const doc = {
    reported_date: date.valueOf(),
    fields: { }
  };
  const actual = nootils.getLmpDate(doc);
  test.equal(format(actual), 'Mon Jan 02 2017 00:00:00');
  test.done();
};

exports['getLmpDate returns the start of the day'] = function(test) {
  const date = new Date(2017, 0, 30, 16, 32, 12, 555);
  const doc = {
    reported_date: date.valueOf(),
    fields: { last_menstrual_period: 3 }
  };
  const actual = nootils.getLmpDate(doc);
  test.equal(format(actual), 'Mon Jan 09 2017 00:00:00');
  test.done();
};

exports['isTimely returns true'] = function(test) {
  const actual = nootils.isTimely();
  test.equal(actual, true);
  test.done();
};

exports['getMostRecentReport returns null on no reports'] = function(test) {
  const actual = nootils.getMostRecentReport([], 'V');
  test.equal(actual, null);
  test.done();
};

exports['getMostRecentReport returns null on no matching report'] = function(test) {
  const reports = [
    { form: 'H', reported_date: 1 }
  ];
  const actual = nootils.getMostRecentReport(reports, 'V');
  test.equal(actual, null);
  test.done();
};

exports['getMostRecentReport returns report when only one match'] = function(test) {
  const reports = [
    { _id: 1, form: 'H', reported_date: 1 },
    { _id: 2, form: 'V', reported_date: 2 }
  ];
  const actual = nootils.getMostRecentReport(reports, 'V');
  test.equal(actual._id, 2);
  test.done();
};

exports['getMostRecentReport returns most recent matching report'] = function(test) {
  const reports = [
    { _id: 1, form: 'H', reported_date: 1 },
    { _id: 2, form: 'V', reported_date: 2 },
    { _id: 3, form: 'V', reported_date: 3 }
  ];
  const actual = nootils.getMostRecentReport(reports, 'V');
  test.equal(actual._id, 3);
  test.done();
};

exports['getMostRecentReport ignores deleted reports'] = function(test) {
  const reports = [
    { _id: 1, form: 'H', reported_date: 1 },
    { _id: 2, form: 'V', reported_date: 2, deleted: true }
  ];
  const actual = nootils.getMostRecentReport(reports, 'V');
  test.equal(actual, null);
  test.done();
};

exports['getMostRecentReport returns report matching field'] = function(test) {
  const reports = [
    { _id: 1, form: 'H', reported_date: 1 },
    { _id: 2, form: 'V', reported_date: 2, fields: { dob: '2000-01-01', screening: { malaria: false } }},
    { _id: 3, form: 'V', reported_date: 3 }
  ];
  const actual = nootils.getMostRecentReport(reports, 'V', { 'screening.malaria': false });
  test.equal(actual._id, 2);
  test.done();
};

exports['getMostRecentReport returns report matching multiple fields'] = function(test) {
  const reports = [
    { _id: 1, form: 'H', reported_date: 1 },
    { _id: 2, form: 'V', reported_date: 2, fields: { dob: '2000-01-01', screening: { malaria: false } }},
    { _id: 3, form: 'V', reported_date: 3 }
  ];
  const actual = nootils.getMostRecentReport(reports, 'V', { 'screening.malaria': false, dob: '2000-01-01' });
  test.equal(actual._id, 2);
  test.done();
};

exports['getMostRecentReport returns null if one of multiple fields does not match'] = function(test) {
  const reports = [
    { _id: 1, form: 'H', reported_date: 1 },
    { _id: 2, form: 'V', reported_date: 2, fields: { dob: '2000-01-01', screening: { malaria: false } }},
    { _id: 3, form: 'V', reported_date: 3 }
  ];
  const actual = nootils.getMostRecentReport(reports, 'V', { 'screening.malaria': false, dob: '2000-01-02' });
  test.equal(actual, null);
  test.done();
};

exports['getMostRecentReport returns null if no matching fields'] = function(test) {
  const reports = [
    { _id: 1, form: 'H', reported_date: 1 },
    { _id: 2, form: 'V', reported_date: 2, fields: { dob: '2000-01-01', screening: { malaria: false} }},
    { _id: 3, form: 'V', reported_date: 3 }
  ];
  const actual = nootils.getMostRecentReport(reports, 'V', { dob: '2000-01-02' });
  test.equal(actual, null);
  test.done();
};

exports['getField returns undefined if no matching fields'] = function(test) {
  const report = { _id: 1, form: 'H', reported_date: 1 };
  const actual = nootils.getField(report, 'age');
  test.equal(actual, undefined);
  test.done();
};

exports['getField returns value field'] = function(test) {
  const report = { _id: 1, form: 'H', reported_date: 1, fields: {age: 23} };
  const actual = nootils.getField(report, 'age');
  test.equal(actual, 23);
  test.done();
};

exports['getField returns value for a nested field'] = function(test) {
  const report = { _id: 1, form: 'H', reported_date: 1, fields: {personal_details: {age: 23}} };
  const actual = nootils.getField(report, 'personal_details.age');
  test.equal(actual, 23);
  test.done();
};

exports['getField returns undefined if for a missing nested field'] = function(test) {
  const report = { _id: 1, form: 'H', reported_date: 1, fields: {personal_details: {age: 23}} };
  const actual = nootils.getField(report, 'personal_details.height');
  test.equal(actual, undefined);
  test.done();
};

exports['fieldsMatch returns true if provided field values match report values'] = function(test) {
  const report = { _id: 1, form: 'H', reported_date: 1, fields: {name: 'Eric', personal_details: {age: 23}} };
  const actual = nootils.fieldsMatch(report, {'personal_details.age': 23, name: 'Eric'});
  test.equal(actual, true);
  test.done();
};

exports['fieldsMatch returns false if field value does not match report'] = function(test) {
  const report = { _id: 1, form: 'H', reported_date: 1, fields: {name: 'Eric', personal_details: {age: 22}} };
  const actual = nootils.fieldsMatch(report, {'personal_details.age': 23, name: 'Eric'});
  test.equal(actual, false);
  test.done();
};

exports['fieldsMatch returns false if field specified does not exist in report'] = function(test) {
  const report = { _id: 1, form: 'H', reported_date: 1, fields: {personal_details: {age: 23}} };
  const actual = nootils.fieldsMatch(report, {'personal_details.height': 5});
  test.equal(actual, false);
  test.done();
};
