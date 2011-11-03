var StatusBoard = StatusBoard || {};

StatusBoard.Uptime = {
  nodesContainer: '#nodes',
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
      var startMonth = dateTime.getMonth();
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
    $('#update-uptime').click(function(){
      self.showUptime();
      $(this).unbind('click');
    });
  },

  showUptime: function() {
    var self = this,
        output = "",
        loaded = 0,
        nodes = '',
        startTime = self.getUptimePeriodStartDate(),
        endTime = self.getUptimePeriodEndDate();
    
    var nodesRequest = $.ajax({
        url: "statuses.json",
        type: "GET",
        dataType: "json"});
      
    nodesRequest.done(function(data) {
      $.each(data, function(i, node) {
        var uptimeRequest = $.ajax({
          url: "uptime",
          type: "GET",
          data: {start_time: startTime, end_time: endTime, node: node.uri}
        });
        
        uptimeRequest.done(function(uptime) {
          if(uptime.length === 0) {
            uptime = 0;
          }
          output += Mustache.to_html(self.uptimeTmpl, {uri: node.uri, uptime: uptime, width: Math.round(uptime)});
          $(self.nodesContainer).html(output);
          self.enablePeriodUpdate();
        
          //$(serviceUptimeContainer).find('.total-uptime > dd').addClass('uptime').html(100 + " %");              
        });
        
        uptimeRequest.fail(function(data) {
          Utils.showError();
        });
      });
    });
    
    nodesRequest.fail(function(data) {
      Utils.showError();
    });
  }
};