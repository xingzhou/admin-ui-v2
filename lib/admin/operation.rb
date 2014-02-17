module AdminUI
  class Operation
    def initialize(config, logger, cc, varz)
      @cc     = cc
      @config = config
      @logger = logger
      @varz   = varz

      setup_client
    end

    def manage_application(method, organization, space, application_name)
      url = find_app_url(organization, space, application_name)
      if(method.upcase == 'START')
        @client.put_cc(url, '{"state":"STARTED"}')
      elsif(method.upcase == 'STOP')
        @client.put_cc(url, '{"state":"STOPPED"}')
      elsif(method.upcase == 'RESTART')
        @client.put_cc(url, '{"state":"STOPPED"}')
        @client.put_cc(url, '{"state":"STARTED"}')
      end

      sleep(5)

      @cc.refresh_application(url)
      @varz.refresh
    end

    def manage_route(method, route)
      url = find_route_url(route)

      if(method.upcase == 'DELETE')
        @client.delete_cc(url)
      end
    end

    private

    def setup_client
      @client = RestClient.new(@config, @logger)
    end

    def find_app_url(organization_name, space_name, app_name)
      organizations = @cc.organizations
      organization_id = nil
      organizations['items'].each do |organization|
        if(organization['name'] == organization_name)
          organization_id = organization['guid']
          break
        end
      end

      spaces = @cc.spaces
      space_id = nil
      spaces['items'].each do |space|
        if(space['organization_guid'] == organization_id && space['name'] == space_name)
          space_id = space['guid']
          break;
        end
      end

      apps = @cc.applications
      app_id = nil
      apps['items'].each do |app|
        if(app['space_guid'] == space_id && app['name'] == app_name)
          app_id = app['guid']
        end
      end

      "v2/apps/#{ app_id }"
    end

    def find_route_url(route)
      routes = @cc.routes
      routes = routes['items']
      routes.each do |item|
        if(route == item['host'] + '.' + item['domain']['entity']['name'])
           return item['url']
        end
      end
    end
  end

end
