VERSION=`cut -d '"' -f2 $BUILDDIR/../version.js`

cordova-base:
	grunt dist-mobile

wp8-prod:
	cordova/build.sh WP8 --clear
	cordova/wp/fix-svg.sh
	echo -e "\a"

wp8-debug:
	cordova/build.sh WP8 --dbgjs
	cordova/wp/fix-svg.sh
	echo -e "\a"

ios:
	cordova/build.sh IOS --dbgjs
	cd ../inWalletbuilds/project-IOS && cordova build ios
	open ../inWalletbuilds/project-IOS/platforms/ios/inWallet.xcodeproj

ios-prod:
	cordova/build.sh IOS --clear
	cd ../inWalletbuilds/project-IOS && cordova build ios

ios-debug:
	cordova/build.sh IOS --dbgjs
	cd ../inWalletbuilds/project-IOS && cordova build ios
	open ../inWalletbuilds/project-IOS/platforms/ios/inWallet.xcodeproj

android:
	cordova/build.sh ANDROID --dbgjs
	cd ../inWalletbuilds/project-ANDROID && cordova build android --release   2>&1 >/dev/null
	mv ../inWalletbuilds/project-ANDROID/platforms/android/build/outputs/apk/android-release-unsigned.apk ../inWalletbuilds/inWallet.apk

android-prod:
	cordova/build.sh ANDROID --clear
	cd ../inWalletbuilds/project-ANDROID && cordova build android 2>&1 >/dev/null
	mv ../inWalletbuilds/project-ANDROID/platforms/android/build/outputs/apk/android-debug.apk ../inWalletbuilds/inWallet.apk

android-prod-fast:
	cordova/build.sh ANDROID
#	cd ../inWalletbuilds/project-ANDROID && cordova run android --device
	cd ../inWalletbuilds/project-ANDROID && cordova build android 2>&1 >/dev/null
	mv ../inWalletbuilds/project-ANDROID/platforms/android/build/outputs/apk/android-debug.apk ../inWalletbuilds/inWallet.apk

android-debug:
	cordova/build.sh ANDROID --dbgjs
	cd ../inWalletbuilds/project-ANDROID && cordova build android 2>&1 >/dev/null
	mv ../inWalletbuilds/project-ANDROID/platforms/android/build/outputs/apk/android-debug.apk ../inWalletbuilds/inWallet.apk


android-debug-fast:
	cordova/build.sh ANDROID --dbgjs
	cd ../inWalletbuilds/project-ANDROID && cordova run android --device

win32:
	grunt.cmd desktop
	cp -rf node_modules ../inWalletbuilds/inWallet/win32/
	grunt.cmd inno32

win64:
	grunt.cmd inno64

linux64:
	grunt desktop
	cp -rf node_modules ../inWalletbuilds/inWallet/linux64/
	grunt linux64

osx64:
	grunt desktop
	cp -rf node_modules ../inWalletbuilds/inWallet/osx64/inWallet.app/Contents/Resources/app.nw/
	grunt dmg