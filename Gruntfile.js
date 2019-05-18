module.exports = function (grunt) {

	function getPlatform() {
		switch (process.platform) {
			case 'win32':
				return 'win64'; // change to 'win' for both 32 and 64
			case 'linux':
				return 'linux64';
			case 'darwin':
				return 'osx64';
			default:
				throw Error("unknown platform " + process.platform);
		}
	}

	// Project Configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		exec: {
			version: {
				command: 'node ./util/version.js'
			},
			clear: {
				command: 'rm -Rf bower_components node_modules'
			},
			osx64: {
				command: '../inWalletbuilds/build-osx.sh osx64'
			},
			osx32: {
				command: '../inWalletbuilds/build-osx.sh osx32'
			}
		},
		watch: {
			options: {
				dateFormat: function (time) {
					grunt.log.writeln('The watch finished in ' + time + 'ms at ' + new Date().toString());
					grunt.log.writeln('Waiting for more changes...');
				}
			},
			css: {
				files: ['src/css/*.css'],
				tasks: ['concat:css']
			},
			main: {
				files: ['src/js/init.js', 'src/js/app.js', 'src/js/directives/*.js', 'src/js/filters/*.js', 'src/js/routes.js', 'src/js/services/*.js', 'src/js/models/*.js', 'src/js/controllers/*.js'],
				tasks: ['concat:js']
			}
		},
		concat: {
			options: {
				sourceMap: false,
				sourceMapStyle: 'link' // embed, link, inline
			},
			angular: {
				src: ['bower_components/fastclick/lib/fastclick.js', 'bower_components/qrcode-generator/js/qrcode.js', 'bower_components/qrcode-decoder-js/lib/qrcode-decoder.js', 'bower_components/moment/min/moment-with-locales.js', 'bower_components/angular/angular.js', 'bower_components/angular-ui-router/release/angular-ui-router.js', 'bower_components/angular-foundation/mm-foundation-tpls.js', 'bower_components/angular-animate/angular-animate.min.js', 'bower_components/angular-moment/angular-moment.js', 'bower_components/ng-lodash/build/ng-lodash.js', 'bower_components/angular-qrcode/angular-qrcode.js', 'bower_components/angular-gettext/dist/angular-gettext.js', 'bower_components/angular-touch/angular-touch.js', 'bower_components/angular-ui-switch/angular-ui-switch.js', 'bower_components/angular-elastic/elastic.js', 'bower_components/ui-router-extras/release/ct-ui-router-extras.js', 'bower_components/swiper/dist/js/swiper.js'],
				dest: 'public/angular.js'
			},
			js: {
				src: ['angular-bitcore-wallet-client/index.js', 'src/js/app.js', 'src/js/routes.js', 'src/js/directives/*.js', 'src/js/filters/*.js', 'src/js/models/*.js', 'src/js/services/*.js', 'src/js/controllers/*.js', 'src/js/version.js', 'src/js/init.js'],
				dest: 'public/inWallet.js'
			},
			css: {
				src: ['src/css/*.css'],
				dest: 'public/css/inWallet.css'
			},
			foundation: {
				src: ['bower_components/angular/angular-csp.css', 'bower_components/angular-ui-switch/angular-ui-switch.css', 'bower_components/animate.css/animate.css', 'bower_components/swiper/dist/css/swiper.css'],
				dest: 'public/css/foundation.css'
			}
		},
		uglify: {
			options: {
				mangle: false
			},
			prod: {
				files: {
					'public/inWallet.js': ['public/inWallet.js'],
					'public/angular.js': ['public/angular.js']
				}
			},
			partialClient: {
				files: {
					'public/partialClient.js': ['public/partialClient.js']
				}
			}
		},
		nggettext_extract: {
			pot: {
				files: {
					'i18n/po/template.pot': ['public/index.html', 'public/views/*.html', 'public/views/**/*.html', 'src/js/routes.js', 'src/js/services/*.js', 'src/js/controllers/*.js']
				}
			}
		},
		nggettext_compile: {
			all: {
				options: {
					format: "json",
					module: 'copayApp'
				},
				files: [{
					expand: true,
					dot: true,
					cwd: "i18n/po",
					dest: "public/languages",
					src: ["*.po"],
					ext: ".json"
				}]
			}
		},
		copy: {
			node_sqlite3: {
				expand: true,
				src: 'node_sqlite3.node',
				dest: 'node_modules/sqlite3/lib/binding/node-webkit-v0.21.6-win32-x64/'
			},
			node_modules: {
				expand: true,
				src: 'node_modules/**',
				dest: '../inWalletbuilds/inWallet/win64/'
			},

			modules: {
				expand: true,
				flatten: true,
				options: { timestamp: true, mode: true },
				src: ['src/js/fileStorage.js'],
				dest: 'public/'
			},
			osx: {
				expand: true,
				flatten: true,
				options: { timestamp: true, mode: true },
				src: ['webkitbuilds/build-osx.sh', 'webkitbuilds/Background.png'],
				dest: '../inWalletbuilds/'
			},
			linux: {
				options: { timestamp: true, mode: true },
				files: [{
					expand: true,
					cwd: './webkitbuilds/',
					src: ['inWallet.desktop', '../public/img/icons/icon-white-outline.ico', '../public/img/icons/icon-white-256.png'],
					dest: '../inWalletbuilds/inWallet/linux32/',
					flatten: true,
					filter: 'isFile',
					options: { timestamp: true, mode: true }
				}, {
					expand: true,
					cwd: './webkitbuilds/',
					src: ['inWallet.desktop', '../public/img/icons/icon-white-outline.ico', '../public/img/icons/icon-white-256.png'],
					dest: '../inWalletbuilds/inWallet/linux64/',
					flatten: true,
					filter: 'isFile',
					options: { timestamp: true, mode: true }
				}]
			}
		},
		karma: {
			unit: {
				configFile: 'test/karma.conf.js'
			},
			prod: {
				configFile: 'test/karma.conf.js',
				singleRun: true
			}
		},
		coveralls: {
			options: {
				debug: false,
				coverageDir: 'coverage/report-lcov',
				dryRun: true,
				force: true,
				recursive: false
			}
		},
		nwjs: {
			options: {
				//platforms: ['win','osx64','linux'],
				//platforms: ['osx64'],
				platforms: [getPlatform()],
				appName: 'inWallet',
				buildDir: '../inWalletbuilds',
				version: '0.21.6',
				zip: false,
				macIcns: './public/img/icons/icon-white-outline.icns',
				winIco: './public/img/icons/icon-white-outline.ico',
				exeIco: './public/img/icons/icon-white-outline.ico',
				macPlist: {
					CFBundleURLTypes: [{
						CFBundleURLName: 'inWallet action',
						CFBundleURLSchemes: ['inWallet']
					}], /*CFBundleIconFile: 'nw.icns',*/LSHasLocalizedDisplayName: 0
				}
			},
			src: ['./package.json', './public/**/*', './angular-bitcore-wallet-client/**/*']
		},
		compress: {
			linux32: {
				options: {
					archive: '../inWalletbuilds/inWallet-linux32.zip'
				},
				expand: true,
				cwd: '../inWalletbuilds/inWallet/linux32/',
				src: ['**/*'],
				dest: 'inWallet-linux32/'
			},
			linux64: {
				options: {
					archive: '../inWalletbuilds/inWallet-linux64.zip'
				},
				expand: true,
				cwd: '../inWalletbuilds/inWallet/linux64/',
				src: ['**/*'],
				dest: 'inWallet-linux64/'
			}
		},
		browserify: {
			dist: {
				options: {
					exclude: ['sqlite3', 'nw.gui', 'mysql', 'ws', 'regedit']
				},
				src: 'public/inWallet.js',
				dest: 'public/inWallet.js'
			},
			partialClient: {
				options: {
					exclude: ['sqlite3', 'nw.gui', 'mysql', 'ws', 'regedit']
				},
				src: 'src/js/partialClient.js',
				dest: 'public/partialClient.js'
			}
		},
		// .deb proved to be very slow to produce and install: lintian spends a lot of time verifying a .bin file
		debian_package: {
			linux64: {
				files: [{
					expand: true,
					cwd: '../inWalletbuilds/inWallet-test/linux64/',
					src: ['**/*'],
					dest: '/opt/inWallet-test/'
				}],
				options: {
					maintainer: {
						name: 'inWallet',
						email: 'inWallet@inve.one'
					},
					long_description: 'Smart payments made simple',
					target_architecture: 'amd64'
				}
			}
		},
		innosetup_compiler: {
			win64: {
				options: {
					gui: false,
					verbose: false
				},
				script: 'webkitbuilds/setup-win64.iss'
			},
			win32: {
				options: {
					gui: false,
					verbose: false
				},
				script: 'webkitbuilds/setup-win32.iss'
			}
		},

		clean: {
			linux64: {
				options: { force: true },
				files: [{
					src: '../inWalletbuilds/inWallet/linux64/node_modules/grunt*',
					src: '../inWalletbuilds/inWallet/linux64/node_modules/karma*'
				}]
			},
			win64: {
				options: { force: true },
				files: [{
					src: '../inWalletbuilds/inWallet/win64/node_modules/grunt*',
					src: '../inWalletbuilds/inWallet/win64/node_modules/karma*',
					src: '../inWalletbuilds/inWallet/win64/node_modules/babel*'
				}]
			},
			osx64: {
				options: { force: true },
				files: [{
					src: '../inWalletbuilds/inWallet/osx64/node_modules/grunt*',
					src: '../inWalletbuilds/inWallet/osx64/node_modules/karma*',
					src: '../inWalletbuilds/inWallet/osx64/node_modules/babel*'
				}]
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-angular-gettext');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-exec');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-karma-coveralls');
	grunt.loadNpmTasks('grunt-nw-builder');
	grunt.loadNpmTasks('grunt-contrib-compress');
	//grunt.loadNpmTasks('grunt-debian-package');
	grunt.loadNpmTasks('innosetup-compiler');

	grunt.registerTask('default', ['nggettext_compile', 'exec:version', 'concat', 'copy:modules']);
	grunt.registerTask('coding', ['nggettext_compile', 'exec:version', 'concat', 'copy:modules', 'watch']);
	grunt.registerTask('cordova', ['default', 'browserify']);
	grunt.registerTask('cordova-prod', ['cordova', 'uglify']);
	//grunt.registerTask('prod', ['default', 'uglify']);
	grunt.registerTask('translate', ['nggettext_extract']);
	grunt.registerTask('test', ['karma:unit']);
	grunt.registerTask('test-coveralls', ['karma:prod', 'coveralls']);
	//grunt.registerTask('desktop', ['prod', 'nwjs', 'copy:linux', 'compress:linux32', 'compress:linux64', 'copy:osx', 'exec:osx32', 'exec:osx64']);
	grunt.registerTask('desktop', ['default', 'nwjs']);
	grunt.registerTask('dmg', ['clean:osx64', 'copy:osx', 'exec:osx64']);
	grunt.registerTask('linux64', ['clean:linux64', 'copy:linux', 'compress:linux64']);
	grunt.registerTask('linux32', ['copy:linux', 'compress:linux32']);
	grunt.registerTask('deb', ['debian_package:linux64']);
	grunt.registerTask('inno64', ['copy:node_sqlite3', 'desktop', 'copy:node_modules', 'clean:win64', 'innosetup_compiler:win64']);
	grunt.registerTask('inno32', ['innosetup_compiler:win32']);
	grunt.registerTask('partial', ['browserify:partialClient', 'uglify:partialClient']);
	grunt.registerTask('partial-fast', ['browserify:partialClient']);
};