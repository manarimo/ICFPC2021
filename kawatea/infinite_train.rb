require 'fileutils'

solution_base = ARGV[0]
programs = %w(./time_600_temp_100.out ./time_600_temp_1000.out ./time_600_temp_10000.out)

current_dir = "#{__dir__}/../solutions/#{solution_base}"
loop_count = 1

if ARGV.size >= 2
  loop_count = ARGV[1].to_i
  current_dir = "#{__dir__}/../solutions/#{solution_base}-loop-#{loop_count-1}"
end

loop do
  process_count = 0
  next_dir = "#{__dir__}/../solutions/#{solution_base}-loop-#{loop_count}"
  FileUtils.makedirs(next_dir)

  program = programs.sample
  Dir.glob("#{current_dir}/*.json") do |file|
    next if file.match(/_verdict.json/)
    id = file.match(/(\d+).json/)[1].to_i

    hint_path = "#{current_dir}/#{id}.json"
    out_path = "#{next_dir}/#{id}.json"
    log_path = "#{next_dir}/#{id}.log"
    cmdline = "#{program} /dev/null #{hint_path} < ../problems/#{id}.json > #{out_path} 2> #{log_path} &"

    puts cmdline
    system(cmdline)

    process_count += 1
    if process_count % 71 == 0
      sleep 630
    end
  end

  sleep 630

  loop_count += 1
  current_dir = next_dir
end
