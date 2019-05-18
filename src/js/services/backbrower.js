angular.module("copayApp.services").factory("historyUrlService",["$state",function($state){

    //用于记录上一个页面的历史地址
    var backUrl = "";
    function setBackUrl(url){
        backUrl = url;
    }

    function getBackUrl(){
        return backUrl;
    }

    /**
     * 根据statement
     * */
    function goUrlByState(state){
        $state.go(state);
    }

    /**
     * 根据url跳转
     * */
    function goUrlBuyUrl(url){
        window.location.href = url;
    }

    return {
        "goUrlBuyUrl":goUrlBuyUrl,
        "goUrlByState":goUrlByState,
        "setBackUrl":setBackUrl,
        "getBackUrl":getBackUrl
    }
}]);