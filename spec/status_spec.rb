require "#{File.dirname(__FILE__)}/spec_helper"

describe 'status' do
  
  include StatusHelper
  
  before do
    @status = Status.new(:updated_at => Time.now, :value => true, :uri => 'http://example.com/status')
    @node = Node.new('http://example.com/status')
    Node.stub!(:all).and_return(['http://example.com/status'])
  end

  it 'should be valid' do
    @status.should be_valid
  end

  it 'should require updated_at' do
    @status = Status.new
    @status.should_not be_valid
    @status.errors[:updated_at].should include("Timestamp must not be blank")
  end
  
  it 'should require uri' do
    @status = Status.new
    @status.should_not be_valid
    @status.errors[:uri].should include("Uri must not be blank")
  end
  
  it 'should require value' do
    @status = Status.new
    @status.should_not be_valid
    @status.errors[:value].should include("Value must not be blank")
  end
  
  it 'should set value to true when node is up' do
    stub_request(:get, /.*example.com.*/).to_return(:body => 'OK', :status => 200)
    Status.update(@node).should be_true
    status = Status.first(:uri => 'http://example.com/status')
    status.should be_true
    status.value.should be_true
    # max 10 min for tests to pass
    (status.updated_at.strftime("%s").to_i + 600 > Time.now.to_i).should be_true
  end
  
  it 'should set value to false when node is down' do
    stub_request(:get, /.*example.com.*/).to_return(:body => 'NOT', :status => 422)
    Status.update(@node).should be_true
    status = Status.first(:uri => 'http://example.com/status')
    status.should be_true
    status.value.should be_false
    # max 10 min for tests to pass
    (status.updated_at.strftime("%s").to_i + 600 > Time.now.to_i).should be_true
  end
  
  it 'should return a hash of status for all nodes' do
    stub_request(:get, /.*example.com.*/).to_return(:body => 'OK', :status => 200)
    Status.update(@node)
    statuses = Status.current
    statuses.first.should be_true
    statuses.first[:uri].should eql(@node.uri)
    statuses.first[:status].should be_true
    statuses.first[:host].should eql('example.com')
    (statuses.first[:timestamp].strftime("%s").to_i + 600 > Time.now.to_i).should be_true
  end
  
  it 'should calculate uptime' do
    6.times { Status.create(:updated_at => Time.now, :value => true,  :uri => 'http://test.uptime/status') }
    1.times { Status.create(:updated_at => Time.now, :value => false, :uri => 'http://test.uptime/status') }
    node = Node.new('http://test.uptime/status')
    Status.uptime(Time.now, Time.now, node).should == "85.71"
  end
  
  it 'should return nil for uptime if no statuses' do
    Status.uptime(Time.now, Time.now, @node).should be_nil
  end
  
  context 'fetch feed with down' do
    
    before do
      stub_request(:get, /.*example.com\/rss.atom/).to_return(:body => mock_feed(:down), :status => 200)
      @feed = Status.feed
    end
    
    it 'should return no feed if author is not in whitelist' do
      Status.stub!(:feed_whitelist).and_return(['Ignored user'])
      Status.feed.should be_empty
    end
    
    it 'should return valid feed hash' do
      @feed.should_not be_empty
    end
    
    it 'should have valid data in feed' do
      @feed.has_key?(:date).should be_true
      @feed[:author].should match(/Quentin/)
      @feed[:content].should match(/Status content/)
      @feed[:link].should match(/example.com/)
    end
    
    it 'should not have down tag in feed' do
      @feed[:content].should_not match(/#{APP_CONFIG['feeds_down_tag']}/)
    end
    
  end
  
  
  context 'fetch feed with up' do
    
    before do
      stub_request(:get, /.*example.com\/rss.atom/).to_return(:body => mock_feed(:up), :status => 200)
    end
    
    it 'should return no feed if latest feed has up tag' do
      Status.feed.should be_empty
    end
    
  end
  
  
  
end
