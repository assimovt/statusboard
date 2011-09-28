require "#{File.dirname(__FILE__)}/spec_helper"

describe 'status' do
  before(:each) do
    @status = Status.new(:updated_at => Time.now, :value => true)
  end

  specify 'should be valid' do
    @status.should be_valid
  end

  specify 'should require updated_at' do
    @status = Status.new
    @status.should_not be_valid
    @status.errors[:updated_at].should include("Timestamp must not be blank")
  end
  
  specify 'should require value' do
    @status = Status.new
    @status.should_not be_valid
    @status.errors[:value].should include("Value must not be blank")
  end
  
end
