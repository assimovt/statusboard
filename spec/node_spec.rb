require "#{File.dirname(__FILE__)}/spec_helper"

describe 'node' do
  
  before(:each) do
    @node = Node.new('http://example.com/status')
  end

  it 'should be valid' do
    @node.should be_true
  end
  
  it 'should raise error when URI is invalid' do
    lambda { Node.new('invalid').should }.should raise_error(ArgumentError)
  end
  
  it 'should set value to true when node is up' do
    stub_request(:get, /.*example.com.*/).to_return(:body => 'OK', :status => 200)
    @node.update.should be_true
    status = Status.first(:uri => 'http://example.com/status')
    status.should be_true
    status.value.should be_true
    # max 10 min for tests to pass
    (status.updated_at.strftime("%s").to_i + 600 > Time.now.to_i).should be_true
  end
  
  it 'should set value to false when node is down' do
    stub_request(:get, /.*example.com.*/).to_return(:body => 'NOT', :status => 422)
    @node.update.should be_true
    status = Status.first(:uri => 'http://example.com/status')
    status.should be_true
    status.value.should be_false
    # max 10 min for tests to pass
    (status.updated_at.strftime("%s").to_i + 600 > Time.now.to_i).should be_true
  end

end
