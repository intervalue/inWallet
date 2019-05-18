'use strict';

angular.module('copayApp.services').factory('addressbookService', function(storageService, profileService) {
  var root = {};

  root.getLabel = function(addr,type, cb) {
    //var fc = profileService.focusedClient;
    storageService.getAddressbook(type, function(err, ab) {
      if (!ab)  cb();
      ab = JSON.parse(ab);
      if (ab[addr])  cb(ab[addr]);
      else  cb();
    });
  };

  root.list = function(type,cb) {
    //var fc = profileService.focusedClient;
    storageService.getAddressbook(type, function(err, ab) {
      //if(!ab) cb(null);
      if (err)  cb('Could not get the Addressbook');
      if (ab) ab = JSON.parse(ab);
      cb(err, ab);
    });
  };

  root.add = function(entry,type, cb) {
    //var fc = profileService.focusedClient;
    root.list(type,function(err, ab) {
      if (err) cb(err);
      if (!ab) ab = {};
      if (ab[entry.address]) {
          cb('Entry already exist');
          return;
      }
      ab[entry.address] = entry.label;
      console.log('ab: ',ab);
      storageService.setAddressbook(type, JSON.stringify(ab), function(err, ab) {
        if (err)  cb('Error adding new entry');
        root.list(type,function(err, ab) {
          //if(!ab) return;
           cb(err, ab);
        });
      });
    });
  };
  
  root.remove = function(addr,type, cb) {
    //var fc = profileService.focusedClient;
    root.list(type,function(err, ab) {
      if (err) return cb(err);
      if (!ab) return;
      if (!ab[addr]) return cb('Entry does not exist');
      delete ab[addr];
      storageService.setAddressbook(type, JSON.stringify(ab), function(err) {
        if (err) return cb('Error deleting entry');
        root.list(type,function(err, ab) {
          if(!ab) return;
          return cb(err, ab);
        });
      });
    }); 
  };

  root.removeAll = function() {
    //var fc = profileService.focusedClient;
    storageService.removeAddressbook('address', function(err) {
      if (err) return cb('Error deleting addressbook');
      return cb();
    });
  };

  return root;
});
