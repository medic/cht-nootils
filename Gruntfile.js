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
  });

  grunt.registerTask('test', [
    'jshint',
    'nodeunit',
  ]);

  grunt.registerTask('default', [
    'test'
  ]);
};
