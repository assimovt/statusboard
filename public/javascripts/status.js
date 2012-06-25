var StatusBoard = StatusBoard || {};

StatusBoard.Status = {
  serviceStatusContainer: '#service-status',
  lastUpdateEl: '#last-updated',
  downtimeMessageEl: '#downtime-message',
  nodeStatusTmpl: '<div class="node"><span class="name"><a href="{{uri}}">{{uri}}</a></span><span class="node-status"><span class="status {{status}}"></span></span></div>',
  serviceUpText: ' is up',
  serviceDownText: ' is down',
  failedRequests: 0,
  updateInterval: 6000,
  
  init: function() {
    this.getStatusData();
    this.toggleStatusMessage();
  },
  
  updateTime: function(time) {
    $(this.lastUpdateEl).find('.datetime').html(time);
  },
  
  getStatusClass: function(status) {
    return (status) ? 'up':'down'; 
  },

  setGlobalStatus: function(nodesUp, nodesDown) {
    var statusText = $('#app-name').val(),
        statusClass = '';
     
    if(nodesDown > 0 && nodesUp === 0) {
      statusText += this.serviceDownText;
      statusClass = 'service-down';
    } else {
      statusText += this.serviceUpText;
      statusClass = 'service-up';
    }
    
    $(this.serviceStatusContainer).removeClass().addClass(statusClass).find('h1').html(statusText);
  },
  
  // Remove unnecessary html from from the feed and build the message
  cleanupAndShowFeedContent: function(data) {
    var self = this;
    
    if(data.author !== undefined) {
      output = ' <strong>' + data.author + '</strong>';
    }
  
    if(data.date !== undefined) {
      output += ' <span>on</span> ' + data.date;
    }
    
    if(data.link !== undefined) {
      output += '. <a href="'+data.link+'" rel="external">View message</a>';
    }
    
    $(this.downtimeMessageEl).html(data.content + '<p class="meta"><span>Published by:</span> ' + output + '</p>');
  },
  
  // Fetch status message from the RSS feed
  toggleStatusMessage: function() {
    var self = this;
        output = '';
    
    var feedRequest = $.ajax({
      url: "feed.json",
      type: "GET",
      dataType: "json"});
    
    feedRequest.done(function(data) {
      if(data.content !== undefined) {
        self.cleanupAndShowFeedContent(data);
        
        if($(self.downtimeMessageEl+":hidden")) {
          $(self.downtimeMessageEl).slideDown('fast');
        }
      } else {
        $(self.downtimeMessageEl).slideUp('fast');
      }
    });
  },
  
  // Fetch nodes' status
  getStatusData: function() {
    var self = this,
        output = "",
        nodesUp = 0,
        nodesDown = 0,
        status = 0,
        feedRequest = '',
        updatedAt = '';
        
    var request = $.ajax({
        url: "statuses.json",
        type: "GET",
        dataType: "json"});
      
    request.done(function(data) {
      if(data.length > 0) {
        $.each(data, function(i, node) {
          if(node.status) {
            nodesUp++;
          } else {
            nodesDown++;
          }
          output += Mustache.to_html(self.nodeStatusTmpl, {uri: node.uri, status: self.getStatusClass(node.status)});
          updatedAt = node.timestamp;          
        });
  
        self.setGlobalStatus(nodesUp, nodesDown);
        Utils.showData(output);
        self.updateTime(updatedAt);
      } else {
        Utils.showData("No data available at the moment", true);
      }
            
      // Recurse on success
      setTimeout(function() { self.init(); }, self.updateInterval);
    });
    
    request.fail(function() {
      self.errorHandler();
      Utils.showData(); 
    });
  },
 
   // Handle errors
  errorHandler: function() {
    if(++this.failedRequests < 10){
      // Give the server some breathing room by increasing the updateInterval
      this.updateInterval += 1000;

      // recurse
      this.init();
    }
  }
};