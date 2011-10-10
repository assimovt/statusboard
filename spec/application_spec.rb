require "#{File.dirname(__FILE__)}/spec_helper"

describe 'main application' do
  include Rack::Test::Methods

  def app
    Sinatra::Application.new
  end
  
  before do
    Node.stub!(:all).and_return(['http://example.com/status'])
    Status.create(:updated_at => Time.now, :value => true, :uri => 'http://example.com/status')
  end

  it 'should show the default index page' do
    get '/'
    last_response.should be_ok
  end
  
  it 'should get node statuses as json' do
    get '/nodes.json'
    last_response.should be_ok
    json = JSON.parse(last_response.body)
    json['http://example.com/status'].should_not be_nil
    json['http://example.com/status']['status'].should be_true
  end

  it 'should have more specs' do
    pending
  end
  
  
  
end
