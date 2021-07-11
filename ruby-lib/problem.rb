require 'json'

module Problem
  Point = Struct.new(:x, :y)
  Problem = Struct.new(:id, :hole, :figure, :epsilon, :width, :height, :bonuses)
  Edge = Struct.new(:from, :to)
  Figure = Struct.new(:edges, :vertices)
  Bonus = Struct.new(:position, :bonus, :problem)
  Solution = Struct.new(:id, :name, :verdict, :vertices, :bonuses)

  BonusGraph = Struct.new(:to_obtain, :to_use, :obtainable, :usable)

  class << self
    def new_point(json)
      return nil if json == nil
      Point.new(json[0], json[1])
    end

    def new_hole(json)
      json.map { |a| new_point(a) }
    end

    def new_edges(json)
      json.map { |a| Edge.new(a[0], a[1]) }
    end

    def new_vertices(json)
      json.map { |a| new_point(a) }
    end

    def new_figure(json)
      Figure.new(new_edges(json['edges']), new_vertices(json['vertices']))
    end

    def new_bonuses(json)
      return nil if json == nil
      json.map { |b| Bonus.new(new_point(b['position']), b['bonus'], b['problem'].to_i) }
    end

    def new_problem(id, json)
      hole = new_hole(json['hole'])
      figure = new_figure(json['figure'])
      eps = json['epsilon'].to_i
      min_x = hole.map(&:x).min
      min_y = hole.map(&:y).min
      max_x = hole.map(&:x).max
      max_y = hole.map(&:y).max
      Problem.new(id, hole, figure, eps, max_x - min_x, max_y - min_y, new_bonuses(json['bonuses']))
    end

    def load_problems
      problems = []
      files = Dir.glob("#{__dir__}/../problems/*.json")
      files.each do |file|
        id = File.basename(file, '.json').to_i
        File.open(file) do |f|
          json = JSON.load(f)
          problems.push(new_problem(id, json))
        end
      end

      problems.sort_by(&:id)
    end

    def bonus_graph(problems)
      to_obtain = {}
      to_use = {}
      obtainable = {}
      usable = {}

      problems.each do |problem|
        problem.bonuses.each do |bonus|
          to_obtain[bonus.bonus] ||= []
          to_obtain[bonus.bonus].push(problem.id)

          to_use[bonus.bonus] ||= []
          to_use[bonus.bonus].push(bonus.problem)

          usable[bonus.problem] ||= []
          usable[bonus.problem].push(Bonus.new(bonus.position, bonus.bonus, problem.id))
        end
        obtainable[problem.id] = problem.bonuses
      end

      BonusGraph.new(to_obtain, to_use, obtainable, usable)
    end
  end
end