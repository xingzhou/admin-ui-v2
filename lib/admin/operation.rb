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

      if method.upcase == 'START'
        @client.put_cc(url, '{"state":"STARTED"}')
      elsif method.upcase == 'STOP'
        @client.put_cc(url, '{"state":"STOPPED"}')
      elsif method.upcase == 'RESTART'
        @client.put_cc(url, '{"state":"STOPPED"}')
        @client.put_cc(url, '{"state":"STARTED"}')
      end

      @cc.refresh_applications
      @varz.reload
    end

    def manage_route(method, route)
      url = find_route_url(route)

      if method.upcase == 'DELETE'
        @client.delete_cc(url)
        @cc.refresh_routes
      end
    end

    def manage_service(method, service_guid)
      if method.upcase == 'TURN_PUBLIC'
        plans = find_service_plans_by_service(service_guid)

        plans.each do |plan|
          unless plan['public']
            plan = @client.put_cc('v2/service_plans/' + plan['guid'], '{"public":true}')
            @cc.refresh_service_plan_visibility_state(plan)
          end
        end

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

    def find_service_plans_by_service(service_guid)
      plans = []

      original_plans = @cc.service_plans

      original_plans['items'].each do |original_plan|
        if original_plan['service_guid'] == service_guid
          plans.push(original_plan)
        end
      end

      plans
    end
  end
end
