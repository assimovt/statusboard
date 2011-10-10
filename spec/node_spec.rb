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
  
  it 'should list all nodes' do
    Node.all.should eql(['http://host1.example.com/status', 'http://host2.example.com/status'])
  end

end
