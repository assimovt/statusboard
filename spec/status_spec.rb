require "#{File.dirname(__FILE__)}/spec_helper"

describe 'status' do
  before(:each) do
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
    statuses.has_key?(@node.uri).should be_true
    statuses[@node.uri][:uri].should eql(@node.uri)
    statuses[@node.uri][:status].should be_true
    (statuses[@node.uri][:timestamp].strftime("%s").to_i + 600 > Time.now.to_i).should be_true
  end
  
  
  
end
