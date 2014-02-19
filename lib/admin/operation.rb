module AdminUI
  class Operation
    def initialize(config, logger, cc, client, varz)
      @cc     = cc
      @client = client
      @config = config
      @logger = logger
      @varz   = varz
    end

    def manage_application(method, organization, space, application_name)
      url = find_app_url(organization, space, application_name)
      app = {}

      if method.upcase == 'START'
        app = @client.put_cc(url, '{"state":"STARTED"}')
      elsif method.upcase == 'STOP'
        app = @client.put_cc(url, '{"state":"STOPPED"}')
      elsif method.upcase == 'RESTART'
        @client.put_cc(url, '{"state":"STOPPED"}')
        app = @client.put_cc(url, '{"state":"STARTED"}')
      end

      @cc.refresh_application_state(app)

      # Wait some time for varz to take a info refresh
      # Todos: We need to improve the Admin-UI backend service framework
      # in the future that enables some polling and refreshing
      sleep(5)

      @varz.refresh
    end

    def manage_route(method, route)
      url = find_route_url(route)

      if method.upcase == 'DELETE'
        @client.delete_cc(url)
        @cc.remove_route_from_cache(route)
      end
    end

    private

    def find_app_url(organization_name, space_name, app_name)
      organizations = @cc.organizations
      organization_id = nil
      organizations['items'].each do |organization|
        if organization['name'] == organization_name
          organization_id = organization['guid']
          break
        end
      end

      spaces = @cc.spaces
      space_id = nil
      spaces['items'].each do |space|
        if space['organization_guid'] == organization_id && space['name'] == space_name
          space_id = space['guid']
          break
        end
      end

      apps = @cc.applications
      apps['items'].each do |app|
        if app['space_guid'] == space_id && app['name'] == app_name
          return "v2/apps/#{ app['guid'] }"
        end
      end
    end

    def find_route_url(route)
      routes = @cc.routes

      routes['items'].each do |item|
        if route == item['host'] + '.' + item['domain']['entity']['name']
          return "v2/routes/#{ item['guid'] }"
        end
      end
    end
  end
end
