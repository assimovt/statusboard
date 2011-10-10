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
  # node - The String uri of the node
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
    status = {}
    Node.all.each do |uri|
      s = self.first(:uri => uri, :order => [ :updated_at.desc ], :limit => 1)
      next unless s
      status[s.uri] = { :timestamp => s.updated_at, :status => s.value, :uri => s.uri }
    end
    return status
  end
  
end
