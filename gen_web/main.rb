#!/usr/bin/ruby

require 'json'
require 'pp'
require 'fileutils'
require_relative '../ruby-lib/problem'

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
  bonuses = problem.bonuses.map { |b|
    case b.bonus
    when 'GLOBALIST'
      color = '#d0d00080'
    when 'BREAK_A_LEG'
      color = '#0000ff80'
    when 'WALLHACK'
      color = '#ffa50080'
    when 'SUPERFLEX'
      color = '#00ffff80'
    else
      color = 'gray'
    end
    %Q(<circle cx="#{b.position.x}" cy="#{b.position.y}" r="5px" style="fill:#{color}" />)
  }.join

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
  #{bonuses}
</svg>
SVG
end

def index_tr(problem, solution, global_dislike, bonus_graph)
  score_base = 1000 * Math.log(problem.figure.vertices.size * problem.figure.edges.size * problem.hole.size / 6, 2)
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
      if score > max_score
        style = "background-color: hotpink"
      elsif score == max_score
        style = "background-color: lightgreen"
      end
    end
    solution_td = solution && %Q(
        <td>
          <div style="display: flex">
            <img src="images/#{solution.name}/#{problem.id}.svg" height="200">
            <div>
              使用: #{solution.bonuses&.map{|b| %Q(#{b.bonus} <a href="##{b.problem}">#{b.problem}</a>)}&.join(', ')} <br>
              取得: #{solution.verdict && solution.verdict['bonusObtained']&.map{ |b| %Q(#{b['bonus']} <a href="##{b['problem']}">#{b['problem']}</a>) }.join(', ')}
            </div>
          </div>
          <a href="kenkoooo/#/problem/#{problem.id}?solution=#{solution.name}/#{problem.id}.json">つづきからはじめる</a>
        </td>
        <td>#{solution.name}</td>
        <td>#{dislike} / #{global_dislike}</td>
        <td>#{score} / #{max_score}</td>
      )
  end

  <<-TR
<tr style="#{style}" id="#{problem.id}">
  <td><a href="#{problem.id}.html">#{problem.id}</a></td>
  <td>
    <div style="display: flex">
      <img src="images/#{problem.id}.svg" height="200">
      <div>
        使用可能: <ul>#{bonus_graph.usable[problem.id]&.map{|b| %Q(<li>#{b.bonus} <a href="##{b.problem}">#{b.problem}</a></li>)}&.join} </ul>
        取得可能: <ul>#{bonus_graph.obtainable[problem.id]&.map{|b| %Q(<li>#{b.bonus} <a href="##{b.problem}">#{b.problem}</a></li>)}&.join} </ul>
      </div>
    </div>
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

def page_header(solution_names)
  <<-LINKS
<div style="margin-bottom: 32px">
  <a href="best.html" style="margin-right: 10px"><h3>Best</h3></a>
  <div style="display: flex">
    使用：
    <a href="globalist.html" style="margin-right: 10px"><h3>Globalist</h3></a>
    <a href="break_a_leg.html" style="margin-right: 10px"><h3>Break a Leg</h3></a>
    <a href="wallhack.html" style="margin-right: 10px"><h3>Wallhack</h3></a>
    <a href="superflex.html" style="margin-right: 10px"><h3>Superflex</h3></a>
  </div>
  <div style="display: flex">
    取得：
    <a href="globalist_get.html" style="margin-right: 10px"><h3>Globalist</h3></a>
    <a href="break_a_leg_get.html" style="margin-right: 10px"><h3>Break a Leg</h3></a>
    <a href="wallhack_get.html" style="margin-right: 10px"><h3>Wallhack</h3></a>
    <a href="superflex_get.html" style="margin-right: 10px"><h3>Superflex</h3></a>
  </div>
  <div style="display: flex">
    使用可能：
    <a href="globalist_usable.html" style="margin-right: 10px"><h3>Globalist</h3></a>
    <a href="break_a_leg_usable.html" style="margin-right: 10px"><h3>Break a Leg</h3></a>
    <a href="wallhack_usable.html" style="margin-right: 10px"><h3>Wallhack</h3></a>
    <a href="superflex_usable.html" style="margin-right: 10px"><h3>Superflex</h3></a>
  </div>
  <div style="display: flex">
    取得可能：
    <a href="globalist_obtainable.html" style="margin-right: 10px"><h3>Globalist</h3></a>
    <a href="break_a_leg_obtainable.html" style="margin-right: 10px"><h3>Break a Leg</h3></a>
    <a href="wallhack_obtainable.html" style="margin-right: 10px"><h3>Wallhack</h3></a>
    <a href="superflex_obtainable.html" style="margin-right: 10px"><h3>Superflex</h3></a>
  </div>
  <div style="display: flex; flex-wrap: wrap; line-height: 1.5em">
    #{solution_names.map { |sn| %Q(<div style="margin-right: 10px"><a href="#{sn}.html">#{sn}</a></div>) }.join}
  </div>
</div>
LINKS
end

Row = Struct.new(:problem, :solution, :dislike)
def write_index(f, rows, solution_title = nil, solution_names = [], bonus_graph)
  solution_header = solution_title && %Q(<h2>Name: #{solution_title}</h2>)

  f.puts <<-EOF
<!doctype html>
<html>
<head>
  <title>Manarimo Portal</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body style="margin: 0 100px">
  <h1><a href="index.html">Manarimo Portal</a></h1>
  #{page_header(solution_names)}
  #{solution_header}
  <table border>
    <tr>
      <th>Problem ID</th>
      <th>Thumbnail</th>
      <th>Spec</th>
      <th>Solution</th>
      <th>Solver</ht>
      <th>Dislikes</th>
      <th>Score</th>
    </tr>
    #{rows.map {|row| index_tr(row.problem, row.solution, row.dislike, bonus_graph) }.join}
  </table>
</body>
</html>
EOF
end

def write_top_solutions(file, title, problems, solutions, dislikes, bonus_graph, &block)
  top_solutions = {}
  solutions.each do |name, list|
    list.each do |id, solution|
      next if solution.verdict == nil || !solution.verdict['isValid']
      if block_given?
        next unless block.call(solution)
      end
      current_verdict = top_solutions[id]&.verdict
      if current_verdict == nil || (current_verdict['isValid'] && current_verdict['score'] > solution.verdict['score'])
        top_solutions[id] = solution
      end
    end
  end

  if title != 'Best'
    problems = problems.select { |p| top_solutions.has_key?(p.id) }
  end

  File.open(file, 'w') do |f|
    rows = problems.map { |p|
      Row.new(p, top_solutions[p.id], dislikes[p.id])
    }
    write_index(f, rows, title, solutions.keys.sort, bonus_graph)
  end
end

problems = Problem::load_problems
problems.each do |prob|
  File.open("#{__dir__}/../web/images/#{prob.id}.svg", 'w') do |f|
    write_svg(f, prob)
  end
end

problems_dict = problems.map { |prob| [prob.id, prob] }.to_h

solutions = Problem::load_solutions

dislikes = File.open("#{__dir__}/../problems/minimal_dislikes.txt") { |f|
  JSON.load(f).map { |e| [e['problem_id'], e['minimal_dislikes']] }.to_h
}

bonus_graph = Problem::bonus_graph(problems)
solution_names = solutions.keys.sort

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
    rows = problems.select{|p| solutions[solution_name].has_key?(p.id)}.map{|p|
      Row.new(p, solutions[solution_name][p.id], dislikes[p.id])
    }
    write_index(f, rows, solution_name, solution_names, bonus_graph)
  end
end

# 個別問題解答集
problems.each do |problem|
  rows = []
  solution_names.each do |name|
    rows << Row.new(problem, solutions[name][problem.id], dislikes[problem.id])
  end
  rows.sort_by! { |row| row.solution&.verdict&.fetch('score') || Float::INFINITY }
  File.open("#{__dir__}/../web/#{problem.id}.html", "w") do |f|
    write_index(f, rows, "Problem #{problem.id}", solution_names, bonus_graph)
  end
end

File.open("#{__dir__}/../web/index.html", 'w') do |f|
  rows = problems.map { |p|
    Row.new(p, nil, nil)
  }
  write_index(f, rows, nil, solutions.keys.sort, bonus_graph)
end

write_top_solutions("#{__dir__}/../web/best.html", "Best", problems, solutions, dislikes, bonus_graph)

%w(GLOBALIST BREAK_A_LEG WALLHACK SUPERFLEX).each do |bonus_name|
  write_top_solutions("#{__dir__}/../web/#{bonus_name.downcase}.html", "#{bonus_name}使用", problems, solutions, dislikes, bonus_graph) do |sol|
    sol.bonuses&.any? { |b| b.bonus == bonus_name }
  end

  write_top_solutions("#{__dir__}/../web/#{bonus_name.downcase}_get.html", "#{bonus_name}取得", problems, solutions, dislikes, bonus_graph) do |sol|
    sol.verdict&.fetch('bonusObtained')&.any? { |b| b['bonus'] == bonus_name }
  end

  usable = problems.select{|p| bonus_graph.to_use[bonus_name].index(p.id)}
  write_top_solutions("#{__dir__}/../web/#{bonus_name.downcase}_usable.html", "#{bonus_name}使用可能", usable, solutions, dislikes, bonus_graph)

  obtainable = problems.select{|p| bonus_graph.to_obtain[bonus_name].index(p.id)}
  write_top_solutions("#{__dir__}/../web/#{bonus_name.downcase}_obtainable.html", "#{bonus_name}取得可能", obtainable, solutions, dislikes, bonus_graph)
end