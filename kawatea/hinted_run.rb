require 'optparse'
require 'fileutils'
require 'pp'
require_relative '../ruby-lib/problem'

max_concurrency = 71
start_temp = 100
time_limit = 10
edge_penalty = 1000
parser = OptionParser.new do |opts|
  opts.banner = "Usage: ruby hinted_run.rb [options] hint_dir output_name"

  opts.on("-nNUMBER", Integer, "Max concurrency (default 71)") do |v|
    max_concurrency = v
  end

  opts.on("-sNUMBER", Integer, "Start temp (default 100)") do |v|
    start_temp = v
  end

  opts.on("-tNUMBER", Integer, "Time limit (default 10)") do |v|
    time_limit = v
  end

  opts.on("-eNUMBER", Float, "Edge penalty (default 1000)") do |v|
    edge_penalty = v
  end
end
parser.parse!

if ARGV.size != 2
  STDERR.puts parser.help
  exit 1
end

solutions = Problem::load_solutions
valuable_problems = Problem::valuable_problems(solutions)

hint_dir = ARGV[0]
output_name = ARGV[1]

outdir = "#{__dir__}/../solutions/#{output_name}"
FileUtils.makedirs(outdir)

count = 0
Dir.glob("#{hint_dir}/*.json") do |file|
  next if file.match(/_verdict.json/)
  id = file.match(/(\d+).json/)[1].to_i
  next unless valuable_problems.include?(id)

  cmdline = "./a.out -s #{start_temp} -t #{time_limit} -e #{edge_penalty} /dev/null #{file} < #{__dir__}/../problems/#{id}.json > #{outdir}/#{id}.json 2> #{outdir}/#{id}.log &"
  puts cmdline
  system(cmdline)

  count += 1
  if count % max_concurrency == 0
    sleep(time_limit + 10)
  end
end