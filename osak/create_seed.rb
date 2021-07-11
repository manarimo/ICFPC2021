require_relative '../ruby-lib/problem'
require 'fileutils'

dirname = ARGV[0]

problem_ids = [1, 5, 6, 7, 9, 10, 50, 56, 57, 58, 60, 62, 66, 69, 71, 74, 78, 79, 81, 82, 83, 86, 87, 88, 89, 91, 92, 94, 95, 96, 98, 101, 103, 104, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 126, 127, 128, 129, 130, 131, 132]
solutions = Problem::load_solutions

best_solution = {}
solutions.values.each do |list|
  list.each do |_, sol|
    next unless sol&.verdict&.fetch('isValid')
    if best_solution[sol.id] == nil
      best_solution[sol.id] = sol
    elsif best_solution[sol.id].verdict['score'] > sol.verdict['score']
      best_solution[sol.id] = sol
    end
  end
end

FileUtils.makedirs("#{__dir__}/../hints/#{dirname}")
problem_ids.each do |id|
  solution = best_solution[id]
  if solution == nil
    cmdline = "cp #{__dir__}/../problems/#{id}.json #{__dir__}/../hints/#{dirname}"
  else
    cmdline = "cp #{__dir__}/../solutions/#{solution.name}/#{id}.json #{__dir__}/../hints/#{dirname}"
  end
  puts cmdline
  system(cmdline)
end