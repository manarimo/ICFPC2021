#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <vector>
#include <algorithm>
#include <fstream>
#include <iostream>
#include "problem.h"
#include "geo.h"

using namespace std;
using namespace manarimo;

const int MAX_CC = 200;
const int MAX_N = 1000;
const int MAX_M = 1000;
bool inside[MAX_CC][MAX_CC];
bool inside_double[MAX_CC * 2][MAX_CC * 2];
vector<P> available;
bool edge_inside[MAX_CC * MAX_CC][MAX_CC * MAX_CC];
vector<number> dist[MAX_CC * MAX_CC];
vector<number> dist_hole[MAX_CC * MAX_CC];
number min_len[MAX_M];
number max_len[MAX_M];
bool used[MAX_N];
vector<int> order;
int target[MAX_N];
int best_target[MAX_N];
number min_dislike = 0;
number best_dislike = 1e18;
number min_x = 1e18, min_y = 1e18, max_x = 0, max_y = 0;
P outer;
number counter;
problem_t problem;

bool is_point_inside(const vector<P>& hole, const P& point) {
    int crossings = 0;
    for (int i = 0; i < hole.size(); ++i) {
        int j = i + 1;
        if (__builtin_expect(j >= hole.size(), 0)) {
            j = 0;
        }
        if (is_on_segment(hole[i], hole[j], point)) return true;
        if (ccw(point, outer, hole[i]) * ccw(point, outer, hole[j]) < 0 && ccw(hole[i], hole[j], point) * ccw(hole[i], hole[j], outer) < 0) {
            ++crossings;
        }
    }
    return crossings % 2 == 1;
}

bool is_edge_inside(const vector<P>& hole, const P& p1, const P& p2) {
    int prev_ccw = ccw(p1, p2, hole[0]);
    for (int i = 0; i < hole.size(); ++i) {
        int j = i + 1;
        if (__builtin_expect(j >= hole.size(), 0)) {
            j = 0;
        }
        const int next_ccw = ccw(p1, p2, hole[j]);
        if (prev_ccw * next_ccw < 0 && ccw(hole[i], hole[j], p1) * ccw(hole[i], hole[j], p2) < 0) return false;
        prev_ccw = next_ccw;
    }
    
    static vector<P> splitting_points;
    splitting_points.clear();
    splitting_points.push_back(p1);
    splitting_points.push_back(p2);
    for (const P& p : hole) {
        if (is_on_segment(p1, p2, p)) splitting_points.push_back(p);
    }
    sort(splitting_points.begin(), splitting_points.end());

    for (int i = 0; i + 1 < splitting_points.size(); i++) {
        if (!inside_double[splitting_points[i].X + splitting_points[i + 1].X][splitting_points[i].Y + splitting_points[i + 1].Y]) return false;
    }
    
    return true;
}

bool check(const vector<P>& hole) {
    number dislike = 0;
    for (int i = 0; i < hole.size(); i++) {
        number min_p = 1e18;
        for (int j = 0; j < order.size(); j++) {
            min_p = min(min_p, dist_hole[target[j]][i]);
            if (min_p == 0) break;
        }
        dislike += min_p;
        if (dislike >= best_dislike) return false;
    }
    
    fprintf(stderr, "updated : %lld -> %lld\n", best_dislike, dislike);
    fflush(stderr);
    best_dislike = dislike;
    for (int i = 0; i < order.size(); i++) best_target[i] = target[i];
    fprintf(stderr, "{\"vertices\": [");
    for (int i = 0; i < order.size(); i++) {
        if (i > 0) fprintf(stderr, ", ");
        fprintf(stderr, "[%lld, %lld]", available[target[i]].X, available[target[i]].Y);
    }
    fprintf(stderr, "]}\n");
    fflush(stderr);
    
    return best_dislike <= min_dislike;
}

bool dfs(const vector<P>& hole, const vector<vector<pair<int, int>>>& graph, int x, bool flex_used) {
    if (counter % 100000 == 0) {
        fprintf(stderr, "%lld\n", counter);
        fflush(stderr);
    }
    counter++;
    
    if (x == order.size()) {
        return check(hole);
    } else {
        for (int i = 0; i < available.size(); i++) {
            bool ok = true;
            bool use_flex = false;
            for (const pair<int, int>& p : graph[order[x]]) {
                if (!edge_inside[i][target[p.first]]) {
                    ok = false;
                    break;
                }
                if (dist[i][target[p.first]] < min_len[p.second] || max_len[p.second] < dist[i][target[p.first]]) {
                    if (!flex_used && !use_flex) {
                        use_flex = true;
                    } else {
                        ok = false;
                        break;
                    }
                }
            }
            if (ok) {
                target[order[x]] = i;
                if (dfs(hole, graph, x + 1, flex_used | use_flex)) return true;
            }
        }
        return false;
    }
}

void output(const vector<P>& figure) {
    printf("{\"vertices\": [");
    for (int i = 0; i < figure.size(); i++) {
        if (i > 0) printf(", ");
        printf("[%lld, %lld]", figure[i].X, figure[i].Y);
    }
    printf("]}");
}

void output_svg(const char* file, const vector<P>& hole, const vector<pair<int, int>>& edge, const vector<P>& figure) {
    FILE* fp = fopen(file, "w");
    
    number min_x = 1e18, min_y = 1e18, max_x = 0, max_y = 0;
    for (const P& p : hole) {
        min_x = min(min_x, p.X - 10);
        min_y = min(min_y, p.Y - 10);
        max_x = max(max_x, p.X + 10);
        max_y = max(max_y, p.Y + 10);
    }
    for (const P& p : figure) {
        min_x = min(min_x, p.X - 10);
        min_y = min(min_y, p.Y - 10);
        max_x = max(max_x, p.X + 10);
        max_y = max(max_y, p.Y + 10);
    }
    
    fprintf(fp, "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n");
    fprintf(fp, "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/graphics/SVG/1.1/DTD/svg11.dtd\">\n");
    fprintf(fp, "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"%lld %lld %lld %lld\" style=\"background-color: #00000066\">\n", min_x, min_y, max_x - min_x, max_y - min_y);
    
    fprintf(fp, "  <path d=\"M ");
    for (int i = 0; i < hole.size(); i++) {
        if (i > 0) fprintf(fp, " L ");
        fprintf(fp, "%lld,%lld", hole[i].X, hole[i].Y);
    }
    fprintf(fp, "\" style=\"fill:#ffffff; fill-rule:evenodd; stroke: none\" />\n");
    
    fprintf(fp, "  <g style=\"fill:none;stroke:#ff0000;stroke-linecap:round\">");
    for (const pair<int, int>& p : edge) {
        fprintf(fp, "<path d=\"M %lld,%lld L %lld,%lld\" />", figure[p.first].X, figure[p.first].Y, figure[p.second].X, figure[p.second].Y);
    }
    fprintf(fp, "</g>\n");
    
    fprintf(fp, "</svg>\n");
    
    fclose(fp);
}

int main(int argc, char* argv[]) {
    load_problem(std::cin, problem);

    vector<P> hole = problem.hole;
    vector<pair<int, int>> edge = problem.figure.edges;
    vector<P> figure = problem.figure.vertices;
    number epsilon = problem.epsilon;
    int n = figure.size();
    
    vector<vector<pair<int, int>>> graph(n);
    for (int i = 0; i < edge.size(); i++) {
        graph[edge[i].first].emplace_back(edge[i].second, i);
        graph[edge[i].second].emplace_back(edge[i].first, i);
    }
    
    for (const P& p : hole) {
        min_x = min(min_x, p.X);
        min_y = min(min_y, p.Y);
        max_x = max(max_x, p.X);
        max_y = max(max_y, p.Y);
    }
    outer = make_pair(max_x * 2 + 1, max_y * 2 + 1);
    
    for (int x = min_x; x <= max_x; x++) {
        for (int y = min_y; y <= max_y; y++) {
            inside[x][y] = is_point_inside(hole, make_pair(x, y));
            if (inside[x][y]) available.emplace_back(x, y);
        }
    }
    
    vector<P> double_hole(hole.size());
    for (int i = 0; i < hole.size(); i++) double_hole[i] = make_pair(hole[i].X * 2, hole[i].Y * 2);
    for (int x = min_x * 2; x <= max_x * 2; x++) {
        for (int y = min_y * 2; y <= max_y * 2; y++) {
            inside_double[x][y] = is_point_inside(double_hole, make_pair(x, y));
        }
    }
    
    for (int i = 0; i < available.size(); i++) {
        dist[i].resize(available.size());
        dist_hole[i].resize(hole.size());
    }
    
    for (int i = 0; i < available.size(); i++) {
        for (int j = i + 1; j < available.size(); j++) {
            if (is_edge_inside(hole, available[i], available[j])) {
                edge_inside[i][j] = edge_inside[j][i] = true;
                dist[i][j] = dist[j][i] = d(available[i], available[j]);
            }
        }
        for (int j = 0; j < hole.size(); j++) {
            dist_hole[i][j] = d(available[i], hole[j]);
        }
    }
    
    for (int i = 0; i < edge.size(); i++) {
        number orig = d(figure[edge[i].first], figure[edge[i].second]);
        number diff = orig * epsilon / 1000000;
        min_len[i] = orig - diff;
        max_len[i] = orig + diff;
    }
    
    vector<vector<pair<int, int>>> new_graph(n);
    for (int i = 0; i < n; i++) {
        int best = -1, bx = 1e9, by = 1e9;
        for (int j = 0; j < n; j++) {
            if (used[j]) continue;
            int x = 0, y = 0;
            for (const pair<int, int>& p : graph[j]) {
                if (used[p.first]) {
                    x++;
                } else {
                    y++;
                }
            }
            if (y < by || (y == by && x > bx)) {
                best = j;
                bx = x;
                by = y;
            }
        }
        used[best] = true;
        order.push_back(best);
        for (const pair<int, int>& p : graph[best]) {
            if (used[p.first]) new_graph[best].push_back(p);
        }
    }
    
    if (argc >= 3) min_dislike = atol(argv[2]);
    
    dfs(hole, new_graph, 0, false);
    
    fprintf(stderr, "searched: %lld\n", counter);
    fprintf(stderr, "dislike: %lld\n", best_dislike);
    vector<P> best_figure(n);
    for (int i = 0; i < n; i++) best_figure[i] = available[best_target[i]];
    output(best_figure);
    if (argc >= 2) output_svg(argv[1], hole, edge, best_figure);
    
    return 0;
}
