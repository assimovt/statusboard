require "#{File.dirname(__FILE__)}/spec_helper"

describe 'node' do

  it 'should be valid' do
    Node.new('http://example.com/status').should be_true
  end
  
  it 'should raise error when URI is invalid' do
    lambda { Node.new('invalid').should }.should raise_error(ArgumentError)
  end

end
