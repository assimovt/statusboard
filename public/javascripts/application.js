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
      dt[i] = ("0" + d).slice(-2);
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
  
  showData: function(data, wrapData) {
    if(data === undefined) {
      data = "Sorry, couldn't load data. Please try again later.";
      if(wrapData === undefined) {
        wrapData = true;
      }
    }

    if(wrapData) {
      data = '<div class="loader">' + data + '</div>';
    }
    
    $(this.nodesContainer).html(data);
  },
  
  // Show loader when ajaxRequest is made
  showLoader: function() {
    var spinner = null;
    var opts = {
      lines: 10, // The number of lines to draw
      length: 4, // The length of each line
      width: 3, // The line thickness
      radius: 6, // The radius of the inner circle
      color: '#CCC', // #rgb or #rrggbb
      speed: 1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false // Whether to render a shadow
    };

    // Show loader when ajaxRequest is made
    $('#loader').ajaxStart(function() {
      spinner = new Spinner(opts).spin(this);
    }).ajaxStop(function() {
      spinner.stop();
    });
  },
  
  openExternalLinks: function() {
     $("body").delegate('a[rel="external"]', "click", function() {
      window.open($(this).attr('href'));
      return false;
    });
  },
  
  setNavActiveClass: function(el) {
    $(el).parent().addClass('active');
  }
};

$(document).ready(function() {
  Utils.showLoader();
  Utils.openExternalLinks();
  
  if ($('#service-status').length) {
    Utils.setNavActiveClass('#status-link');
    StatusBoard.Status.init();
  }
  
  if ($('#service-uptime').length) {
    Utils.setNavActiveClass('#uptime-link');
    StatusBoard.Uptime.init();
  }
});