require "#{File.dirname(__FILE__)}/spec_helper"

describe 'main application' do
  
  include Rack::Test::Methods
  include StatusHelper

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
  
  it 'should get nodes statuses as json' do
    get '/statuses.json'
    last_response.should be_ok
    json = JSON.parse(last_response.body)
    json.first.should_not be_nil
    json.first['status'].should be_true
  end

  it 'should get uptime' do
    get '/uptime', :node => 'http://example.com/status', :start_time => 0, :end_time => Time.now.to_i
    last_response.should be_ok
    last_response.body.should == "100.00"
  end
  
  it 'should get the status feed in json' do
    stub_request(:get, /.*example.com\/rss.atom/).to_return(:body => mock_feed, :status => 200)
    get '/feed.json'
    last_response.should be_ok
    json = JSON.parse(last_response.body)
    json.should_not be_nil
    json['author'].should_not be_nil
    json['link'].should_not be_nil
    json['content'].should_not be_nil
    json['date'].should_not be_nil
  end
  
  
end
