StatusBoard = (function($) {
  var refreshRate = 2000,
      serviceStatusContainer = '#service-status',
      lastUpdateEl = '#last-updated',
      nodesContainer = '#nodes',
      statusTmpl = '<div class="node"><span class="name">{{uri}}</span><span class="node-status"><span class="status {{status}}"></span></span></div>',
      uptimeTmpl = '<div class="node"><span class="name">{{uri}}</span><span class="node-status wide"><span class="progress" style="width: {{uptime}}px;"></span><span class="uptime">{{uptime}}%</span></span></div>',
      timer = '',
      nodes = new Array();
  
  var updateTime = function() {
    var currentTime = new Date();
    $('.datetime').html(currentTime.getDate() + "." + (currentTime.getMonth()+1) + "."+ currentTime.getFullYear() + " " + currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds());  
  };
  
  var startInt = function(func) {
    if(timer === "") {
      timer = window.setInterval(func, refreshRate);
    }else{
      stopInt();
    }
  };

  var stopInt = function() {
    if(timer !== "") {
      window.clearInterval(timer);
      timer = "";
    }
  };
  
  var getStatus = function(status) {
    return (status) ? 'up':'down'; 
  };

  var updateStatuses = function(statuses) {
    $.each(statuses, function(key, value){
      var status = $("#service-status ." + key+"-status").find('.status');
      status.html(value);
      if(value > 0) {
        status.addClass(key);
      } else {
        status.removeClass(key);
      }
    });
  };
  
  var showError = function(msg) {
    $("#wrapper").prepend('<div class="error-msg">'+msg+'</div>');
  };
  
  var hideError = function() {
    $(".error-msg").hide();
  };
  
  var showLoader = function() {
    $(nodesContainer).html('<div class="loader">Loading..</div>');
  };
  
  var showStatus = function() {
    $(serviceStatusContainer).slideDown();
    $(lastUpdateEl).fadeIn();
    showLoader();
    var output = "", statuses = {up:0, down:0};
     
    function loadData() {
      hideError();
      
      $.ajax({
        url: "statuses.json",
        type: "GET",
        dataType: "json",
        success: function(data) {
          $.each(data, function(i, node) {
            nodes.push(node.uri);
            output += Mustache.to_html(statusTmpl, {uri: node.uri, status: getStatus(node.status)});
            if(node.status === "true") {
              statuses.up++;
            } else {
              statuses.down++;
            }
          });
          updateStatuses(statuses);
        },
        error: function() { showError("Sorry, couldn't load data."); }
      });
      
      $(nodesContainer).ajaxComplete(function(){
        updateTime();
        $(this).html(output);
        output = "", statuses = {up:0, down:0};
      });
    }
    
    loadData();
    //startInt(loadData);
  };
  
  var showUptime = function(startTime, endTime) {
    var output = "";
    stopInt();
    showLoader();
    hideError();
    $(serviceStatusContainer).slideUp();
    $(lastUpdateEl).fadeOut();
    var loaded = 0;
    
    $.each(nodes, function(i, n){
      $.get(
        "uptime",
        {start_time: "2011-10-01 12:22:26", end_time: "2011-10-20 12:22:26", node: n},  
        function(uptimeResult) {
          output += Mustache.to_html(uptimeTmpl, {uri: n, uptime: uptimeResult});
        }
      );
    });
    
    $(nodesContainer).ajaxComplete(function() {
      loaded++;
      if(loaded === nodes.length) {
        $(this).html(output);
        output = "";
        loaded = 0;
      }
    });
    
    //startTime = (startTime.length > 0) ? "" : "";
    //endTime = (endTime.length > 0) ? "" : "";
  };
  
  var showStats = function() {
    var activeClass = 'active';
    
    $('#filter-options a').click(function(){
      var el = $(this).parent();
      var elId = el.attr('id');
      stopInt();
      
      // Set active class
      $('#filter-options li').removeClass(activeClass);
      el.addClass(activeClass);
      
      // Update view based on selection
      switch(elId) {
        case 'last-month':
          showUptime();
        break;
        
        case 'custom-period':
          // get time
          var startTime = "";
          var endTime = "";
          showUptime(startTime, endTime);
        break;
        
        default:
          showStatus();
      }
      
      return false;
    });
    
    if($('#filter-options li').hasClass('active')){
      showStatus();
    }
  };
  
  return {
    showStats: showStats
  };
})(jQuery);


$(document).ready(function() {
  StatusBoard.showStats();
});