#!/usr/bin/ruby

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

def write_svg(f, problem, solution = nil)
  hole_d = 'M ' + problem.hole.map { |p| "#{p.x},#{p.y}"}.join(' L ')
  hole = %Q(<path d="#{hole_d}" style="fill:#ffffff; fill-rule:evenodd; stroke:none" />)

  vertices = solution&.vertices || problem.figure.vertices
  figure_paths = problem.figure.edges.map { |e|
    from =vertices[e.from]
    to = vertices[e.to]
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

def index_tr(problem, solution, global_dislike)
  score_base = 1000 * Math.log(problem.figure.vertices.size * problem.figure.edges.size * problem.hole.size / 6)
  max_score = score_base.ceil

  style = nil
  if solution == nil
    solution_td = nil
  else
    if solution.verdict == nil
      dislike = '(not yet evaluated)'
      score = 0
    elsif !solution.verdict['isValid']
      dislike = 'INVALID'
      score = 0
    else
      dislike = solution.verdict['score']
      score = (score_base * Math.sqrt((global_dislike+1.0) / (dislike+1.0))).ceil
      if score == max_score
        style = "background-color: lightgreen"
      end
    end
    solution_td = solution && %Q(
        <td>
          <img src="images/#{solution.name}/#{problem.id}.svg" height="200"><br>
          <a href="kenkoooo/#/problem/#{problem.id}?solution=#{solution.name}/#{problem.id}.json">つづきからはじめる</a>
        </td>
        <td>#{solution.name}</td>
        <td>#{dislike} / #{global_dislike}</td>
        <td>#{score} / #{max_score}</td>
      )
  end

  <<-TR
<tr style="#{style}">
  <td>#{problem.id}</td>
  <td>
    <img src="images/#{problem.id}.svg" height="200"><br>
    <a href="/kenkoooo/#/problem/#{problem.id}">さいしょからはじめる</a>
  </td>
  <td>
    <ul>
      <li>(w,h) = (#{problem.width}, #{problem.height})</li>
      <li>ε = #{problem.epsilon}</li>
      <li>√ε = #{Math.sqrt(problem.epsilon)}</li>
    </ul>
  </td>
  #{solution_td}
</tr>
TR
end

def write_index(f, problems, solutions = {}, solution_title = nil, solution_names = [], dislikes)
  solution_header = solution_title && %Q(<h2>Name: #{solution_title}</h2>)
  if solution_names.size > 0
    solution_links = <<-LINKS
<div style="margin-bottom: 32px">
  <div><a href="best.html"><h3>Best</h3></a></div>
  <div style="display: flex">
    #{solution_names.map { |sn| %Q(<div style="margin-right: 10px"><a href="#{sn}.html">#{sn}</a></div>) }.join}
  </div>
</div>
LINKS
  else
    solution_links = nil
  end

  f.puts <<-EOF
<!doctype html>
<html>
<head>
  <title>Manarimo Portal</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body style="margin: 0 100px">
  <h1><a href="index.html">Manarimo Portal</a></h1>
  #{solution_header}
  #{solution_links}
  <table border>
    <tr>
      <th>Problem ID</th>
      <th style="text-align:left">Thumbnail</th>
      <th>Spec</th>
      <th>Solution</th>
      <th>Solver</ht>
      <th>Dislikes</th>
      <th>Score</ht>
    </tr>
    #{problems.map {|prob| index_tr(prob, solutions[prob.id], dislikes[prob.id]) }.join}
  </table>
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

problems_dict = problems.map { |prob| [prob.id, prob] }.to_h

solutions = {}
Dir.glob("#{__dir__}/../solutions/*").each do |dir|
  solution_name = File.basename(dir)

  Dir.glob("#{dir}/*.json") do |file|
    next if file.match(/_verdict.json/)

    id = File.basename(file, '.json').to_i
    json = File.open(file) do |f|
      JSON.load(f)
    end
    vertices = new_vertices(json['vertices'])

    verdict = JSON.load(File.read(file.sub(/\.json$/, '_verdict.json'))) rescue nil

    solutions[solution_name] ||= {}
    solutions[solution_name][id] = Solution.new(solution_name, verdict, vertices)
  end
end

dislikes = File.open("#{__dir__}/../problems/minimal_dislikes.txt") { |f|
  JSON.load(f).map { |e| [e['problem_id'], e['minimal_dislikes']] }.to_h
}

solutions.each do |solution_name, solution_list|
  output_dir = "#{__dir__}/../web/images/#{solution_name}"
  FileUtils.makedirs(output_dir)

  # Generate solution SVG files
  solution_list.each do |id, sol|
    File.open("#{output_dir}/#{id}.svg", 'w') do |f|
      write_svg(f, problems_dict[id], sol)
    end
  end

  # Generate solution overview
  File.open("#{__dir__}/../web/#{solution_name}.html", 'w') do |f|
    write_index(f, problems.select{|prob| solutions[solution_name].has_key?(prob.id) }, solutions[solution_name], solution_name, solutions.keys.sort, dislikes)
  end
end

File.open("#{__dir__}/../web/index.html", 'w') do |f|
  write_index(f, problems, {}, nil, solutions.keys.sort, dislikes)
end

# Top solutions
best_solutions = {}
solutions.each do |name, list|
  list.each do |id, solution|
    next if solution.verdict == nil || !solution.verdict['isValid']
    current_verdict = best_solutions[id]&.verdict
    if current_verdict == nil || (current_verdict['isValid'] && current_verdict['score'] > solution.verdict['score'])
      best_solutions[id] = solution
    end
  end
end

File.open("#{__dir__}/../web/best.html", 'w') do |f|
  write_index(f, problems, best_solutions, 'Best', solutions.keys.sort, dislikes)
end