#! /bin/bash
#
# Usage:
# sh ./build.sh --android --reload
#
#
# Check function OK
checkOK() {
	if [ $? != 0 ]; then
		echo "${OpenColor}${Red}* ERROR. Exiting...${CloseColor}"
		exit 1
	fi
}

# Configs
cd node_modules/inWalletcore
babel ./*.js -d babel
cp -rf babel/* .
rm -rf babel
cd ../..
cd node_modules/inWalletcore/HDWallet
babel ./*.js -d babel
cp -rf babel/* .
rm -rf babel
cd ../../..
cd node_modules/inWalletcore/model
babel ./*.js -d babel
cp -rf babel/* .
rm -rf babel
cd ../../..
BUILDDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT="$BUILDDIR/../../inWalletbuilds/project-$1"
if [ ! -d "$BUILDDIR/../../inWalletbuilds" ]; then
    mkdir -p $BUILDDIR/../../inWalletbuilds
fi

CURRENT_OS=$1
if [ -z "CURRENT_OS" ]; then
 	echo "Build.sh WP8|ANDROID|IOS"
fi

CLEAR=false
DBGJS=false
if [[ $2 == "--clear" || $3 == "--clear" ]]; then
	CLEAR=true
fi
if [[ $2 == "--dbgjs" || $3 == "--dbgjs" ]]; then
	DBGJS=true
fi


echo "${OpenColor}${Green}* Checking dependencies...${CloseColor}"
command -v cordova >/dev/null 2>&1 || { echo >&2 "Cordova is not present, please install it: sudo npm install -g cordova."; exit 1; }
#command -v xcodebuild >/dev/null 2>&1 || { echo >&2 "XCode is not present, install it or use [--android]."; exit 1; }

# Create project dir
if $CLEAR
then
	if [ -d $PROJECT ]; then
		rm -rf $PROJECT
	fi
fi

echo "Build directory is $BUILDDIR"
echo "Project directory is $PROJECT"

if [ ! -d $PROJECT ]; then
	cd $BUILDDIR
	echo "${OpenColor}${Green}* Creating project... ${CloseColor}"
	cordova create ../../inWalletbuilds/project-$1 com.inWallet.wallet inWallet
	checkOK

	cd $PROJECT

	if [ $CURRENT_OS == "ANDROID" ]; then
		echo "${OpenColor}${Green}* Adding Android platform... ${CloseColor}"
		cordova platforms add android
		checkOK
	fi

	if [ $CURRENT_OS == "IOS" ]; then
		echo "${OpenColor}${Green}* Adding IOS platform... ${CloseColor}"
		cordova platforms add ios
		checkOK
	fi

	if [ $CURRENT_OS == "WP8" ]; then
		echo "${OpenColor}${Green}* Adding WP8 platform... ${CloseColor}"
		cordova platforms add wp8
		checkOK
	fi

	echo "${OpenColor}${Green}* Installing plugins... ${CloseColor}"

#  cordova plugin add https://github.com/florentvaldelievre/virtualartifacts-webIntent.git
#  checkOK

	if [ $CURRENT_OS == "IOS" ]; then
	    cordova plugin add https://github.com/FRD49/iOS-ExitApp.git
		cordova plugin add https://github.com/ylwhlhp/phonegap-plugin-barcodescanner.git
	else
		#cordova plugin add cordova-plugin-android-support-v4-jar
		#checkOK

        #cordova plugin add https://github.com/jrontend/phonegap-plugin-barcodescanner.git

		cordova plugin add https://github.com/phonegap/phonegap-plugin-barcodescanner.git
		checkOK

	fi
	checkOK

	cordova plugin add cordova-plugin-statusbar
	checkOK

#    cordova plugin add cordova-plugin-jcore@1.1.12
#    checkOK
#
#	cordova plugin add jpush-phonegap-plugin@3.3.2 --variable APP_KEY=8d202bd4ea312132f3915394
#    checkOK
#    cordova plugin add https://github.com/katzer/cordova-plugin-local-notifications.git
#    checkOK

	cordova plugin add cordova-plugin-customurlscheme --variable URL_SCHEME=inWallet
	checkOK

    cordova plugin add https://github.com/xu-li/cordova-plugin-wechat --variable wechatappid=wxb98f8ff24ab2f11f
    checkOK

#    cordova plugin add cordova-plugin-sharesdk --variable SHARESDK_ANDROID_APP_KEY=xxxx --variable SHARESDK_IOS_APP_KEY=xxxx --variable WECHAT_APP_ID=wxb98f8ff24ab2f11f --variable WECHAT_APP_SECRET=xxxx --variable WEIBO_APP_ID=xxxx --variable WEIBO_APP_SECRET=xxxx --variable WEIBO_REDIRECT_URL=http://xxxx --variable QQ_IOS_APP_ID=xxxx --variable QQ_IOS_APP_HEX_ID=xxxx --variable QQ_IOS_APP_KEY=xxxx --variable QQ_ANDROID_APP_ID=xxxx --variable QQ_ANDROID_APP_KEY=xxxx
#    checkOK

#    cordova plugin add cordova-plugin-themeablebrowser
 #   checkOK

	cordova plugin add cordova-plugin-inappbrowser
	checkOK

	cordova plugin add cordova-plugin-file-transfer
	checkOK

	cordova plugin add cordova-plugin-screen-orientation
    checkOK

    cordova plugin add cordova-plugin-file-opener2
    checkOK


	cordova plugin add cordova-plugin-x-toast && cordova prepare
	checkOK

	cordova plugin add cordova-plugin-splashscreen
    checkOK

    cordova plugin add cordova-plugin-backbutton
    checkOK

	cordova plugin add https://github.com/ylwhlhp/CordovaClipboard
	checkOK

	cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git && cordova prepare
	checkOK

	cordova plugin add cordova-plugin-spinner-dialog
	checkOK

	cordova plugin add cordova-plugin-dialogs
	checkOK

#	cordova plugin add cordova-plugin-network-information
#	checkOK

	cordova plugin add cordova-plugin-console
	checkOK

 	cordova plugin add cordova-plugin-uniquedeviceid
 	checkOK
#-------
	cordova plugin add cordova-plugin-file
	checkOK

	cordova plugin add cordova-plugin-touch-id && cordova prepare
	checkOK

#	cordova plugin add cordova-plugin-transport-security
#	checkOK

	cordova plugin add cordova-ios-requires-fullscreen
	checkOK

	cordova plugin add https://github.com/byteball/cordova-sqlite-plugin.git
	checkOK

	cordova plugin add cordova-plugin-device-name
	checkOK

#	cordova plugin cordova-plugin-tx-wechat --variable APP_ID=wxb98f8ff24ab2f11f
#    checkOK


	if [ $CURRENT_OS == "ANDROID" ]; then
		cordova plugin add https://github.com/ylwhlhp/PushPlugin.git
		checkOK
	fi

	cordova plugin add https://github.com/ylwhlhp/MFileChooser.git
	checkOK

    cordova plugin add cordova-plugin-app-preferences
    checkOK
fi

if $DBGJS; then
	echo "${OpenColor}${Green}* Generating inWallet bundle (debug js)...${CloseColor}"
	cd $BUILDDIR/..
	grunt cordova
	checkOK
else
	echo "${OpenColor}${Green}* Generating inWallet bundle...${CloseColor}"
	cd $BUILDDIR/..
	grunt cordova-prod
	checkOK
fi

# copy project codes
echo "${OpenColor}${Green}* Copying files...${CloseColor}"
cd $BUILDDIR/..
if [ ! -d $PROJECT/www ]; then
    mkdir $PROJECT/www
fi
cp -af public/** $PROJECT/www
checkOK

echo "${OpenColor}${Green}* Copying initial database...${CloseColor}"
cp node_modules/inWalletcore/initial.inWallet.sqlite $PROJECT/www
cp node_modules/inWalletcore/initial.inWallet-light.sqlite $PROJECT/www
checkOK

node $BUILDDIR/replaceForPartialClient.js $PROJECT
rm $PROJECT/www/partialClient.html
checkOK

cd $BUILDDIR
cp -f config.xml $PROJECT/config.xml
checkOK

# ANDROID
if [ $CURRENT_OS == "ANDROID" ]; then
	echo "Android project!!!"

	cat $BUILDDIR/android/android.css >> $PROJECT/www/css/inWallet.css

	mkdir -p $PROJECT/platforms/android/res/xml/
	checkOK

#  cp android/AndroidManifest.xml $PROJECT/platforms/android/AndroidManifest.xml
#  checkOK

	cp android/build-extras.gradle $PROJECT/platforms/android/build-extras.gradle
	checkOK

	#cp android/project.properties $PROJECT/platforms/android/project.properties
	#checkOK

	cp -R android/res/* $PROJECT/platforms/android/res
	checkOK

    mkdir -p $PROJECT/res/icon/android
    checkOK

	cp -R android/res/* $PROJECT/res/icon/android
	checkOK
fi

# IOS
if [ $CURRENT_OS == "IOS" ]; then
	echo "IOS project!!!"

    cat $BUILDDIR/ios/ios.css >> $PROJECT/www/css/inWallet.css

	cp -R ios $PROJECT/../
	checkOK
#  mkdir -p $PROJECT/platforms/ios
#  checkOK
#
#  cp ios/inWallet-Info.plist $PROJECT/platforms/ios/inWallet-Info.plist
#  checkOK
#
#  mkdir -p $PROJECT/platforms/ios/inWallet/Resources/icons
#  checkOK
#
#  mkdir -p $PROJECT/platforms/ios/inWallet/Resources/splash
#  checkOK
#
#  cp -R ios/icons/* $PROJECT/platforms/ios/inWallet/Resources/icons
#  checkOK
#
#  cp -R ios/splash/* $PROJECT/platforms/ios/inWallet/Resources/splash
#  checkOK
fi

# WP8
if [ $CURRENT_OS == "WP8" ]; then
	echo "Wp8 project!!!"
	cp -R $PROJECT/www/* $PROJECT/platforms/wp8/www
	checkOK
	if ! $CLEAR; then
		cp -vf wp/Properties/* $PROJECT/platforms/wp8/Properties/
		checkOK
		cp -vf wp/MainPage.xaml $PROJECT/platforms/wp8/
		checkOK
		cp -vf wp/Package.appxmanifest $PROJECT/platforms/wp8/
		checkOK
		cp -vf wp/Assets/* $PROJECT/platforms/wp8/Assets/
		cp -vf wp/SplashScreenImage.jpg $PROJECT/platforms/wp8/
		cp -vf wp/ApplicationIcon.png $PROJECT/platforms/wp8/
		cp -vf wp/Background.png $PROJECT/platforms/wp8/
		checkOK
	fi
fi

