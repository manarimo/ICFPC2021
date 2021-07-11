prob_ids = (106..132).to_a
hints = %w(rot-0 rot-90 rot-180 rot-270 flip-rot-0 flip-rot-90 flip-rot-180 flip-rot-270).map { |w| "raw-" + w }
#hints = %w(spring-expand)

count = 0
program = ARGV[0]
name = ARGV[1]
hints.each do |hint|
  dirname = "#{name}-#{hint}"
  `mkdir -p '#{dirname}'`
  prob_ids.each do |id|
    if hint == 'nohint'
      hint_path = ''
    else
      hint_path = "../hints/#{hint}/#{id}.json"
    end

    cmdline = "#{program} /dev/null #{hint_path} < ../problems/#{id}.json > #{dirname}/#{id}.json 2> #{dirname}/#{id}.log &"
    puts cmdline
    system(cmdline)

    count += 1
    if count % 71 == 0
      sleep 600
    end
  end
end
