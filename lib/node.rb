class Node

  attr_accessor :host, :uri
  
  def initialize(uri)
    @uri = uri
    @host = uri.match(/^https?:\/\/(.+)\//)[1] rescue false
    
    raise ArgumentError, "URI is invalid" unless @host
  end
  
end