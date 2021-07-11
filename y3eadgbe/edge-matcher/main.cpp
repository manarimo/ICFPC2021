#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <vector>
#include <algorithm>
#include <fstream>
#include <iostream>
#include <set>
#include "problem.h"
#include "geo.h"

using namespace std;
using namespace manarimo;

const int MAX_M = 1000;
number min_len[MAX_M];
number max_len[MAX_M];
double penalty_weight;
problem_t problem;

class random {
public:
    // [0, x)
    inline static unsigned get(unsigned x) {
        return ((unsigned long long)xorshift() * x) >> 32;
    }

    // [x, y]
    inline static unsigned get(unsigned x, unsigned y) {
        return get(y - x + 1) + x;
    }

    // [0, x] (x = 2^c - 1)
    inline static unsigned get_fast(unsigned x) {
        return xorshift() & x;
    }

    // [0.0, 1.0]
    inline static double probability() {
        return xorshift() * INV_MAX;
    }

    inline static bool toss() {
        return xorshift() & 1;
    }

private:
    constexpr static double INV_MAX = 1.0 / 0xFFFFFFFF;

    inline static unsigned xorshift() {
        static unsigned x = 123456789, y = 362436039, z = 521288629, w = 88675123;
        unsigned t = x ^ (x << 11);
        x = y, y = z, z = w;
        return w = (w ^ (w >> 19)) ^ (t ^ (t >> 8));
    }
};

class timer {
public:
    void start() {
        origin = rdtsc();
    }

    inline double get_time() {
        return (rdtsc() - origin) * SECONDS_PER_CLOCK;
    }

private:
    constexpr static double SECONDS_PER_CLOCK = 1 / 3.0e9;
    unsigned long long origin;

    inline static unsigned long long rdtsc() {
        unsigned long long lo, hi;
        __asm__ volatile ("rdtsc" : "=a" (lo), "=d" (hi));
        return (hi << 32) | lo;
    }
};

bool stretch(const number& d1, const number &d2, const number epsilon) {
    return abs((d1 * 1. / d2 - 1)) * 1000000. < (epsilon + 1e-9);
}

int dfs(const vector<vector<E>> &graph, const vector<number> &hole_d, const vector<number> &edge_d, int v, int i, vector<int> &used, vector<int> &pos, number epsilon, int start, vector<vector<int>> &result, int threshold) {
    i %= hole_d.size();
    if (i == start) {
        return pos.size();
    }

    int best = pos.size();

    if (pos.size() > threshold) {
        result.push_back(pos);
    }

    used[v] = true;
    pos.push_back(v);

    for (auto e: graph[v]) {
        int to = e.first;
        if (used[to]) continue;
        number len = edge_d[e.second];

        if (stretch(hole_d[i], len, epsilon)) {
            best = max(best, dfs(graph, hole_d, edge_d, to, i + 1, used, pos, epsilon, start, result, threshold));
        }
    }

    used[v] = false;
    pos.pop_back();

    return best;
}

int main(int argc, char* argv[]) {
    int filter = -1;
    if (argc >= 2) {
      string filter_string(argv[1]);
      filter = stoi(filter_string);
      cout << "FILTER: " << filter << endl; 
    }
  
    load_problem(cin, problem);

    vector<P> hole = problem.hole;
    vector<E> edge = problem.figure.edges;
    vector<P> figure = problem.figure.vertices;
    number epsilon = problem.epsilon;

    int n = figure.size();

    vector<vector<E>> graph(n);
    for (int i = 0; i < edge.size(); i++) {
        graph[edge[i].first].emplace_back(edge[i].second, i);
        graph[edge[i].second].emplace_back(edge[i].first, i);
    }

    cout << n << endl;
    vector<number> hole_d;
    cout << "hole num: " << hole.size() << endl;
    for (int i = 0; i < hole.size(); ++i) {
        hole_d.push_back(d(hole[i], hole[(i+1)%hole.size()]));
        if (i == 0) {
            cout << "hole 0: " << hole[i].X << ' ' << hole[i].Y << endl;
        }
    }

    vector<number> edge_d;
    for (int i = 0; i < edge.size(); i++) {
        edge_d.push_back(d(figure[edge[i].first], figure[edge[i].second]));
    }

    vector<int> matched(hole_d.size());
    for (int i = 0; i < edge_d.size(); ++i) {
        for (int j = 0; j < hole_d.size(); ++j) {
            if (stretch(hole_d[j], edge_d[i], epsilon)) {
                matched[j]++;
            }
        }
    }

//    cout << hole_d.size() << endl;
//    cout << edge_d.size() << endl;

//    cout << endl;
//    for (int i = 0; i < hole_d.size(); ++i) {
//        cout << hole_d[i] << ((i == hole_d.size()-1) ? "\n":" ");
//    }
//
//    for (int i = 0; i < edge_d.size(); ++i) {
//        cout << edge_d[i] << ((i == edge_d.size()-1) ? "\n":" ");
//    }
//
//    for (int i = 0; i < matched.size(); ++i) {
//        cout << matched[i] << ((i == matched.size()-1) ? "\n":" ");
//    }

    vector<int> best_fit(hole_d.size());
    for (int i = 0; i < best_fit.size(); i++) {
        best_fit[i] = -1;
    }
    vector<int> best_len(hole_d.size());
    
    for (int i = 0; i < figure.size(); ++i) {
        for (int j = 0; j < hole_d.size(); ++j) {
            vector<int> used(figure.size());
            vector<int> pos;
            vector<vector<int>> result;
            int threshold = 1;
            int len = dfs(graph, hole_d, edge_d, i, j + 1, used, pos, epsilon, j, result, threshold);

            if (len > threshold) {
	      bool match_filter = false;
	      if (filter != -1) {
		for (int l = 0; l < len; l++) {
		  int ii = (j + 1 + l) % hole_d.size();
		  if (ii == filter) {
		    match_filter = true;
		    break;
		  }
		}
		if (!match_filter) continue;
	      }
                cout << "\n\n" << threshold + 1 << "-" << len << endl;
                cout << "start hole:" << (j + 1) % hole_d.size() << endl;
                for (int k = 0; k < result.size(); ++k) {
                    for (int l = 0; l < result[k].size(); ++l) {
                        cout << result[k][l] << (l == result[k].size() ? "\n" : " ");
                    }
		    if (len == result[k].size()) {
		        for (int l = 0; l < result[k].size(); l++) {
			    int ii = (j + 1 + l) % hole_d.size();
			    if (best_len[ii] < len) {
			        best_fit[ii] = result[k][l];
				best_len[ii] = len;
			    }
		        }
		    }
                    cout << endl;
                }
            }
        }
    }

    cout << "BEST FIT" << endl;
    set<int> vused;
    bool warn = false;
    for (int i = 0; i < best_fit.size(); i++) {
      cout << i << ":" << best_fit[i] << " ";
      if (best_fit[i] != -1) {
	figure[best_fit[i]] = hole[i];
      }
      if (best_fit[i] != -1 && vused.find(best_fit[i]) != vused.end()) warn = true;
      vused.insert(best_fit[i]);
    }
    cout << endl;
    if (warn) {
      cout << "!!! The same vertex is assigned to multiple corners !!!" << endl;
      return 0;
    }

    problem.output(figure);
    cout << endl;
}
