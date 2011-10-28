StatusBoard = (function($) {
  var refreshRate = 2000,
      serviceStatusContainer = '#service-status',
      serviceUptimeContainer = '#service-uptime',
      lastUpdateEl = '#last-updated',
      uptimePeriodEl = '#uptime-period',
      nodesContainer = '#nodes',
      statusTmpl = '<div class="node"><span class="name">{{uri}}</span><span class="node-status"><span class="status {{status}}"></span></span></div>',
      uptimeTmpl = '<div class="node"><span class="name">{{uri}}</span><span class="node-status wide"><span class="progress" style="width: {{uptime}}px;"></span><span class="uptime">{{uptime}}%</span></span></div>',
      timer = '',
      nodesCount = 0,
      nodes = [],
      ajaxRequests = [];
      
  var stopAjaxRequests = function() {
    $.each(ajaxRequests, function(i, request){
      request.abort();
      $.grep(ajaxRequests, function(value) {
        return value != request;
      });
    });
  };
  
  function dateToTimestamp(year,month,day,hours,minutes,seconds){
    var dateTime = new Date(Date.UTC(year,month-1,day,hours,minutes,seconds));
    return Math.round(dateTime.getTime()/1000);
  }
  
  var getUnixDateTime = function() {
    return Math.round((new Date()).getTime() / 1000);
  }
  
  var getCurrentDateTime = function(format, timestamp) {
    var output = "";
    var dt = {};
    var dateTime = (timestamp === 0) ? new Date() : new Date(timestamp*1000);
    
    dt.day = dateTime.getDate();
    dt.month = dateTime.getMonth() + 1;
    dt.year = dateTime.getFullYear();
    dt.hours = dateTime.getHours();
    dt.minutes = dateTime.getMinutes();
    dt.seconds = dateTime.getSeconds();
    
    // Prepend the zero when needed
    $.each(dt, function(i, d) {
      if(d < 10) {
        dt[i] = '0' + d;
      }
    });

    switch(format) {
      case 'y-m-d h:m:s':
        output = dt.year + "-" + dt.month + "-" + dt.day + " " + dt.hours + ":" + dt.minutes + ":" + dt.seconds;
      break;
      
      case 'd.m.y':
        output = dt.day + "." + dt.month + "." + dt.year;
      break;
      
      default:
        output = dt.day + "." + dt.month + "." + dt.year + " " + dt.hours + ":" + dt.minutes + ":" + dt.seconds;
    }
    
    return output;
  };
  
  var updateTime = function() {
    $(lastUpdateEl).find('.datetime').html(getCurrentDateTime('', 0));
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
    $.each(statuses, function(key, value) {
      var status = $("#service-status ." + key+"-status").find('.status');
      status.html(value);
      if(value > 0) {
        status.addClass(key);
      } else {
        status.removeClass(key);
      }
    });
  };
  
  var countStatuses = function(statuses, status) {
    if(status) {
      statuses.up++;
    } else {
      statuses.down++;
    }
    
    return statuses;
  };
  
  var showError = function(msg) {
    $("#wrapper").prepend('<div class="error-msg">'+msg+'</div>');
  };
  
  var hideError = function() {
    $(".error-msg").hide();
  };
  
  var showLoader = function() {
    // Show loader when ajaxRequest is made
    $(nodesContainer).ajaxStart(function() {
      $(nodesContainer).html('<div class="loader">Loading..</div>');
    });
  };
  
  var createNodesList = function(node) {
    if(nodes.length < nodesCount) {
      nodes.push(node);
    }
  };
  
  var showStatus = function() {
    var output = "", statuses = {up:0, down:0};
    $(serviceUptimeContainer).fadeOut(400, function(){
      $(serviceStatusContainer).fadeIn();
    });
    $(uptimePeriodEl).hide();
    $(lastUpdateEl).find('.datetime').html();
    $(lastUpdateEl).fadeIn();
     
    function loadData() {
      var jqxhr = $.ajax({
        url: "statuses.json",
        type: "GET",
        dataType: "json",
        success: function(data) {
          $.each(data, function(i, node) {
            countStatuses(statuses, node.status);
            output += Mustache.to_html(statusTmpl, {uri: node.uri, status: getStatus(node.status)});
            nodesCount++;
            createNodesList(node.uri);
          });
          updateStatuses(statuses);
        },
        error: function() { showError("Sorry, couldn't load data."); }
      });
      
      //ajaxRequests.push(jqxhr);
      
      $(nodesContainer).ajaxComplete(function() {
        updateTime();
        $(this).html(output);
        output = "";
        nodesCount = 0;
        statuses = {up:0, down:0};
      });
    }
    
    loadData();
    //startInt(loadData);
  };
  
  var showUptime = function(startTime, endTime) {
    var output = "", loaded = 0, totalUptime = 0;
    //stopInt();
    $(serviceStatusContainer).fadeOut(400, function(){
      $(serviceUptimeContainer).fadeIn();
    });

    $(lastUpdateEl).fadeOut();
    $.each(nodes, function(i, n) {
      var jqxhr = $.ajax({
        url: "uptime",
        type: "GET",
        data: {start_time: startTime, end_time: endTime, node: n},
        success: function(data) {
          if(data.length === 0) {
            data = 0;
          }else {
            data = Math.round(data);
          }
          totalUptime += data;
          output += Mustache.to_html(uptimeTmpl, {uri: n, uptime: data});
        },
        error: function() { showError("Sorry, couldn't load data."); }
      });
    });
    
    $(nodesContainer).ajaxComplete(function() {
      loaded++;
      
      if(loaded === nodes.length) {
        $(serviceUptimeContainer).find('.total-uptime > dd').addClass('uptime').html(totalUptime/nodes.length + " %");
        $(uptimePeriodEl).find('.date-from').html(getCurrentDateTime('d.m.y', startTime));
        $(uptimePeriodEl).find('.date-to').html(getCurrentDateTime('d.m.y', endTime));
        $(uptimePeriodEl).fadeIn();
        $(this).html(output);
        output = "";
        loaded = 0;
      }
    });
  };
  
  var showStats = function() {
    var activeClass = 'active';
    showLoader();
    
    $('#filter-options a').click(function(){
      var el = $(this);
      var activeTab = el.attr("href");
      hideError();
      //stopAjaxRequests();
      //stopInt();
      
      // Set active class
      $('#filter-options li').removeClass(activeClass);
      el.parent().addClass(activeClass);
      
      // Switch the view based on selection
      switch(activeTab) {
        case '#uptime':
          var dateTime = new Date();
          var year = dateTime.getFullYear();
          var month = dateTime.getMonth() + 1;
          var day = dateTime.getDate();
          var startTime = dateToTimestamp(year, month, 1, 0, 0, 0);
          var endTime = getUnixDateTime();
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