require 'json'
require 'pp'
require 'fileutils'

Point = Struct.new(:x, :y)
Problem = Struct.new(:id, :hole, :figure, :epsilon, :width, :height)
Edge = Struct.new(:from, :to)
Figure = Struct.new(:edges, :vertices)
Solution = Struct.new(:name, :verdict, :vertices)

def new_hole(json)
  json.map { |a| Point.new(a[0], a[1]) }
end

def new_edges(json)
  json.map { |a| Edge.new(a[0], a[1]) }
end

def new_vertices(json)
  json.map { |a| Point.new(a[0], a[1]) }
end

def new_figure(json)
  Figure.new(new_edges(json['edges']), new_vertices(json['vertices']))
end

def new_problem(id, json)
  hole = new_hole(json['hole'])
  figure = new_figure(json['figure'])
  eps = json['epsilon'].to_i
  min_x = hole.map(&:x).min
  min_y = hole.map(&:y).min
  max_x = hole.map(&:x).max
  max_y = hole.map(&:y).max
  Problem.new(id, hole, figure, eps, max_x - min_x, max_y - min_y)
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

def rotate(point, center, angle)
  x = point.x - center.x
  y = point.y - center.y
  cos = Math.cos(angle)
  sin = Math.sin(angle)

  Point.new((x * cos - y * sin + center.x).to_i, (x * sin + y * cos + center.y).to_i)
end

def flip(point, center)
  Point.new((center.x * 2 - point.x).to_i, point.y)
end

degree = ARGV[0].to_i
flip = ARGV[1] == 'true'
outdir = ARGV[2]
problems = load_problems

problems.each do |prob|
  center_x, center_y = 0, 0
  prob.figure.vertices.each do |p|
    center_x += p.x
    center_y += p.y
  end

  center_x /= prob.figure.vertices.size.to_f
  center_y /= prob.figure.vertices.size.to_f
  center = Point.new(center_x, center_y)

  rot = prob.figure.vertices.map { |p| rotate(p, center, degree * Math::PI / 180 ) }
  if flip
    rot = rot.map {|p| flip(p, center) }
  end
  min_x = rot.map(&:x).min
  min_y = rot.map(&:y).min

  if min_x < 0
    rot = rot.map { |p| Point.new(p.x - min_x, p.y) }
  end

  if min_y < 0
    rot = rot.map { |p| Point.new(p.x, p.y - min_y) }
  end

  File.open("#{outdir}/#{prob.id}.json", 'w') do |f|
    JSON.dump({'vertices': rot.map{|p| [p[0], p[1]]}}, f)
  end
end