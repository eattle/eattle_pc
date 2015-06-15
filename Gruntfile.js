/*global module:false*/
module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %> */\n',
    // Task configuration.
    mochaTest: {
      test: {
        options: {
          run: true,
          debug: true,
          reporter: 'spec'
        },
        src: 'test/'
      }
    },
    jshint: {
      gruntfile: {
        src: 'Gruntfile.js'
      },
      js: {
        src: 'app/scripts/**/*.js',
        options: {
          quotmark: null,
          browser: true
        }
      },
      test: {
        src: 'test/**/*.js',
        options: {
          mocha: true
        }
      },
      options: {
        nonbsp: true,
        nonew: true,
        noyield: true,
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: 'nofunc',
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        esnext: true,
        browser: false,
        node: true,
        quotmark: 'single',
        globals: {
          'angular': false,
          'console': false,
          'moment': false,
          '_': false,
          'swal': false,
          'alert': false,
          '$': false
        }
      }
    },
    nodewebkit: {
      options: {
        version: '0.12.2',
        platforms: ['osx', 'win'],
        buildDir: './webkitbuilds'
      },
      src: ['./app/**/*']
    },
    auto_install: {
      local: {},
      subdir: {
        options: {
          cwd: 'app',
          stdout: true,
          stderr: true,
          failOnError: true,
          npm: '--production'
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-node-webkit-builder');
  grunt.loadNpmTasks('grunt-auto-install');

  // Default task.
  grunt.registerTask('default', ['test', 'nodewebkit']);
  grunt.registerTask('test', ['auto_install', 'jshint', 'mochaTest']);
};
