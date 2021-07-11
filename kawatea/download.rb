hints = %w(nohint rot-90 rot-180 rot-270 flip-rot-0 flip-rot-90 flip-rot-180 flip-rot-270)

if ARGV.size < 1
  STDERR.puts "Usage: ruby download.rb <name>"
  exit 1
end

name = ARGV[0]

Dir.chdir("#{__dir__}/../solutions")
hints.each do |hint|
  `rsync -a --progress -e 'ssh -i ~/.ssh/icfpc2021.pem' ubuntu@18.181.163.36:ICFPC2021/kawatea/#{name}-#{hint} .`
end
