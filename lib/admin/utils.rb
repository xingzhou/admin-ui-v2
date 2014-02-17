require 'net/http'
require 'uri'

module AdminUI
  class Utils

    def self.time_in_milliseconds(time = Time.now)
      (time.to_f * 1000).to_i
    end

    HTTP_METHODS = {
        'DELETE' => Net::HTTP::Delete,
        'GET'    => Net::HTTP::Get,
        'HEAD'   => Net::HTTP::Head,
        'PUT'    => Net::HTTP::Put,
        'POST'   => Net::HTTP::Post
    }

    def self.get_method_class(method_string)
      HTTP_METHODS[method_string.upcase]
    end

    def self.http_request(config, uri_string, method = 'GET', basic_auth_array = nil, body = nil, authorization_header = nil)
      uri = URI.parse(uri_string)

      path  = uri.path
      path += "?#{ uri.query }" unless uri.query.nil?

      http             = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl     = uri.scheme.to_s.downcase == 'https'
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE if config.cloud_controller_ssl_verify_none
      request          = get_method_class(method).new(path)

      request.basic_auth(basic_auth_array[0], basic_auth_array[1]) unless basic_auth_array.nil? || basic_auth_array.length < 2
      request['Authorization'] = authorization_header unless authorization_header.nil?

      request.body = body if body

      http.request(request)
    end
  end
end
