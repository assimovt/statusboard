class Status
  include DataMapper::Resource

  property :id,         Serial
  property :value,      Boolean,  :required => true
  property :updated_at, DateTime, :required => true
  property :uri,        String,   :required => true

  validates_presence_of :value, :message => 'Value must not be blank'
  validates_presence_of :updated_at, :message => 'Timestamp must not be blank'
  
  
  # Public: Updates a node with a status
  #
  # node - The Node object
  #
  # Returns true on success, otherwise false
  def self.update(node)
    begin
      response = RestClient.get node.uri
      status = response.code == 200
    rescue => ex
      status = false
    end
    result = self.create(:updated_at => Time.now, :value => status, :uri => node.uri)
    result.saved?
  end
  
  # Public: Updates all nodes with a status and updates status of the system as whole
  def self.update_all
    all_results = []
    Node.all.each do |uri|
      begin
        resource = RestClient::Resource.new(uri, :timeout => APP_CONFIG['node_timeout'] || 600)
        response = resource.get
        status = response.code == 200
      rescue => ex
        status = false
      end
      result = self.create(:updated_at => Time.now, :value => status, :uri => uri)
      all_results << status
    end
    
    status_as_whole = all_results.count(true) > 0
    self.create(:updated_at => Time.now, :value => status_as_whole, :uri => "whole")
    send_panic_email! unless status_as_whole
  end
  
  
  # Public: Get the current status of all nodes
  #
  # Returns Array of statuses for every node with data
  def self.current
    statuses = Array.new
    Node.all.each do |uri|
      n = Node.new(uri)
      s = self.first(:uri => uri, :order => [ :updated_at.desc ], :limit => 1)
      next unless s
      statuses << { :timestamp => s.updated_at, :status => s.value, :uri => n.uri, :host => n.host }
    end
    statuses
  end
  
  
  # Public: Get the uptime for the given period and node
  #
  # start_time The Time start
  # end_time   The Time end
  # node       The Node object
  #
  # Returns String uptime of the node or nil if statuses not found
  def self.uptime(start_time, end_time, node)
    uptimes   = 0
    downtimes = 0
    
    self.all(:uri => node.uri, :updated_at.gte => start_time, :updated_at.lte => end_time).each do |status|
      uptimes   += 1 if  status.value
      downtimes += 1 if !status.value
    end
    
    return nil if uptimes == 0 && downtimes == 0
    
    # Availability = (Uptime / (Uptime + Downtime)) x 100
    '%.2f' % ((uptimes.to_f / (uptimes + downtimes).to_f ) * 100.0)
  end
  
  
  # Public: Get latest status feed from external service
  #
  # Currently supports only RSS feeds
  # 
  # since The Time since feed
  #
  # Returns hash representation of feed data
  # Returns empty hash on errors
  def self.feed
    
    feed    = {}
    author  = nil
    content = nil
    
    begin
      rss       = SimpleRSS.parse open(APP_CONFIG['feed_url'])
      feed_item = nil
      
      rss.items.each do |item|
        next if item.empty?
        
        # skip authors that are not in whitelist
        author = parse_feed_item(:author, item.send(APP_CONFIG['feed_item_author']))
        next unless feed_whitelist.include?(author)
        
        content = parse_feed_item(:content, item.send(APP_CONFIG['feed_item_content']))
        
        next if content.empty?
        
        # Find up or down tag and:
        #   return empty feed if up tag found first
        return feed if content.match(feed_tag_regex(APP_CONFIG['feed_up_tag']))
        #   save feed and break if down tag found
        if content.match(feed_tag_regex(APP_CONFIG['feed_down_tag']))
          content.gsub!(feed_tag_regex(APP_CONFIG['feed_down_tag']), '')
          feed_item = item
          break
        end
        
      end

      return feed unless feed_item
      
      published_at = parse_feed_item(:date,    feed_item.send(APP_CONFIG['feed_item_date']))
      link         = feed_item.send(APP_CONFIG['feed_item_link'])

      {:date => published_at, :author => author, :content => content, :link => link}
    rescue Exception => ex
      feed
    end
  end
  
  
  def self.feed_whitelist
    APP_CONFIG['feed_authors_whitelist']
  end
  
  private
  
    def self.parse_feed_item(item, value)
      case item.to_s
      when 'date'
        Time.parse(value.to_s).strftime(APP_CONFIG['feed_item_date_format']) rescue ''
      when 'author'
        # First Last\n   email
        value.gsub(/\n.*/, '')
      when 'content'
        # Format content if provided
        APP_CONFIG['feed_item_content_regex'] ? 
          value.gsub(Regexp.new(APP_CONFIG['feed_item_content_regex']), '') : 
          value
      end
    end
    
    
    def self.send_panic_email!
      mail = Mail.new do
        from    APP_CONFIG['from_email']
        to      APP_CONFIG['to_email']
        subject "PANIC! #{APP_CONFIG['service_name']} is down."
        body    <<-EOF
Important!

All nodes are down, stop whatever you are doing now and fix it.

#{APP_CONFIG['service_name']} URL: #{APP_CONFIG['host']}

EOF
      end
      
      mail.delivery_method :sendmail
      mail.deliver
    end
    
    # Constructs regexp to find tag in feed content
    # tag must have whitespace before and any non-word character after
    def self.feed_tag_regex(tag = String.new)
      Regexp.new("\s+#{tag}\W*")
    end
  
end
