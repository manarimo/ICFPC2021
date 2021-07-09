require "net/http"
require "json"

uri = URI.parse("https://poses.live/problems")
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true
req = Net::HTTP::Get.new(uri.request_uri)
req.add_field('Cookie', 'session=0aa9aad8-7809-496d-9d8e-2c94e68b1043; spockcookie=upz2MFgsfw9Lx8jTM9eotXtquvgbRo3FErpIXRQkFpqvOOLzuoYMUtdvUuc3fFq9R-0E3iv_MRzbAS34t2DRLQ')
response = http.request(req)

res = []

response.body.scan(/<tr><td><a href="\/problems\/\d+">(\d+)<\/a><\/td><td><\/td><td>(\d+)<\/td><\/tr>/).each do |v|
   res.push({
      problem_id: v[0].to_i,
      minimal_dislikes: v[1].to_i
   })
end

puts JSON.generate(res)