require 'fileutils'

solution_base = ARGV[0]
program = ARGV[1]

process_count = 0
current_dir = "#{__dir__}/../solutions/#{solution_base}"
loop_count = 1
loop do
  next_dir = "#{__dir__}/../solutions/#{solution_base}-loop-#{loop_count}"
  FileUtils.makedirs(next_dir)

  Dir.glob("#{current_dir}/*.json") do |file|
    next if file.match(/_verdict.json/)
    id = file.match(/^(\d+).json/)[1].to_i

    hint_path = "#{current_dir}/#{id}.json"
    out_path = "#{next_dir}/#{id}.json"
    log_path = "#{next_dir}/#{id}.log"
    cmdline = "#{program} /dev/null #{hint_path} < ../problems/#{id}.json > #{out_path} 2> #{log_path} &"

    puts cmdline
    system(cmdline)

    process_count += 1
    if count % 71 == 0
      sleep 600
    end
  end

  loop_count += 1
  current_dir = next_dir
end