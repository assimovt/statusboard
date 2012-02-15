require 'rubygems'
require 'bundler/setup'
require 'rspec/core/rake_task'
require 'dm-serializer/to_json'

task :default => :test
task :test => :spec

TO_FROM_JSON_FILE = 'statuses.json'

Dir["tasks/*.rake"].sort.each { |ext| load ext }

if !defined?(RSpec)
  puts "spec targets require RSpec"
else
  desc "Run all examples"
  RSpec::Core::RakeTask.new(:spec) do |t|
    #t.pattern = 'spec/**/*_spec.rb' # not needed this is default
    t.rspec_opts = ['-cfs']
  end
end

namespace :db do
  desc 'Auto-migrate the database (destroys data)'
  task :migrate => :environment do
    DataMapper.auto_migrate!
  end

  desc 'Auto-upgrade the database (preserves data)'
  task :upgrade => :environment do
    DataMapper.auto_upgrade!
  end
end

namespace :status do
  desc 'Update status for the nodes'
  task :update => :environment do
    Status.update_all
  end
  
  desc 'Export all statuses to json'
  task :export_to_json => :environment do
    raise "#{TO_FROM_JSON_FILE} already exists. Please, remove it first!" if File.exist?(TO_FROM_JSON_FILE)
    File.open(TO_FROM_JSON_FILE, 'w') do |f|
      Status.all.each { |s| f.write(s.to_json + "\n") }
    end
  end
  
  desc 'Import statuses from json'
  task :import_from_json => :environment do
    raise "#{TO_FROM_JSON_FILE} does not exist." unless File.exist?(TO_FROM_JSON_FILE)

    File.open(TO_FROM_JSON_FILE, 'r') do |f|
      while (line = f.gets)
        status = JSON.parse(line)
        if !status.is_a?(Hash) || !status.has_key?('uri') || !status.has_key?('updated_at') || !status.has_key?('value')
          puts "Invalid line! Skipped: #{line}"
          next
        end
        Status.create(:uri => status['uri'], :value => status['value'], :updated_at => status['updated_at'])
        print "."
      end
    end
    
  end
  
end

task :environment do
  require File.join(File.dirname(__FILE__), 'config/environment.rb')
end
