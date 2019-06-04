'use strict';
angular.module('copayApp.services')
  .factory('storageService', function(logHeader, fileStorageService, localStorageService, sjcl, $log, lodash, isCordova) {

    var root = {};

    // File storage is not supported for writting according to 
    // https://github.com/apache/cordova-plugin-file/#supported-platforms
    var shouldUseFileStorage = isCordova && !isMobile.Windows();
    $log.debug('Using file storage:', shouldUseFileStorage);


    var storage = shouldUseFileStorage ? fileStorageService : localStorageService;

    var getUUID = function(cb) {
      // TO SIMULATE MOBILE
      //return cb('hola');
      if (!window || !window.plugins || !window.plugins.uniqueDeviceID)
        return cb(null);

      window.plugins.uniqueDeviceID.get(
        function(uuid) {
          return cb(uuid);
        }, cb);
    };

    var encryptOnMobile = function(text, cb) {

      // UUID encryption is disabled.
      return cb(null, text);
      //
      // getUUID(function(uuid) {
      //   if (uuid) {
      //     $log.debug('Encrypting profile');
      //     text = sjcl.encrypt(uuid, text);
      //   }
      //   return cb(null, text);
      // });
    };


    var decryptOnMobile = function(text, cb) {
      var json;
      try {
        json = JSON.parse(text);
      } catch (e) {};

      if (!json) return cb('Could not access storage')

      if (!json.iter || !json.ct) {
        $log.debug('Profile is not encrypted');
        return cb(null, text);
      }

      $log.debug('Profile is encrypted');
      getUUID(function(uuid) {
        $log.debug('Device UUID:' + uuid);
        if (!uuid)
          return cb('Could not decrypt storage: could not get device ID');

        try {
          text = sjcl.decrypt(uuid, text);

          $log.info('Migrating to unencrypted profile');
          return storage.set('profile', text, function(err) {
            return cb(err, text);
          });
        } catch(e) {
          $log.warn('Decrypt error: ', e);
          return cb('Could not decrypt storage: device ID mismatch');
        };
        return cb(null, text);
      });
    };

    // on mobile, the storage keys are files, we have to avoid slashes in filenames
    function getSafeWalletId(walletId){
        return walletId.replace(/[\/+=]/g, '');
    }

    root.storeNewProfile = function(profile, cb) {
      encryptOnMobile(profile.toObj(), function(err, x) {
        storage.create('profile', x, cb);
      });
    };

    root.storeProfile = function(profile, cb) {
      encryptOnMobile(profile.toObj(), function(err, x) {

        storage.set('profile', x, cb);
      });
    };

    root.getProfile = function(cb) {
      storage.get('profile', function(err, str) {
        //console.log("prof="+str+", err="+err);
        if (err || !str)
          return cb(err);

        decryptOnMobile(str, function(err, str) {
          if (err) return cb(err);
          var p, err;
          try {
            p = Profile.fromString(str);
          } catch (e) {
            $log.debug('Could not read profile:', e);
            err = new Error('Could not read profile:' + e);
          }
          return cb(err, p);
        });
      });
    };

    root.deleteProfile = function(cb) {
      storage.remove('profile', cb);
    };

    root.storeFocusedWalletId = function(id, cb) {
      storage.set('focusedWalletId', id || '', cb);
    };

    root.getFocusedWalletId = function(cb) {
      storage.get('focusedWalletId', cb);
    };

    root.setBackupFlag = function(walletId, cb) {
      storage.set('backup-' + getSafeWalletId(walletId), Date.now(), cb);
    };

    root.getBackupFlag = function(walletId, cb) {
      storage.get('backup-' + getSafeWalletId(walletId), cb);
    };

    root.clearBackupFlag = function(walletId, cb) {
      storage.remove('backup-' + getSafeWalletId(walletId), cb);
    };

    root.getConfig = function(cb) {
      storage.get('config', cb);
    };

    root.storeConfig = function(val, cb) {
      $log.debug('Storing Preferences', val);
      storage.set('config', val, cb);
    };

    root.clearConfig = function(cb) {
      storage.remove('config', cb);
    };

    root.setDisclaimerFlag = function(cb) {
      storage.set('agreeDisclaimer', true, cb);
    };

    root.getDisclaimerFlag = function(cb) {
      storage.get('agreeDisclaimer', cb);
    };

    root.setRemotePrefsStoredFlag = function(cb) {
      storage.set('remotePrefStored', true, cb);
    };

    root.getRemotePrefsStoredFlag = function(cb) {
      storage.get('remotePrefStored', cb);
    };

    root.setAddressbook = function(type, addressbook, cb) {
      storage.set('addressbook-' + type, addressbook, cb);
    };

    root.getAddressbook = function(type, cb) {
      storage.get('addressbook-' + type, cb);
    };

    root.removeAddressbook = function(type, cb) {
      storage.remove('addressbook-' + type, cb);
    };

      root.setPrompt = function( cb) {
          storage.set('Prompt', true, cb);
      };

      root.getPrompt = function( cb) {
          storage.get('Prompt', cb);
      };

    root.setPushInfo = function(projectNumber, registrationId, enabled, cb) {
      storage.set('pushToken', JSON.stringify({projectNumber: projectNumber, registrationId: registrationId, enabled: enabled}), cb);
    };

    root.getPushInfo = function(cb) {
      storage.get('pushToken', function(err, data) {
      	err ? cb(err) : cb(null, (data ? JSON.parse(data) : data));
	  });
    };
      
    root.removePushInfo = function(cb){
      storage.remove('pushToken', cb);
    };

      root.setEye = function(obj, cb) {
          storage.set('eye', JSON.stringify(obj), cb);
      };

      root.getEye = function( cb) {
          storage.get('eye', function (err,data) {
              if(err || !data) return;
              cb(JSON.parse(data))
          });
      };

      root.setDapp = function(obj, cb) {
          storage.set('dapp', JSON.stringify(obj), cb);
      };

      root.getDapp = function( cb) {
          storage.get('dapp', function (err,data) {
              if(err || !data) return cb('err');
              cb(null,JSON.parse(data))
          });
      };

    return root;
  });
