#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <vector>
#include <algorithm>
#include <fstream>
#include <iostream>
#include <set>
#include "../cpp-lib/problem.h"
#include "../cpp-lib/geo.h"

#ifndef X
#define X first
#define Y second
#endif

using namespace std;
using namespace manarimo;

problem_t problem;

bool stretch(const number &d1, const number &d2, const number epsilon) {
    return abs((d1 * 1. / d2 - 1)) * 1000000. < (epsilon + 1e-9);
}

int dfs(const vector<vector<double>> &fig_dist, const vector<vector<E>> &graph, const vector<P> hole,
        const vector<number> &hole_d, const vector<number> &edge_d, int v, int i,
        vector<int> &used, vector<int> &pos, number epsilon, int start, vector<vector<int>> &result, int threshold) {
    i %= hole_d.size();
    if (i == start) {
        pos.push_back(v);
        result.push_back(pos);

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
            bool valid = true;
            // TODO edakari naosu
//            int n = (i + hole.size() - start) % hole.size();
//            for (int j = 0; j < n; ++j) {
//                int jj = (j + start) % hole.size();
//
//                cerr << endl << d(hole[jj], hole[i]) << endl;
//                cerr << fig_dist[pos[j]][to] << endl;
//                if (d(hole[jj], hole[i]) > fig_dist[pos[j]][to]) valid = false;
//            }

            if (valid)
                best = max(best, dfs(fig_dist, graph, hole, hole_d, edge_d, to, i + 1, used, pos, epsilon, start,
                                     result, threshold));
        }
    }

    used[v] = false;
    pos.pop_back();

    return best;
}

int place_triangle_dfs(problem_t &problem, const vector<vector<E>> &graph, const vector<P> &valid_points,
                       vector<P> &figure, const number epsilon, vector<int> &relocated, vector<int> &connected,
                       vector<P> &best_figure, int assigned = 0, int best_assigned = 0, int last_target = -1) {
    if (assigned > best_assigned) {
        best_assigned = assigned;
        best_figure = figure;
    }

    // find target
    int target = -1;

    int most_connected = 1;
    if (last_target != -1) {
        for (int i = 0; i < graph[last_target].size(); ++i) {
            int to = graph[last_target][i].first;

            if (relocated[to]) continue;
            if (most_connected < connected[to]) {
                most_connected = connected[to];
                target = to;
            }
        }
    }

    for (int i = 0; i < connected.size(); ++i) {
        if (relocated[i]) continue;
        if (most_connected < connected[i]) {
            most_connected = connected[i];
            target = i;
        }
    }

    if (target == -1) return assigned;

    cout << "Assigned: " << assigned << " Next target: " << target << " connected: " << connected[target] << endl;

    vector<pair<int, P>> adjacent;
    for (int i = 0; i < graph[target].size(); ++i) {
        int to = graph[target][i].first;
        ++connected[to];

        if (relocated[to]) {
            adjacent.emplace_back(to, figure[to]);
        }
    }
    relocated[target] = 1;

    // calculate candidate positions of the new point
    vector<P> candidates;
    for (const P &p : valid_points) {
        bool ok = true;
        for (auto adj: adjacent) {
            if (!ok) break;

            if (problem.is_edge_inside(p, adj.second) &&
                (stretch(d(adj.second, p), d(problem.figure.vertices[adj.first], problem.figure.vertices[target]), epsilon))) {
                for (P cand: candidates) {
                    // TODO: come up with better way of sieving candidates
                    if (abs(cand.first - p.first) + abs(cand.second - p.second) < (problem.max_x - problem.min_x + problem.max_y - problem.min_y) / 20) {
                        ok = false;
                    }
                }
            } else {
                ok = false;
            }
        }
        if (ok && candidates.size() < 3) candidates.push_back(p);
    }

    cout << "Found " << candidates.size() << " candidates" << endl;

    P reserve = figure[target];
    for (P candidate: candidates) {
        figure[target] = candidate;
        cout << "Check candidate: (" << candidate.X << ", " << candidate.Y << ")" << endl;
        best_assigned = max(best_assigned, place_triangle_dfs(problem, graph, valid_points,
                                                              figure, epsilon, relocated, connected, best_figure,
                                                              assigned + 1, best_assigned, target));
    }
    figure[target] = reserve;

    if (candidates.empty()) {
        cout << "skip -> Assigned: " << assigned << " Next target: " << target << " connected: " << connected[target] << endl;
        best_assigned = max(best_assigned, place_triangle_dfs(problem, graph, valid_points,
                                                              figure, epsilon, relocated, connected, best_figure,
                                                              assigned, best_assigned, target));
    }

    for (int i = 0; i < graph[target].size(); ++i) {
        int to = graph[target][i].first;
        --connected[to];
    }
    relocated[target] = 0;

    cout << "end -> Assigned: " << assigned << " Next target: " << target << " connected: " << connected[target] << endl;

    return best_assigned;
}

int main() {
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
        hole_d.push_back(d(hole[i], hole[(i + 1) % hole.size()]));
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

    // calc maximum distance
    vector<vector<double>> dist(n, vector<double>(n, 1e18));
    for (int i = 0; i < edge.size(); ++i)
        dist[edge[i].first][edge[i].second] = dist[edge[i].second][edge[i].first] = sqrt(edge_d[i]) * 1.1;
    for (int i = 0; i < n; ++i)
        dist[i][i] = 0;

    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            for (int k = 0; k < n; ++k)
                dist[j][k] = min(dist[j][k], dist[j][i] + dist[i][k]);

    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            dist[i][j] *= dist[i][j];


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
            int threshold = 3;
            int len = dfs(dist, graph, hole, hole_d, edge_d, i, j + 1, used, pos, epsilon, j, result, threshold);

            if (len > threshold) {
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
    vector<int> relocated(n);
    bool warn = false;
    for (int i = 0; i < best_fit.size(); i++) {
        cout << best_fit[i] << " ";
        if (best_fit[i] != -1) {
            figure[best_fit[i]] = hole[i];
            relocated[best_fit[i]] = 1;
        }
        if (best_fit[i] != -1 && vused.find(best_fit[i]) != vused.end()) warn = true;
        vused.insert(best_fit[i]);
    }

    vector<int> connected(n);
    for (int i = 0; i < n; ++i) {
        if (!relocated[i]) continue;
        for (int j = 0; j < graph[i].size(); ++j) {
            int to = graph[i][j].first;
            ++connected[to];
        }
    }

    vector<P> valid_points;
    for (number x = problem.min_x; x < problem.max_x; ++x) {
        for (number y = problem.min_y; y < problem.max_y; ++y) {
            if (problem.is_point_inside(make_pair(x, y))) valid_points.emplace_back(x, y);
        }
    }

    vector<P> best_figure = figure;
    int best = place_triangle_dfs(problem, graph, valid_points, figure, epsilon, relocated, connected, best_figure);
    cout << "\nAssigned " << best << " vertices" << endl;


    cout << endl;
    problem.output(best_figure);
    cout << endl;
    if (warn) {
        cout << "!!! The same vertex is assigned to multiple corners !!!" << endl;
        return 0;
    }
}
