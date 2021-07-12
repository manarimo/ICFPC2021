ICFPC 2021 Team Manarimo
================================

# Team Members
* Keita Komuro
* Kenkou Nakamura (@kenkoooo)
* mkut
* Osamu Koga (@osa_k)
* Shunsuke Ohashi (@pepsin_amylase)
* Yosuke Yano (@y3eadgbe)
* Yu Fujikake (@yuusti)
* Yuki Kawata (@kawatea03)

# GitHub
* Organization icon "manarimo" illustration by @yuusti

# Portal site
* Problem listing http://icfpc2021-manarimo.s3-website-us-east-1.amazonaws.com/best.html
* Manual solving http://icfpc2021-manarimo.s3-website-us-east-1.amazonaws.com/kenkoooo/#/problem/1

The portal site is generated by `gen_web/main.rb`. It's fully hosted by static files (no server applications).

# AI
## Solvers
* mkut was an extremetly sophisticated neural-network based UI that mainly solved problems which were known to be able to achieve dislike of 0.
* amylase/bruteforce: our first automated solver. returns an optimal solution for small problems.
* amylase/manten: an specialized solver for zero dislike problems. manten means full-score in Japanese.
* kawatea/simulated_annealing.cpp: runs simulated annealing to optimze the placement of vertices.

## Submission
* amylase/package_solutions: Resolve bonus dependencies and maximize expected ranking point using Integer Programming solver.
