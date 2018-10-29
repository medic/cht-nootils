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
    timeZones:{
      gmt: 'GMT',
      pac: 'Pacific/Kiritimati',
      gmt12: 'Etc/GMT+12', 
      est: 'America/New_York'
    }
  });

  grunt.registerTask('test', [
    'jshint',
    'timeZones'
  ]);


  grunt.registerTask('default', [
    'test'
  ]);

  grunt.registerMultiTask('timeZones', function(){
    process.env.TZ = this.data;
    console.log('CURRENT TIMEZONE IS ' + this.data);
    grunt.task.run('nodeunit');
  });
};
