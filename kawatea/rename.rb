require 'fileutils'

Dir.glob("*.json") do |f|
  m = f.match(/^(\d+)_/)
  if m
    to = "#{m[1]}.json"
    puts "Rename #{f} -> #{to}"
    FileUtils.mv(f, to)
  end
end