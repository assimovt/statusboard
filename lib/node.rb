class Node

  attr_accessor :host, :uri
  
  def initialize(uri)
    @uri = uri
    @host = uri.match(/^https?:\/\/(.+)\//)[1] rescue false
    
    raise ArgumentError, "URI is invalid" unless @host
  end


  def update
    begin
      response = RestClient.get uri
      status = response.code == 200
    rescue => ex
      status = false
    end
    result = Status.create(:updated_at => Time.now, :value => status, :uri => uri)
    result.saved?
  end
  
end