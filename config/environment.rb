require 'rubygems'
require 'bundler/setup'
require 'dm-core'
require 'dm-timestamps'
require 'dm-validations'
require 'dm-aggregates'
require 'dm-migrations'
require 'haml'
require 'ostruct'
require 'rest_client'
require 'json'
require 'simple-rss'
require 'open-uri'
require 'mail'

require 'sinatra' unless defined?(Sinatra)

APP_CONFIG = YAML.load_file("#{File.dirname(__FILE__)}/status.yml")[Sinatra::Base.environment.to_s]

configure do
  # load models
  $LOAD_PATH.unshift("#{File.dirname(__FILE__)}/../lib")
  Dir.glob("#{File.dirname(__FILE__)}/../lib/*.rb") { |lib| require File.basename(lib, '.*') }

  DataMapper.setup(:default, (APP_CONFIG['db_url'] || "sqlite3:///#{File.expand_path(File.dirname(__FILE__))}/../db/#{Sinatra::Base.environment}.db"))
end

if APP_CONFIG['feed_url'].match(/^https:\/\//) && APP_CONFIG['feed_url_ssl_no_verify']
  OpenSSL::SSL::VERIFY_PEER = OpenSSL::SSL::VERIFY_NONE
end