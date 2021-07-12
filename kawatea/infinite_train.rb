require 'fileutils'
require_relative '../ruby-lib/problem'

solution_base = ARGV[0]
start_temps = [10, 100, 1000, 10000]
edge_penalties = [1000, 5000, 10000]

solutions = Problem::load_solutions
valuable_problems = Problem::valuable_problems(solutions)

current_dir = "#{__dir__}/../hints/#{solution_base}"
loop_count = 1

if ARGV.size >= 2
  loop_count = ARGV[1].to_i
  current_dir = "#{__dir__}/../solutions/#{solution_base}-loop-#{loop_count-1}"
end

loop do
  process_count = 0
  next_dir = "#{__dir__}/../solutions/#{solution_base}-loop-#{loop_count}"
  FileUtils.makedirs(next_dir)

  start_temp = start_temps.sample
  edge_penalty = edge_penalties.sample
  Dir.glob("#{current_dir}/*.json") do |file|
    next if file.match(/_verdict.json/)
    id = file.match(/(\d+).json/)[1].to_i
    next unless valuable_problems.include?(id)

    hint_path = "#{current_dir}/#{id}.json"
    out_path = "#{next_dir}/#{id}.json"
    log_path = "#{next_dir}/#{id}.log"
    cmdline = "./a.out -s #{start_temp} -t 300 -e #{edge_penalty} /dev/null #{hint_path} < ../problems/#{id}.json > #{out_path} 2> #{log_path} &"

    puts cmdline
    system(cmdline)

    process_count += 1
    if process_count % 95 == 0
      sleep 320
    end
  end

  sleep 320

  loop_count += 1
  current_dir = next_dir
end
