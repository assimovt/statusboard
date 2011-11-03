var StatusBoard = (function($) {
  var refreshRate = 2000,
      serviceStatusContainer = '#service-status',
      serviceUptimeContainer = '#service-uptime',
      lastUpdateEl = '#last-updated',
      uptimePeriodEl = '#uptime-period',
      downtimeExplanationEl = '#downtime-explanation',
      nodesContainer = '#nodes',
      statusTmpl = '<div class="node"><span class="name">{{uri}}</span><span class="node-status"><span class="status {{status}}"></span></span></div>',
      uptimeTmpl = '<div class="node"><span class="name">{{uri}}</span><span class="node-status wide"><span class="progress" style="width: {{width}}px;"></span><span class="uptime">{{uptime}}%</span></span></div>',
      timer = '',
      nodesCount = 0,
      nodes = [],
      ajaxRequests = [];
  
  var stopInt = function() {
    if(timer !== "") {
      window.clearInterval(timer);
      timer = "";
    }
  };
  
  var startInt = function(func) {
    if(timer === "") {
      timer = window.setInterval(func, refreshRate);
    }else{
      stopInt();
    }
  };
  
  var addRequest = function(request) {
    ajaxRequests.push(request);
  };
  
  var stopAjaxRequests = function() {
    $.each(ajaxRequests, function(i, request) {
      request.abort();
      $.grep(ajaxRequests, function(value) {
        return value !== request;
      });
    });
  };
  
  var convertToTimestamp = function(year,month,day,hours,minutes,seconds){
    var dateTime = new Date(Date.UTC(year,month-1,day,hours,minutes,seconds));
    return Math.round(dateTime.getTime()/1000);
  };

  var getCurrentTimestamp = function() {
    return Math.round((new Date()).getTime() / 1000);
  };
  
  var getDateTime = function(format, timestamp) {
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
    $(lastUpdateEl).find('.datetime').html(getDateTime('', 0));
  };
  
  var getStatus = function(status) {
    return (status) ? 'up':'down'; 
  };

  var showOverallStatus = function(statuses) {
    var statusText = $('#app-name').val(),
        statusClass = '';
        
    if(statuses.down === nodes.length && statuses.up === 0) {
      statusText += ' is down';
      statusClass = 'service-down';
      $(downtimeExplanationEl).slideDown('fast');
    } else {
      statusText += ' is up';
      statusClass = 'service-up';
      $(downtimeExplanationEl).hide();
    }
    
    $(serviceStatusContainer).addClass(statusClass).find('h1').html(statusText);
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
    $(nodesContainer).html('<div class="loader">'+msg+'</div>');
  };
  
  // Show loader when ajaxRequest is made
  var showLoader = function() {
    $(nodesContainer).ajaxStart(function() {
      $(nodesContainer).html('<div class="loader">Loading..</div>');
    });
  };
  
  // Save list of existing nodes
  var createNodesList = function(node) {
    if(nodes.length < nodesCount) {
      nodes.push(node);
    }
  };
  
  // Initialize datePicker for uptime period selection
  var enableDatePicker = function() {    
    // Set default dates
    if($('#from').val().length === 0 && $('#to').val().length === 0) {
      var dateTime = new Date();
      var year = dateTime.getFullYear();
      var startMonth = dateTime.getMonth();
      var endMonth = dateTime.getMonth()+1;
      var day = dateTime.getDate();
      var startDate = day+"."+startMonth+"."+year;
      var endDate = day+"."+endMonth+"."+year;
      
      $('#from').val(startDate);
      $('#to').val(endDate);
      
      $('#actualdate-from').val(convertToTimestamp(year, startMonth, day, 0, 0, 0));
      $('#actualdate-to').val(convertToTimestamp(year, endMonth, day, 0, 0, 0));
    }
    
    // Enable datepicker
    $.datepicker.setDefaults({
      dateFormat: 'dd.mm.yy',
      altFormat: '@',
      changeMonth: true,
      showOn: "button",
      buttonImage: "images/calendar.gif",
      buttonImageOnly: true,
      buttonText: 'Choose date'});
  
    var dateFrom = $('#from').datepicker({
      altField: '#actualdate-from',
      onSelect: function(selectedDate) {
        dateTo.datepicker('option', 'minDate', dateFrom.datepicker('getDate'));
      }
    });
        
    var dateTo = $('#to').datepicker({
      altField: '#actualdate-to',
      onSelect: function(selectedDate) {
        dateFrom.datepicker('option', 'maxDate', dateTo.datepicker('getDate'));
      }
    });
  };
  
  var getUptimePeriodStartDate = function() {
    var date = $('#actualdate-from').val();
    
    // Fix date format to Unix timestamp
    if(date.length === 13) {
      date = date/1000;
    }
    
    return date;
  };
  
  var getUptimePeriodEndDate = function() {
    var date = $('#actualdate-to').val();
    
    // Fix date format to Unix timestamp
    if(date.length === 13) {
      date = date/1000;
    }
    
    date = parseInt(date, 10) + (60*60*23 + 59*60 +59);
    
    return date;
  };
  
  // Display service status
  var showStatus = function() {
    var output = "", statuses = {up:0, down:0};
    
    $(serviceUptimeContainer).hide();
    $(serviceStatusContainer).fadeIn(400, function() {
      $(uptimePeriodEl).hide();
      $(lastUpdateEl).fadeIn(400);
    });
     
    function loadData() {
      var request = $.ajax({
        url: "statuses.json",
        type: "GET",
        dataType: "json"});
      
      addRequest(request);
      
      request.done(function(data) {
        $.each(data, function(i, node) {
          countStatuses(statuses, node.status);
          output += Mustache.to_html(statusTmpl, {uri: node.uri, status: getStatus(node.status)});
          nodesCount++;
          createNodesList(node.uri);
        });
        
        showOverallStatus(statuses);
        $(nodesContainer).html(output);
        updateTime();
        output = "";
        nodesCount = 0;
        statuses = {up:0, down:0};
      });
      
      request.fail(function() {
        showError("Sorry, couldn't load data."); 
      });
    
      $(nodesContainer).ajaxComplete(function() {
       
      });
    }
    
    loadData();
  };
  
  // Display service uptime
  var showUptime = function() {
    var output = "", total = "", loaded = 0;
    
    $(serviceStatusContainer).hide();
    $(downtimeExplanationEl).hide();
    $(serviceUptimeContainer).fadeIn(400, function() {
      $(lastUpdateEl).hide();
      $(uptimePeriodEl).fadeIn(200);
    });
      
    enableDatePicker();
    var startTime = getUptimePeriodStartDate();
    var endTime = getUptimePeriodEndDate();
    
    $.each(nodes.concat("whole"), function(i, n) {
      var request = $.ajax({
        url: "uptime",
        type: "GET",
        data: {start_time: startTime, end_time: endTime, node: n}
      });
      addRequest(request);
      
      request.done(function(data) {
        loaded++;
        
        if(data.length === 0) {
          data = 0;
        }
        if (n == "whole") {
          total = Math.round(data);
        } else {
          output += Mustache.to_html(uptimeTmpl, {uri: n, uptime: data, width: Math.round(data)});
        }
      
        if(loaded === nodes.length + 1) {
          $(serviceUptimeContainer).find('.total-uptime > dd').addClass('uptime').html(total + " %");
          $(nodesContainer).html(output);
          output = "";
          loaded = 0;
        }
      });
      
      request.fail(function(data) {
        showError("Sorry, couldn't load data.");
      });
    });
    
    $(nodesContainer).ajaxComplete(function() {
      
    });
  };
  
  // Switch views
  var toggleStatus = function() {
    var activeClass = 'active';
    showLoader();
    
    $('.nav-link').click(function(){
      var el = $(this);
      var activeLink = el.attr("href");
      stopAjaxRequests();
      
      // Set active class for main navigation
      if(el.parents('#filter-options').length > 0) {
        $('#filter-options li').removeClass(activeClass);
        el.parent().addClass(activeClass);
      }
      
      // Switch the view based on the selection
      if(activeLink === '#uptime') {
        showUptime();
      } else {
        showStatus();
      }
      
      return false;
    });
    
    if($('#filter-options li').hasClass(activeClass)) {
      showStatus();
    }
  };
  
  return {
    toggleStatus: toggleStatus
  };
})(jQuery);


$(document).ready(function() {
  StatusBoard.toggleStatus();
});