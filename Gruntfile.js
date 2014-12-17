/**
 * Created by abaddon on 17.12.2014.
 */
module.exports = function (grunt) {
    grunt.initConfig({
        distFolder: 'dist',
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['js/*.js'],
                dest: '<%= distFolder %>/all.js'
            }
        },
        uglify: {
            my_target: {
                files: {
                    '<%= distFolder %>/all.min.js': ['<%= distFolder %>/all.js']
                }
            }
        },
        cssmin: {
            css: {
                src: ['css/style.css'],
                dest: '<%= distFolder %>/style.min.css'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    grunt.registerTask('build', ['concat', 'uglify', 'cssmin']);
};