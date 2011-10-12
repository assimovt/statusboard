StatusBoard = (function($) {
  var refreshRate = 1000,
      serviceStatusEl = '#service-status',
      lastUpdateEl = '#last-updated',
      statusTmpl = '<div class="node"><span class="name">{{uri}}</span><span class="node-status"><span class="status {{status}}"></span></span></div>',
      uptimeTmpl = '<div class="node"><span class="name">{{uri}}</span><span class="node-status wide"><span class="progress" style="width: {{uptime}}px;"></span><span class="uptime">{{uptime}}%</span></span></div>',
      timer = '';
  
  var updateTime = function() {
    var currentTime = new Date();
    $('.datetime').html(currentTime.getDate() + "." + (currentTime.getMonth()+1) + "."+ currentTime.getFullYear() + " " + currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds());
    
  };
  
  var startInt = function(func) {
    if(timer === "") {
      console.log("Interval started for " + showStatus.typeof);
      timer = window.setInterval(func.apply, refreshRate);
    }else{
      stopInt();
    }
  };

  var stopInt = function(func) {
    if(timer !== "") {
      window.clearInterval(timer);
      timer = "";
      console.log("Interval stopped");
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
  
  var showStatus = function() {
    var output = "", statuses = { up:0, down:0};
    var obj = jQuery.parseJSON('[{"timestamp":"12:00", "status":false, "uri":"server 3"}, {"timestamp":"12:00", "status":true, "uri":"server 1"}, {"timestamp":"13:00", "status":true, "uri":"server 2"}]');
    $(serviceStatusEl).slideDown();
    $(lastUpdateEl).fadeIn();
    //$.getJSON(url+query,function(json){});
    
    $.each(obj, function(i, node) {
      output += Mustache.to_html(statusTmpl, {uri: node.uri, status: getStatus(node.status)});
      if(node.status) {
        statuses.up += 1;
      } else {
        statuses.down += 1;
      }
    });

    updateStatuses(statuses);
    $("#nodes").html(output);
    updateTime();
  };
  
  var showUptime = function(startTime, endTime) {
    var output = "";
    $(serviceStatusEl).slideUp();
    $(lastUpdateEl).fadeOut();
    var obj = jQuery.parseJSON('[{"timestamp":"12:00", "status":true, "uri":"server 1"}, {"timestamp":"13:00", "status":true, "uri":"server 2"}]');
    
    //startTime = (startTime.length > 0) ? "" : "";
    //endTime = (endTime.length > 0) ? "" : "";
    
    $.each(obj, function(i, node) {
      // Request node uptime
      output += Mustache.to_html(uptimeTmpl, {uri: node.uri, uptime: 3});
    });
    
    $("#nodes").html(output);
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
  }
  return {
    showStats: showStats
  };
})(jQuery);


$(document).ready(function() {
  StatusBoard.showStats();
});