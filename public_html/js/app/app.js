//check if browser supports file api and filereader features
if(!window.File || !window.FileReader || !window.FileList || !window.Blob){
    alert('The File APIs are not fully supported in this browser.');
}
Array.prototype.remove = Array.prototype.remove || function(val){
    var i = this.length;
    while(i--){if(this[i]===val){this.splice(i,1);}}
};

var WebsiteApp=angular.module('rxModule', ['ui.bootstrap'])
.controller('BaseCtrl',function($rootScope,FileSrv,EncryptSrv,$uibModal,$timeout){
    var WebApp={
        ViewerApp:new ViewerApp(),
        showSaveBtn:false,
        disableFileinput:false,
        showFileinput:true,
        showFileinputLoader:false,
        showSeeKeysBtn:false,
        selectedFiles:{
          url:[],
          bin:[],
        },
        encryptedFiles:false,
        idResource:false, //id server side to find files
//ENCRYPTION
        _keyWords:[],
        getKey:function(){
            return WebApp._keyWords.join(' ');
        },
        generateKey:function(){
            WebApp._keyWords=['aaa','bbb','ccc','ddd'];
        },
//MODALS
        openModal:function(tpl,ctrl){
            var ctrl = ctrl || 'ModalDefaultCtrl';
            $uibModal.open({
                templateUrl:tpl,
                controller:ctrl,
                controllerAs:'$modalCtrl',
                size:'lg',
                appendTo:angular.element(document.getElementById('app')),
                backdrop:true,
                animation:false,
            });
        },
        showInsertKeysModal:function(){
            WebApp.openModal('ModalInsertKeys.html');
        },
        showSeeKeysModal:function(){
            WebApp.openModal('ModalShowKeys.html');
        },
//FILE
        resourceUrl:'',
        fullUrl:'',
        generateUrl:function(){
            WebApp.resourceUrl='#k='+WebApp.idResource;
            WebApp.fullUrl=window.location.href+WebApp.resourceUrl;
        },
getTimeDiff:function(start,now){return (now-start);},
        encryptSelectedFiles:function(){
          return EncryptSrv.encryptArrFiles(WebApp.selectedFiles.bin,WebApp.getKey());
        },
        decryptFiles:function(){
          EncryptSrv.decryptArrFiles(WebApp.encryptedFiles,WebApp.getKey());
//           var Promises=[];
//           angular.forEach(WebApp.encryptedFiles,function(file){
//             Promises.push(FileSrv.decryptFile(file,WebApp.getKey()));
//           });
//           Promise.all(Promises).then(function(files){
// console.log('all promises',files);
// WebApp.ViewerApp.loadURLs(files);
//           });
        },
        handleFiles:function(){
            WebApp.showFileinput=false;
            WebApp.showFileinputLoader=true;
            //show files in viewer
            WebApp.ViewerApp.loadURLs(WebApp.selectedFiles.url);
            $timeout(function(){
var time=new Date();
              WebApp.encryptSelectedFiles().then(function(encryptedFiles){
console.log('encryptedFiles',WebApp.getTimeDiff(time,new Date()),encryptedFiles);
                WebApp.encryptedFiles=encryptedFiles;
                WebApp.showFileinputLoader=false;
                WebApp.showSaveBtn=true;
                $rootScope.$digest();
              },function(e){
console.log('error',e);
              });
            },1000);
        },
        saveFiles:function(){
            FileSrv.saveFile(JSON.stringify(WebApp.encryptedFiles)).then(function(r){
                //show url/qr code & passworte
                WebApp.idResource=r.data.id;
                WebApp.generateUrl();
                WebApp.showSaveBtn=false;
                WebApp.showSeeKeysBtn=true;
                WebApp.showSeeKeysModal();
            });
        },
        loadResource:function(id){
            FileSrv.getFile(id).then(function(r){
                WebApp.encryptedFiles=JSON.parse(r.data.files);
                WebApp.openModal('ModalInsertKeys.html');
            },function(r){
              //[TODO] handle nonextistent resource
              console.log('error',r);
            });
        },
    };

    var hash=window.location.hash.split('='); //url.com/#key=HASH
    if(hash.length && hash[1]!==undefined && hash[1].length){
        WebApp.showFileinput=false;
        WebApp.loadResource(hash[1]);
    }

    $rootScope.$watch('WebApp.selectedFiles',function(data){ //selected files, begin encrypt
        if(data.bin.length && data.url.length){WebApp.handleFiles();}
    });

    WebApp.generateKey();

    $rootScope.WebApp=WebApp;
})
.controller('ViewerCtrl',function($scope){
    $scope.ViewerApp={
        showColumn:false,
    }
})

.controller('ModalDefaultCtrl',function($uibModalInstance){
  var $ctrl = this;
  $ctrl.close = function(){$uibModalInstance.close();};
})

.directive('ngFileUploader',function(FileSrv){
    return{
        scope:{
            selectedFiles:"=",
        },
        link:function(scope, element, attributes){
          element.bind("change", function(changeEvent){
            Promise.all([
                FileSrv.readUploadedFiles(changeEvent.target.files),
                FileSrv.readUploadedFiles(changeEvent.target.files,'bin')
            ]).then(function(result){
              scope.$apply(function(){
                scope.selectedFiles={
                  url:result[0],
                  bin:result[1],
                };
              });
            });
          });
        }
      };
})
;
