class Status
  include DataMapper::Resource

  property :id,         Serial
  property :value,      Boolean,  :required => true
  property :updated_at, DateTime, :required => true

  validates_presence_of :value, :message => 'Value must not be blank'
  validates_presence_of :updated_at, :message => 'Timestamp must not be blank'
end
