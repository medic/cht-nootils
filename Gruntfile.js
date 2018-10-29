module.exports = function(grunt) {

  'use strict';

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);
  // Project configuration
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: true,
        reporter: require('jshint-stylish'),
      },
      web: [
        'src/web/*.js',
      ],
      other: [
        'package.json',
        'Gruntfile.js',
        'node/*.js',
        'src/test/*.js',
      ]
    },
    nodeunit: {
      all: ['test/*.js']
    },
    timezones: {
      // see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
      GMT: 'GMT',
      Kirimati: 'Etc/GMT-14',
      Howland_Baker: 'Etc/GMT+12',
    }
  });

  grunt.registerTask('test', [
    'jshint',
    'timezones'
  ]);


  grunt.registerTask('default', [
    'test'
  ]);

  grunt.registerMultiTask('timezones', function() {
    process.env.TZ = this.data;
    console.log(`Running nodeunit tests in timezone: ${process.env.TZ}`);
    grunt.task.run('nodeunit');
  });
};
