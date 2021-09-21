const _ = require('underscore');

const NO_LMP_DATE_MODIFIER = 4;

module.exports = function(settings) {
  const taskSchedules = settings && settings.tasks && settings.tasks.schedules;
  const lib = {
    /**
     * @function
     * In legacy versions, partner code is required to only emit tasks which are ready to be displayed to the user. Utils.isTimely is the mechanism used for this.
     * With the rules-engine improvements in webapp 3.8, this responsibility shifts. Partner code should emit all tasks and the webapp's rules-engine decides what to display.
     * To this end - Utils.isTimely becomes a pass-through in nootils@4.x
     * @returns True
    */
    isTimely: () => true,

    addDate: function(date, days) {
      let result;
      if (date) {
        result = new Date(date.getTime());
      } else {
        result = lib.now();
      }
      result.setDate(result.getDate() + days);
      result.setHours(0, 0, 0, 0);
      return result;
    },

    getLmpDate: function(doc) {
      const weeks = doc.fields.last_menstrual_period || NO_LMP_DATE_MODIFIER;
      return lib.addDate(new Date(doc.reported_date), weeks * -7);
    },

    // TODO getSchedule() can be removed when tasks.json support is dropped
    getSchedule: function(name) {
      return _.findWhere(taskSchedules, { name: name });
    },

    getMostRecentTimestamp: function(reports, form, fields) {
      const report = lib.getMostRecentReport(reports, form, fields);
      return report && report.reported_date;
    },

    getMostRecentReport: function(reports, forms, fields) {
      if (!Array.isArray(forms)) return lib.getMostRecentReport(reports, [forms], fields);
      let result = null;
      reports.forEach(function(report) {
        if (forms.includes(report.form) &&
           !report.deleted &&
           (!result || (report.reported_date > result.reported_date)) &&
           (!fields || (report.fields && lib.fieldsMatch(report, fields)))) {
          result = report;
        }
      });
      return result;
    },

    isFormSubmittedInWindow: function(reports, form, start, end, count) {
      let result = false;
      reports.forEach(function(report) {
        if (!result && report.form === form) {
          if (report.reported_date >= start && report.reported_date <= end) {
            if (!count ||
               (count && report.fields && report.fields.follow_up_count > count)) {
              result = true;
            }
          }
        }
      });
      return result;
    },

    isFirstReportNewer: function(firstReport, secondReport) {
      if (firstReport && firstReport.reported_date) {
        if (secondReport && secondReport.reported_date) {
          return firstReport.reported_date > secondReport.reported_date;
        }
        return true;
      }
      return null;
    },

    isDateValid: function(date) {
      return !isNaN(date.getTime());
    },

    /**
     * @function
     * @name getField
     *
     * Gets the value of specified field path.
     * @param {Object} report - The report object.
     * @param {string} field - Period separated json path assuming report.fields as
     *      the root node e.g 'dob' (equivalent to report.fields.dob)
     *      or 'screening.test_result' equivalent to report.fields.screening.test_result
    */
    getField: function(report, field) {
      return _.propertyOf(report.fields)(field.split('.'));
    },

    fieldsMatch: function(report, fieldValues) {
      return Object.keys(fieldValues).every(function(field) {
          return lib.getField(report, field) === fieldValues[field];
      });
    },

    MS_IN_DAY: 24*60*60*1000, // 1 day in ms

    now: function() { return new Date(); },
  };

  return lib;
};
