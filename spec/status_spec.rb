require "#{File.dirname(__FILE__)}/spec_helper"

describe 'status' do
  before(:each) do
    @status = Status.new(:updated_at => Time.now, :value => true, :uri => 'http://example.com/status')
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
  
end
