var StatusBoard = StatusBoard || {};

StatusBoard.Uptime = {
  serviceUptimeContainer: '#service-uptime',
  uptimeTmpl: '<div class="node"><span class="name">{{uri}}</span><span class="node-status wide"><span class="progress" style="width: {{width}}px;"></span><span class="uptime">{{uptime}}%</span></span></div>',

  init: function() {
    this.enableDatePicker();
    this.showUptime();
  },
  
  // Initialize datePicker for uptime period selection
  enableDatePicker: function() {    
    // Set default dates
    if($('#from').val().length === 0 && $('#to').val().length === 0) {
      var dateTime = new Date();
      var year = dateTime.getFullYear();
      var startMonth = dateTime.getMonth() + 1;
      var endMonth = dateTime.getMonth()+1;
      var day = dateTime.getDate();
      var startDate = day+"."+startMonth+"."+year;
      var endDate = day+"."+endMonth+"."+year;
      
      $('#from').val(startDate);
      $('#to').val(endDate);
      
      $('#actualdate-from').val(Utils.convertToTimestamp(year, startMonth, day, 0, 0, 0));
      $('#actualdate-to').val(Utils.convertToTimestamp(year, endMonth, day, 0, 0, 0));
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
  },
  
  getUptimePeriodStartDate: function() {
    var date = $('#actualdate-from').val();
    
    // Fix date format to Unix timestamp
    if(date.length === 13) {
      date = date/1000;
    }
    
    return date;
  },
  
  getUptimePeriodEndDate: function() {
    var date = $('#actualdate-to').val();
    
    // Fix date format to Unix timestamp
    if(date.length === 13) {
      date = date/1000;
    }
    
    return parseInt(date, 10) + (60*60*23 + 59*60 +59);
  },
  
  enablePeriodUpdate: function() {
    var self = this;
    $('#update-uptime').fadeIn('fast').one('click', function(){
      self.showUptime();
      $(this).fadeOut('fast');
      return false;
    });
  },

  showUptime: function() {
    var self = this,
        output = "",
        statuses = [],
        nodesLoaded = 0,
        total = "",
        wholeNodeUri = "whole", 
        startTime = self.getUptimePeriodStartDate(),
        endTime = self.getUptimePeriodEndDate();
    
    // Fetch all nodes
    var nodesRequest = $.ajax({
        url: "statuses.json",
        type: "GET",
        dataType: "json"});
      
    nodesRequest.done(function(nodes) {
      // Add "whole" node for retrieving total uptime
      nodes.push({"status":"", "timestamp":"", "uri":wholeNodeUri, "host":""});
      
      // Fetch uptime for each node
      $.each(nodes, function(i, node) {
        var nodeUri = node.uri;
        var uptimeRequest = $.ajax({
          url: "uptime",
          type: "GET",
          data: {start_time: startTime, end_time: endTime, node: nodeUri}
        });
        
        uptimeRequest.done(function(uptime) {
          nodesLoaded++;

          if(uptime.length === 0) { uptime = 0; }
          
          if (nodeUri === wholeNodeUri) {
            total = uptime;
          } else {
            statuses.push([nodeUri, uptime]);
          }
          
          // Check that uptimes for all nodes have been loaded
          if(nodesLoaded === nodes.length) {
            // Sort statuses
            statuses.sort();
            $.each(statuses, function(i, n) {
              output += Mustache.to_html(self.uptimeTmpl, {uri: n[0], uptime: n[1], width: Math.round(n[1])});
            })
          
            $(self.serviceUptimeContainer).find('.total-uptime > dd').addClass('uptime').html(total + "%");
            Utils.showData(output);
            self.enablePeriodUpdate();
          }
        });
        
        uptimeRequest.fail(function(data) {
          Utils.showData();
        });
      });
    });
    
    nodesRequest.fail(function(data) {
      Utils.showData();
    });
  }
};