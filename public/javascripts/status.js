var StatusBoard = StatusBoard || {};

StatusBoard.Status = {
  serviceStatusContainer: '#service-status',
  lastUpdateEl: '#last-updated',
  downtimeMessageEl: '#downtime-message',
  nodesContainer: '#nodes',
  nodeStatusTmpl: '<div class="node"><span class="name">{{uri}}</span><span class="node-status"><span class="status {{status}}"></span></span></div>',
  serviceUpText: ' is up',
  serviceDownText: ' is down',
  failedRequests: 0,
  updateInterval: 6000,
  showDowntimeMessage: true,
  
  init: function() {
    this.getStatusData();
  },
  
  updateTime: function() {
    $(this.lastUpdateEl).find('.datetime').html(Utils.getDateTime('', 0));
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
      
      // Show downtime message
      if(this.showDowntimeMessage) {
        if($(this.downtimeMessageEl+":hidden")) {
          $(this.downtimeMessageEl).slideDown('fast');
        }
      }
    } else {
      statusText += this.serviceUpText;
      statusClass = 'service-up';
      $(this.downtimeMessageEl+":visible").hide();
    }
    
    $(this.serviceStatusContainer).removeClass().addClass(statusClass).find('h1').html(statusText);
  },
  
  getStatusData: function() {
    var self = this,
        output = "",
        nodesUp = 0,
        nodesDown = 0;
        
    var request = $.ajax({
        url: "statuses.json",
        type: "GET",
        dataType: "json"});
      
    request.done(function(data) {
      $.each(data, function(i, node) {
        if(node.status) {
          nodesUp++;
        } else {
          nodesDown++;
        }
        output += Mustache.to_html(self.nodeStatusTmpl, {uri: node.uri, status: self.getStatusClass(node.status)});
      });

      self.setGlobalStatus(nodesUp, nodesDown);
      $(self.nodesContainer).html(output);
      self.updateTime();
            
      // Recurse on success
      setTimeout(function() { self.init(); }, self.updateInterval);
    });
    
    request.fail(function() {
      //this.errorHandler();
      $.proxy(this.errorHandler, this);
      Utils.showError("Sorry, couldn't load data."); 
    });
  },
 
   // Handle errors
  errorHandler: function(){
    if(++this.failedRequests < 10){
      // Give the server some breathing room by increasing the updateInterval
      this.updateInterval += 1000;

      // recurse
      this.init();
    }
  }
};