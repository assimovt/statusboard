require 'rubygems'
require 'bundler/setup'
require 'compass'
require 'sinatra'
require 'sass'
require 'haml'

require File.join(File.dirname(__FILE__), 'config', 'environment')

# set sinatra's variables
set :app_file, __FILE__
set :root, File.dirname(__FILE__)
set :views, "views"
set :public, 'public'

configure do
  Compass.add_project_configuration(File.join(Sinatra::Application.root, 'config', 'compass.config'))
  set :views, "#{File.dirname(__FILE__)}/views"
end

# at a minimum, the main scss file must reside within the ./views directory. here, we create a ./views/stylesheets directory where all of the sass files can safely reside.
get '/stylesheets/:name.css' do
  content_type 'text/css', :charset => 'utf-8'
  scss(:"stylesheets/#{params[:name]}", Compass.sass_engine_options )
end

error do
  e = request.env['sinatra.error']
  Kernel.puts e.backtrace.join("\n")
  'Application error'
end

helpers do
  # add your helpers here
end

# root page
get '/' do
  haml :root
end

get '/statuses.json' do
  content_type :json
  Status.current.to_json
end

get '/uptime' do
  @start_time = Time.at(params[:start_time].to_i) rescue 0
  @end_time   = Time.at(params[:end_time].to_i)   rescue 0
  @node       = Node.new(params[:node])
  
  Status.uptime(@start_time, @end_time, @node)
end
