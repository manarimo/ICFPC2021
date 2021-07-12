require_relative '../ruby-lib/problem.rb'

Problem::load_problems.each do |p|
  puts p.figure.vertices.size
end