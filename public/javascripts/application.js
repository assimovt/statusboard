var Utils = {
  nodesContainer: '#nodes',

  convertToTimestamp: function(year,month,day,hours,minutes,seconds){
    var dateTime = new Date(Date.UTC(year,month-1,day,hours,minutes,seconds));
    return Math.round(dateTime.getTime()/1000);
  },

  getCurrentTimestamp: function() {
    return Math.round((new Date()).getTime() / 1000);
  },
  
  getDateTime: function(format, timestamp) {
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
  },
  
  showError: function(msg) {
    if(msg === "") {
      msg = "Sorry, couldn't load data. Please try again later.";
    }
    $(nodesContainer).html('<div class="loader">'+msg+'</div>');
  },
  
  // Show loader when ajaxRequest is made
  showLoader: function() {
    $(nodesContainer).ajaxStart(function() {
     // $(nodesContainer).html('<div class="loader">Loading..</div>');
    });
  },
  
  setNavActiveClass: function(el) {
    $(el).parent().addClass('active');
  }
};

$(document).ready(function() {
  if ($('#service-status').length) {
    Utils.setNavActiveClass('#status-link');
    StatusBoard.Status.init();
  }
  
  if ($('#service-uptime').length) {
    Utils.setNavActiveClass('#uptime-link');
    StatusBoard.Uptime.init();
  }
  
  if ($('#service-log').length) {
    Utils.setNavActiveClass('#log-link');
  }
});