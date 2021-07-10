prob_ids = %w(1 2 3 5 6 7 8 9 10 45 48 50 56 57 58 60 61 62 64 66 68 69 71 74 75 76 78).map(&:to_i)
hints = %w(rot-90 rot-180 rot-270 flip-rot-0 flip-rot-90 flip-rot-180 flip-rot-270)

count = 0
program = ARGV[0]
hints.each do |hint|
  `mkdir -p '#{hint}'`
  prob_ids.each do |id|
    cmdline = "#{program} /dev/null ../hints/#{hint}/#{id}.json < ../problems/#{id}.json > #{hint}/#{id}.json 2> #{hint}/#{id}.log &"
    system(cmdline)

    count += 1
    if count % 35 == 0
      sleep 600
    end
  end
end
