require_relative '../ruby-lib/problem'

prob_ids = (1..132).to_a
hints = %w(rot-0 rot-90 rot-180 rot-270 flip-rot-0 flip-rot-90 flip-rot-180 flip-rot-270).map { |w| "raw-" + w }
#hints = %w(spring-expand)

solutions = Problem::load_solutions
valueable_problems = Problem::valuable_problems(solutions)

count = 0
name = ARGV[0]
hints.each do |hint|
  dirname = "../solutions/#{name}-#{hint}"
  `mkdir -p '#{dirname}'`
  prob_ids.each do |id|
    next unless valueable_problems.include?(id)
    if hint == 'nohint'
      hint_path = ''
    else
      hint_path = "../hints/#{hint}/#{id}.json"
    end

    cmdline = "./a.out -s 10000 -t 600 /dev/null #{hint_path} < ../problems/#{id}.json > #{dirname}/#{id}.json 2> #{dirname}/#{id}.log &"
    puts cmdline
    system(cmdline)

    count += 1
    if count % 71 == 0
      sleep 600
    end
  end
end
