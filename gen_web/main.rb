#!/usr/bin/ruby

require 'json'
require 'pp'

Point = Struct.new(:x, :y)
Problem = Struct.new(:id, :hole, :figure, :epsilon)
Edge = Struct.new(:from, :to)
Figure = Struct.new(:edges, :vertices)

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
  Problem.new(id, new_hole(json['hole']), new_figure(json['figure']), json['epsilon'].to_i)
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

def write_svg(f, problem)
  hole_d = 'M ' + problem.hole.map { |p| "#{p.x},#{p.y}"}.join(' L ')
  hole = %Q(<path d="#{hole_d}" style="fill:#ffffff; fill-rule:evenodd; stroke:none" />)
  figure_paths = problem.figure.edges.map { |e|
    from = problem.figure.vertices[e.from]
    to = problem.figure.vertices[e.to]
    d = "M #{from.x},#{from.y} L #{to.x},#{to.y}"
    %Q(<path d="#{d}" />)
  }
  figure = %Q(<g style="fill:none;stroke:#ff0000;stroke-linecap:round">#{figure_paths.join}</g>)

  points = problem.hole + problem.figure.vertices
  min_x = points.map(&:x).min - 10
  min_y = points.map(&:y).min - 10
  max_x = points.map(&:x).max + 10
  max_y = points.map(&:y).max + 10
  f.puts <<SVG
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="#{min_x} #{min_y} #{max_x-min_x} #{max_y-min_y}" style="background-color: #00000066">
  #{hole}
  #{figure}
</svg>
SVG
end

def write_index(f, problems)
  f.puts <<-EOF
<!doctype html>
<html>
<head>
  <title>Manarimo Portal</title>
</head>
<body style="margin: 0 100px">
  <h1>Manarimo Portal</h1>
  <table>
  <tr><th>Problem ID</th><th style="text-align:left">Thumbnail</th></tr>
  #{problems.map {|prob| %Q(<tr><td>#{prob.id}</td><td><img src="images/#{prob.id}.svg" height="200"></td></tr>)}.join}
</body>
</html>
EOF
end

problems = load_problems
problems.each do |prob|
  File.open("#{__dir__}/../web/images/#{prob.id}.svg", 'w') do |f|
    write_svg(f, prob)
  end
end

File.open("#{__dir__}/../web/index.html", 'w') do |f|
  write_index(f, problems)
end