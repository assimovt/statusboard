class Status
  include DataMapper::Resource

  property :id,         Serial
  property :value,      Boolean,  :required => true
  property :updated_at, DateTime, :required => true
  property :uri,        String,   :required => true

  validates_presence_of :value, :message => 'Value must not be blank'
  validates_presence_of :updated_at, :message => 'Timestamp must not be blank'
  
  
  # Public: Updates a node with a status
  #
  # node - The Node object
  #
  # Returns true on success, otherwise false
  def self.update(node)
    begin
      response = RestClient.get node.uri
      status = response.code == 200
    rescue => ex
      status = false
    end
    result = self.create(:updated_at => Time.now, :value => status, :uri => node.uri)
    result.saved?
  end
  
  
  # Public: Get the current status of all nodes
  #
  # Returns hash of statuses for every node with data
  def self.current
    statuses = {}
    Node.all.each do |uri|
      s = self.first(:uri => uri, :order => [ :updated_at.desc ], :limit => 1)
      next unless s
      statuses[s.uri] = { :timestamp => s.updated_at, :status => s.value, :uri => s.uri }
    end
    statuses
  end
  
  
  # Public: Get the uptime for the given period and node
  #
  # start_time The Time start
  # end_time   The Time end
  # node       The Node object
  #
  # Returns String uptime of the node or nil if statuses not found
  def self.uptime(start_time, end_time, node)
    uptimes   = 0
    downtimes = 0
    
    self.all(:uri => node.uri, :updated_at.gte => start_time, :updated_at.lte => end_time).each do |status|
      uptimes   += 1 if  status.value
      downtimes += 1 if !status.value
    end
    
    return nil if uptimes == 0 && downtimes == 0
    
    # Availability = (Uptime / (Uptime + Downtime)) x 100
    '%.2f' % ((uptimes.to_f / (uptimes + downtimes).to_f ) * 100.0)
  end
  
end
