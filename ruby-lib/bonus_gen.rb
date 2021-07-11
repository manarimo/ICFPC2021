require_relative 'problem'
require 'pp'

problems = Problem::load_problems

to_obtain = {}
to_use_in = {}

problems.each do |problem|
  problem.bonuses.each do |bonus|
    to_obtain[bonus.bonus] ||= []
    to_obtain[bonus.bonus].push(problem.id)

    to_use_in[bonus.bonus] ||= []
    to_use_in[bonus.bonus].push(bonus.problem)
  end
end