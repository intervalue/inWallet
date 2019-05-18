'use strict';

angular.module('copayApp.controllers').controller('newVersionIsAvailable', function($rootScope ,$scope, $modal, $modalInstance, go, newVersion, isMobile){

  $scope.version = newVersion.version;
  $scope.message = newVersion.message;
  $scope.updateRemark = JSON.parse(newVersion.updateRemark);
  $scope.newversionpro = false;
  $scope.rangevalue = 0;
    /**
     * 更新提示页面，点击更新后触发
     */
  $scope.openDownloadLink = function(){
      let data = $scope.message;
      let androidHref = data.androidHref;
      let iosHref = data.iosHref;
      let linuxHref = data.linuxHref;
      let windowsHref = data.windowsHref;
      let macHref = data.macHref;
    if (navigator && isMobile.Android()) {
        load(androidHref);
    }
    else if(navigator && isMobile.iOS()){//InAppBrowser
        cordova.InAppBrowser.open('itms-services:///?action=download-manifest&url='+iosHref, '_blank', 'location=yes');
    }
    else if(navigator && isMobile.Windows()){
        console.log('openExternalLink Windows')
        go.openExternalLink(windowsHref);
    }
    else if(navigator && isMobile.Mac()){
        console.log('openExternalLink Mac')
        go.openExternalLink(macHref);
    }else if(navigator && navigator.userAgent.split(';')[1].substring(1,6) == 'Linux'){
        console.log('openExternalLink Linux')
        go.openExternalLink(linuxHref);
    }


  };

    /**
     * android更新，下载完成后，提醒用户安装
     * @param link
     */
    function load(link){
        $scope.newversionpro = true;
        var uri = encodeURI(link);
        var file = cordova.file.externalDataDirectory;
        // 保存路径
        var fileURL = encodeURI(file + 'inWallet'+$scope.version+'.apk');
        let fileTransfer = new FileTransfer();
        /**
         * 计算下载进度
         * @param e
         */
        fileTransfer.onprogress = function (e) {
            console.info(e);
            if (e.lengthComputable) {
                $scope.rangevalue = (e.loaded / e.total *100).toFixed(2);
                setTimeout(function(){
                    $rootScope.$apply();
                })
            }
        }
        /**
         * 开始下载apk
         */
        fileTransfer.download(uri, fileURL, function(entry) {
            /**
             * 下载完成后，打开apk,显示安装窗口
             */
            cordova.plugins.fileOpener2.showOpenWithDialog(
                entry.toURL(), // You can also use a Cordova-style file uri: cdvfile://localhost/persistent/Download/starwars.pdf
                'application/vnd.android.package-archive',
                {
                    error : function(e) {
                        console.log('Error status: ' + e.status + ' - Error message: ' + e.message);
                    },
                    success : function () {
                        console.log('file opened successfully');
                    }
                }
            );
        });


    }

  $scope.later = function(){
    $modalInstance.close('closed result');
  };
});
