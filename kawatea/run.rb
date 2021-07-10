`mkdir ../solutions/kawatea-simulated-annealing-fast`
(1..78).each do |i|
  `./nomod < ../problems/#{i}.json > ../solutions/kawatea-simulated-annealing-fast/#{i}.json`
end