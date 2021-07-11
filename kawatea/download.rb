hints = %w(rot-0 rot-90 rot-180 rot-270 flip-rot-0 flip-rot-90 flip-rot-180 flip-rot-270)
#hints = %w(spring-expand)

if ARGV.size < 1
  STDERR.puts "Usage: ruby download.rb <name>"
  exit 1
end

name = ARGV[0]

Dir.chdir("#{__dir__}/../solutions")
hints.each do |hint|
  #command = "rsync -a --progress -e 'ssh -i ~/.ssh/icfpc2021.pem' ubuntu@18.181.163.36:ICFPC2021/kawatea/#{name}-#{hint} ."
  command = "rsync -a --progress -e 'ssh -i ~/.ssh/icfpc2021-us-east.pem' ubuntu@34.200.242.113:ICFPC2021/kawatea/#{name}-#{hint} ."
  puts command
  system(command)
end
