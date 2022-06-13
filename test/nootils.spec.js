const { expect } = require('chai');
const nootils = require('../src/nootils')({});

const format = function(date) {
  const result = date.toString();
  // strip off the TZ info at the end so tests will pass wherever they're run
  return result.substr(0, 24);
};

describe('Utils', () => {
  describe('addDate', () => {
    it('addDate adds days to the date', () => {
      const date = new Date(2017, 0, 1);
      const actual = nootils.addDate(date, 2);
      expect(format(actual)).to.eq('Tue Jan 03 2017 00:00:00');
    });

    it('addDate date defaults to now', () => {
      const actual = nootils.addDate(null, 2);
      const expected = new Date();
      expected.setDate(expected.getDate() + 2);
      expect(actual.getDate()).to.eq(expected.getDate());
    });

    it('addDate returns the start of the day', () => {
      const date = new Date(2017, 0, 1, 16, 32, 12, 555);
      const actual = nootils.addDate(date, 4);
      expect(format(actual)).to.eq('Thu Jan 05 2017 00:00:00');
    });
  });

  describe('getLmpDate', () => {
    it('subtracts given weeks off reported date', () => {
      const date = new Date(2017, 0, 30);
      const doc = {
        reported_date: date.valueOf(),
        fields: { last_menstrual_period: 3 }
      };
      const actual = nootils.getLmpDate(doc);
      expect(format(actual)).to.eq('Mon Jan 09 2017 00:00:00');
    });

    it('defaults to 4 weeks', () => {
      const date = new Date(2017, 0, 30);
      const doc = {
        reported_date: date.valueOf(),
        fields: { }
      };
      const actual = nootils.getLmpDate(doc);
      expect(format(actual)).to.eq('Mon Jan 02 2017 00:00:00');
    });

    it('returns the start of the day', () => {
      const date = new Date(2017, 0, 30, 16, 32, 12, 555);
      const doc = {
        reported_date: date.valueOf(),
        fields: { last_menstrual_period: 3 }
      };
      const actual = nootils.getLmpDate(doc);
      expect(format(actual)).to.eq('Mon Jan 09 2017 00:00:00');
    });
  });

  it('isTimely returns true', () => {
    const actual = nootils.isTimely();
    expect(actual).to.eq(true);
  });

  describe('getMostRecentReport', () => {
    it('returns null on no reports', () => {
      const actual = nootils.getMostRecentReport([], 'V');
      expect(actual).to.eq(null);
    });

    it('returns null on no matching report', () => {
      const reports = [
        { form: 'H', reported_date: 1 }
      ];
      const actual = nootils.getMostRecentReport(reports, 'V');
      expect(actual).to.eq(null);
    });

    it('returns report when only one match', () => {
      const reports = [
        { _id: 1, form: 'H', reported_date: 1 },
        { _id: 2, form: 'V', reported_date: 2 }
      ];
      const actual = nootils.getMostRecentReport(reports, 'V');
      expect(actual._id).to.eq(2);
    });

    it('returns most recent matching report', () => {
      const reports = [
        { _id: 1, form: 'H', reported_date: 1 },
        { _id: 2, form: 'V', reported_date: 2 },
        { _id: 3, form: 'V', reported_date: 3 }
      ];
      const actual = nootils.getMostRecentReport(reports, 'V');
      expect(actual._id).to.eq(3);
    });

    it('returns most recent matching report from multiple forms', () => {
      const reports = [
        { _id: 6, form: 'B', reported_date: 9 },
        { _id: 3, form: 'V', reported_date: 3 },
        { _id: 4, form: 'H', reported_date: 4 },
        { _id: 2, form: 'V', reported_date: 2 },
        { _id: 5, form: 'A', reported_date: 6 },
        { _id: 1, form: 'H', reported_date: 1 },
        { _id: 7, form: 'C', reported_date: 12 },
      ];
      const actual = nootils.getMostRecentReport(reports, ['H', 'V']);
      expect(actual._id).to.eq(4);
    });

    it('ignores deleted reports', () => {
      const reports = [
        { _id: 1, form: 'H', reported_date: 1 },
        { _id: 2, form: 'V', reported_date: 2, deleted: true }
      ];
      const actual = nootils.getMostRecentReport(reports, 'V');
      expect(actual).to.eq(null);
    });

    it('returns report matching field', () => {
      const reports = [
        { _id: 1, form: 'H', reported_date: 1 },
        { _id: 2, form: 'V', reported_date: 2, fields: { dob: '2000-01-01', screening: { malaria: false } }},
        { _id: 3, form: 'V', reported_date: 3 }
      ];
      const actual = nootils.getMostRecentReport(reports, 'V', { 'screening.malaria': false });
      expect(actual._id).to.eq(2);
    });

    it('returns report matching multiple fields', () => {
      const reports = [
        { _id: 1, form: 'H', reported_date: 1 },
        { _id: 2, form: 'V', reported_date: 2, fields: { dob: '2000-01-01', screening: { malaria: false } }},
        { _id: 3, form: 'V', reported_date: 3 }
      ];
      const actual = nootils.getMostRecentReport(reports, 'V', { 'screening.malaria': false, dob: '2000-01-01' });
      expect(actual._id).to.eq(2);
    });

    it('returns null if one of multiple fields does not match', () => {
      const reports = [
        { _id: 1, form: 'H', reported_date: 1 },
        { _id: 2, form: 'V', reported_date: 2, fields: { dob: '2000-01-01', screening: { malaria: false } }},
        { _id: 3, form: 'V', reported_date: 3 }
      ];
      const actual = nootils.getMostRecentReport(reports, 'V', { 'screening.malaria': false, dob: '2000-01-02' });
      expect(actual).to.eq(null);
    });

    it('returns null if no matching fields', () => {
      const reports = [
        { _id: 1, form: 'H', reported_date: 1 },
        { _id: 2, form: 'V', reported_date: 2, fields: { dob: '2000-01-01', screening: { malaria: false} }},
        { _id: 3, form: 'V', reported_date: 3 }
      ];
      const actual = nootils.getMostRecentReport(reports, 'V', { dob: '2000-01-02' });
      expect(actual).to.eq(null);
    });
  });

  describe('getField', () => {
    it('returns undefined if no matching fields', () => {
      const report = { _id: 1, form: 'H', reported_date: 1 };
      const actual = nootils.getField(report, 'age');
      expect(actual).to.eq(undefined);
    });

    it('returns value field', () => {
      const report = { _id: 1, form: 'H', reported_date: 1, fields: {age: 23} };
      const actual = nootils.getField(report, 'age');
      expect(actual).to.eq(23);
    });

    it('returns value for a nested field', () => {
      const report = { _id: 1, form: 'H', reported_date: 1, fields: {personal_details: {age: 23}} };
      const actual = nootils.getField(report, 'personal_details.age');
      expect(actual).to.eq(23);
    });

    it('returns undefined if for a missing nested field', () => {
      const report = { _id: 1, form: 'H', reported_date: 1, fields: {personal_details: {age: 23}} };
      const actual = nootils.getField(report, 'personal_details.height');
      expect(actual).to.eq(undefined);
    });
  });

  describe('fieldsMatch', () => {
    it('fieldsMatch returns true if provided field values match report values', () => {
      const report = { _id: 1, form: 'H', reported_date: 1, fields: {name: 'Eric', personal_details: {age: 23}} };
      const actual = nootils.fieldsMatch(report, {'personal_details.age': 23, name: 'Eric'});
      expect(actual).to.eq(true);
    });

    it('fieldsMatch returns false if field value does not match report', () => {
      const report = { _id: 1, form: 'H', reported_date: 1, fields: {name: 'Eric', personal_details: {age: 22}} };
      const actual = nootils.fieldsMatch(report, {'personal_details.age': 23, name: 'Eric'});
      expect(actual).to.eq(false);
    });

    it('fieldsMatch returns false if field specified does not exist in report', () => {
      const report = { _id: 1, form: 'H', reported_date: 1, fields: {personal_details: {age: 23}} };
      const actual = nootils.fieldsMatch(report, {'personal_details.height': 5});
      expect(actual).to.eq(false);
    });
  });

  describe('isFormSubmittedInWindow', () => {
    it('returns false if no matching report in window', () => {
      const reports = [
        { form: 'A', reported_date: 1 }
      ];
      const actual = nootils.isFormSubmittedInWindow(reports, 'A', 2, 3);
      expect(actual).to.eq(false);
    });

    it('returns true if there are matching reports in window', () => {
      const reports = [
        { form: 'A', reported_date: 1 },
        { form: 'A', reported_date: 1 },
        { form: 'B', reported_date: 1 },
        { form: 'C', reported_date: 1 }
      ];
      const actual = nootils.isFormSubmittedInWindow(reports, ['A', 'B'], 1, 3);
      expect(actual).to.eq(true);
    });
  });
});
