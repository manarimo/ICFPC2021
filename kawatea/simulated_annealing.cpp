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

const int MAX_C = 1000;
const int MAX_M = 1000;
bool inside[MAX_C][MAX_C];
bool inside_double[MAX_C * 2][MAX_C * 2];
double dist[MAX_C][MAX_C];
number min_len[MAX_M];
number max_len[MAX_M];
number min_x = 1e18, min_y = 1e18, max_x = 0, max_y = 0;
double penalty_weight;
P outer;

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

#ifndef START_TEMP
#define START_TEMP 100
#endif

#ifndef TIME_LIMIT
#define TIME_LIMIT 10
#endif

class simulated_annealing {
    public:
    simulated_annealing();
    inline double get_time();
    inline bool end();
    inline bool accept(double current_score, double next_score);
    void print() const;
    
    private:
    constexpr static bool MAXIMIZE = false;
    constexpr static int LOG_SIZE = 0xFFFF;
    constexpr static int UPDATE_INTERVAL = 0xFF;
    constexpr static double END_TEMP = 1e-9;
    constexpr static double TEMP_RATIO = (END_TEMP - START_TEMP) / TIME_LIMIT;
    double log_probability[LOG_SIZE + 1];
    long long iteration = 0;
    long long accepted = 0;
    long long rejected = 0;
    double time = 0;
    double temp = START_TEMP;
    timer timer1;
};

simulated_annealing::simulated_annealing() {
    timer1.start();
    for (int i = 0; i <= LOG_SIZE; i++) log_probability[i] = log(random::probability());
}

inline double simulated_annealing::get_time() {
    return time;
}

inline bool simulated_annealing::end() {
    iteration++;
    if ((iteration & UPDATE_INTERVAL) == 0) {
        time = timer1.get_time();
        temp = START_TEMP + TEMP_RATIO * time;
        return time >= TIME_LIMIT;
    } else {
        return false;
    }
}

inline bool simulated_annealing::accept(double current_score, double next_score) {
    double diff = (MAXIMIZE ? next_score - current_score : current_score - next_score);
    if (diff >= 0 || diff > log_probability[random::get_fast(LOG_SIZE)] * temp) {
        accepted++;
        return true;
    } else {
        rejected++;
        return false;
    }
}

void simulated_annealing::print() const {
    fprintf(stderr, "iteration: %lld\n", iteration);
    fprintf(stderr, "accepted: %lld\n", accepted);
    fprintf(stderr, "rejected: %lld\n", rejected);
}

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
    if (!inside[p1.X][p1.Y]) return false;
    if (!inside[p2.X][p2.Y]) return false;

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

number calc_dislike(const vector<P>& hole, const vector<P>& positions) {
    number ds = 0;

    for (const P& h: hole) {
        number min_p = 1e18;

        for (const P& p: positions) {
            min_p = min(min_p, d(h, p));
            if (min_p == 0) break;
        }
        ds += min_p;
    }
    return ds;
}

number calc_dislike(const vector<P>& hole, const vector<P>& figure, const vector<P>& new_figure, const vector<int>& update) {
    number ds = 0;
    int v = -1, w = -1;
    if (update.size() == 1) {
        v = update[0];
    } else if (update.size() == 2) {
        v = update[0];
        w = update[1];
    }

    for (const P& h: hole) {
        number min_p = 1e18;
        for (int i = 0; i < figure.size(); i++) {
            if (i == v || i == w) {
                min_p = min(min_p, d(h, new_figure[i]));
            } else {
                min_p = min(min_p, d(h, figure[i]));
            }
        }
        ds += min_p;
    }
    return ds;
}

double dist_hole_point(const vector<P>& hole, const P& p) {
    double dist = 1e18;
    for (int i = 0; i < hole.size(); i++) {
        dist = min(dist, dist_line(hole[i], hole[(i + 1) % hole.size()], p));
    }
    return dist;
}

double calc_penalty_vertex(const vector<P>& figure) {
    double penalty = 0;
    for (const P& p : figure) penalty += dist[p.X][p.Y];
    return penalty;
}

double penalty_vertex_diff(const P& orig, const P& dest) {
    return dist[dest.X][dest.Y] - dist[orig.X][orig.Y];
}

double calc_penalty_edge(const vector<P>& hole, const vector<pair<int, int>>& edge, const vector<P>& figure) {
    double penalty = 0;
    for (const pair<int, int>& p : edge) {
        if (!is_edge_inside(hole, figure[p.first], figure[p.second])) penalty += penalty_weight;
    }
    return penalty;
}

double penalty_edge_diff(const vector<P>& hole, const vector<vector<pair<int, int>>>& graph, const vector<P>& figure, int v, const P& orig, const P& dest) {
    double diff = 0;
    for (const pair<int, int>& p : graph[v]) {
        if (!is_edge_inside(hole, orig, figure[p.first])) diff -= penalty_weight;
        if (!is_edge_inside(hole, dest, figure[p.first])) diff += penalty_weight;
    }
    return diff;
}

double penalty_edge_diff(const vector<P>& hole, const vector<vector<pair<int, int>>>& graph, const vector<P>& figure, int v1, const P& orig1, const P& dest1, int v2, const P& orig2, const P& dest2) {
    double diff = 0;
    for (const pair<int, int>& p : graph[v1]) {
        if (p.first == v2) {
            if (!is_edge_inside(hole, orig1, orig2)) diff -= penalty_weight;
            if (!is_edge_inside(hole, dest1, dest2)) diff += penalty_weight;
            continue;
        }
        if (!is_edge_inside(hole, orig1, figure[p.first])) diff -= penalty_weight;
        if (!is_edge_inside(hole, dest1, figure[p.first])) diff += penalty_weight;
    }
    for (const pair<int, int>& p : graph[v2]) {
        if (p.first == v1) continue;
        if (!is_edge_inside(hole, orig2, figure[p.first])) diff -= penalty_weight;
        if (!is_edge_inside(hole, dest2, figure[p.first])) diff += penalty_weight;
    }
    return diff;
}

number len_diff(number len, number min_len, number max_len) {
    if (len < min_len) return (min_len - len) * (min_len - len);
    if (len > max_len) return (len - max_len) * (len - max_len);
    return 0;
}

double calc_penalty_length(const vector<pair<int, int>>& edge, const vector<P>& figure) {
    double penalty = 0;
    for (int i = 0; i < edge.size(); i++) {
        penalty += len_diff(d(figure[edge[i].first], figure[edge[i].second]), min_len[i], max_len[i]);
    }
    return penalty;
}

double penalty_length_diff(const vector<vector<pair<int, int>>>& graph, const vector<P>& figure, int v, const P& orig, const P& dest) {
    double diff = 0;
    for (const pair<int, int>& p : graph[v]) {
        diff -= len_diff(d(orig, figure[p.first]), min_len[p.second], max_len[p.second]);
        diff += len_diff(d(dest, figure[p.first]), min_len[p.second], max_len[p.second]);
    }
    return diff;
}

double penalty_length_diff(const vector<vector<pair<int, int>>>& graph, const vector<P>& figure, int v1, const P& orig1, const P& dest1, int v2, const P& orig2, const P& dest2) {
    double diff = 0;
    for (const pair<int, int>& p : graph[v1]) {
        if (p.first == v2) {
            diff -= len_diff(d(orig1, orig2), min_len[p.second], max_len[p.second]);
            diff += len_diff(d(dest1, dest2), min_len[p.second], max_len[p.second]);
            continue;
        }
        diff -= len_diff(d(orig1, figure[p.first]), min_len[p.second], max_len[p.second]);
        diff += len_diff(d(dest1, figure[p.first]), min_len[p.second], max_len[p.second]);
    }
    for (const pair<int, int>& p : graph[v2]) {
        if (p.first == v1) continue;
        diff -= len_diff(d(orig2, figure[p.first]), min_len[p.second], max_len[p.second]);
        diff += len_diff(d(dest2, figure[p.first]), min_len[p.second], max_len[p.second]);
    }
    return diff;
}

bool outside(const P& p) {
    return p.X < min_x || p.X > max_x || p.Y < min_y || p.Y > max_y;
}

bool outside(const vector<P>& figure) {
    for (const P& p : figure) {
        if (outside(p)) return true;
    }
    return false;
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
    problem prob = load_problem(std::cin);

    vector<P> hole = prob.hole;
    vector<pair<int, int>> edge = prob.figure.edges;
    vector<P> figure = prob.figure.vertices;
    number epsilon = prob.epsilon;
    
    vector<P> figure_hint;
    if (argc >= 3) {
        ifstream i(argv[2]);
        json j;
        i >> j;
        hint h = j.get<hint>();
        figure_hint = h.vertices;
    }

    int n = figure.size();
    
    vector<vector<pair<int, int>>> graph(n);
    for (int i = 0; i < edge.size(); i++) {
        graph[edge[i].first].emplace_back(edge[i].second, i);
        graph[edge[i].second].emplace_back(edge[i].first, i);
    }
    vector<int> d1, d2;
    for (int i = 0; i < n; i++) {
        if (graph[i].size() == 1) {
            d1.push_back(i);
        } else if (graph[i].size() == 2) {
            d2.push_back(i);
        }
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
            if (!inside[x][y]) dist[x][y] = dist_hole_point(hole, make_pair(x, y));
        }
    }
    
    vector<P> double_hole(hole.size());
    for (int i = 0; i < hole.size(); i++) double_hole[i] = make_pair(hole[i].X * 2, hole[i].Y * 2);
    for (int x = min_x * 2; x <= max_x * 2; x++) {
        for (int y = min_y * 2; y <= max_y * 2; y++) {
            inside_double[x][y] = is_point_inside(double_hole, make_pair(x, y));
        }
    }
    
    for (int i = 0; i < edge.size(); i++) {
        number orig = d(figure[edge[i].first], figure[edge[i].second]);
        number diff = orig * epsilon / 1000000;
        min_len[i] = orig - diff;
        max_len[i] = orig + diff;
    }
    
    if (!figure_hint.empty()) figure = figure_hint;
    
    for (int i = 0; i < n; i++) {
        if (outside(figure[i])) {
            if (figure[i].X < min_x) {
                figure[i].X = min_x;
            } else if (figure[i].X > max_x) {
                figure[i].X = max_x;
            }
            if (figure[i].Y < min_y) {
                figure[i].Y = min_y;
            } else if (figure[i].Y > max_y) {
                figure[i].Y = max_y;
            }
        }
    }
    
    number dislike = calc_dislike(hole, figure);
    double weight = sqrt(dislike);
    penalty_weight = dislike / edge.size();
    
    double penalty_vertex = calc_penalty_vertex(figure);
    double penalty_edge = calc_penalty_edge(hole, edge, figure);
    double penalty_length = calc_penalty_length(edge, figure);
    fprintf(stderr, "initial_penalty: %.6lf %.6lf %.6lf\n", penalty_vertex, penalty_edge, penalty_length);
    fflush(stderr);
    
    simulated_annealing sa;
    number best_dislike = 1e18;
    vector<P> new_figure(n);
    vector<P> best_figure(n);
    while (!sa.end()) {
        int select = random::get(105);
        double penalty_weight = weight * (sa.get_time() + 1) * (sa.get_time() + 1);
        double new_penalty_vertex = penalty_vertex;
        double new_penalty_edge = penalty_edge;
        double new_penalty_length = penalty_length;
        number new_dislike = 0;
        static vector<int> update;
        update.clear();
        
        if (select < 40) {
            // ランダムな点を動かす
            int dx = random::get(3);
            int dy = random::get(3);
            dx--;
            dy--;
            if (dx == 0 && dy == 0) continue;
            
            int v = random::get(n);
            new_figure[v].X = figure[v].X + dx;
            new_figure[v].Y = figure[v].Y + dy;
            if (outside(new_figure[v])) continue;
            update.push_back(v);
        } else if (select < 80) {
            // ランダムな辺を動かす
            int dx = random::get(3);
            int dy = random::get(3);
            dx--;
            dy--;
            if (dx == 0 && dy == 0) continue;
            
            int r = random::get(edge.size());
            int v = edge[r].first;
            int w = edge[r].second;
            new_figure[v].X = figure[v].X + dx;
            new_figure[v].Y = figure[v].Y + dy;
            new_figure[w].X = figure[w].X + dx;
            new_figure[w].Y = figure[w].Y + dy;
            if (outside(new_figure[v]) || outside(new_figure[w])) continue;
            update.push_back(v);
            update.push_back(w);
        } else if (select < 85) {
            // 全体を平行移動する
            int dx = random::get(3);
            int dy = random::get(3);
            dx--;
            dy--;
            if (dx == 0 && dy == 0) continue;
            
            for (int i = 0; i < n; i++) {
                new_figure[i].X = figure[i].X + dx;
                new_figure[i].Y = figure[i].Y + dx;
            }
            if (outside(new_figure)) continue;
        } else if (select < 90) {
            // 次数1の頂点を選び、点対称な位置に移す
            if (d1.size() == 0) continue;
            int v = d1[random::get(d1.size())];
            
            int w = graph[v][0].first;
            new_figure[v].X = figure[w].X * 2 - figure[v].X;
            new_figure[v].Y = figure[w].Y * 2 - figure[v].Y;
            if (outside(new_figure[v])) continue;
            update.push_back(v);
        } else if (select < 95) {
            // 次数2の頂点を選び、三角形の対辺に対して鏡像移動する
            if (d2.size() == 0) continue;
            int v = d2[random::get(d2.size())];
            
            int w1 = graph[v][0].first;
            int w2 = graph[v][1].first;
            new_figure[v] = reflection(figure[w1], figure[w2], figure[v]);
            if (outside(new_figure[v])) continue;
            update.push_back(v);
        } else if (select < 100) {
            // ランダムな点をランダムなholeの頂点に移す
            int vf = random::get(n);
            int vh = random::get(hole.size());
            
            new_figure[vf] = hole[vh];
            if (outside(new_figure[vf])) continue;
            update.push_back(vf);
        } else if (select < 105) {
            // はみ出している辺の端点をもう一方の端点に近いholeの頂点に移す
            static vector<int> candidate;
            candidate.clear();
            for (int i = 0; i < edge.size(); i++) {
                if (!is_edge_inside(hole, figure[edge[i].first], figure[edge[i].second])) candidate.push_back(i);
            }
            if (candidate.size() == 0) continue;
            
            int r = random::get(candidate.size());
            int vf = edge[r].first;
            int wf = edge[r].second;
            if (random::toss()) swap(vf, wf);
            int vh = -1;
            number md = 1e18;
            for (int i = 0; i < hole.size(); i++) {
                number cd = d(figure[wf], hole[i]);
                if (cd < md) {
                    vh = i;
                    md = cd;
                }
            }
            new_figure[vf] = hole[vh];
            if (outside(new_figure[vf])) continue;
            update.push_back(vf);
        }
        
        if (update.empty()) {
            new_penalty_vertex = calc_penalty_vertex(new_figure);
            new_penalty_edge = calc_penalty_edge(hole, edge, new_figure);
            new_penalty_length = calc_penalty_length(edge, new_figure);
            new_dislike = calc_dislike(hole, new_figure, figure, update);
        } else if (update.size() == 1) {
            int v = update[0];
            new_penalty_vertex += penalty_vertex_diff(figure[v], new_figure[v]);
            new_penalty_edge += penalty_edge_diff(hole, graph, figure, v, figure[v], new_figure[v]);
            new_penalty_length += penalty_length_diff(graph, figure, v, figure[v], new_figure[v]);
            new_dislike = calc_dislike(hole, figure, new_figure, update);
        } else {
            int v = update[0];
            int w = update[1];
            new_penalty_vertex += penalty_vertex_diff(figure[v], new_figure[v]);
            new_penalty_vertex += penalty_vertex_diff(figure[w], new_figure[w]);
            new_penalty_edge += penalty_edge_diff(hole, graph, figure, v, figure[v], new_figure[v], w, figure[w], new_figure[w]);
            new_penalty_length += penalty_length_diff(graph, figure, v, figure[v], new_figure[v], w, figure[w], new_figure[w]);
            new_dislike = calc_dislike(hole, figure, new_figure, update);
        }
        if (sa.accept((penalty_vertex + penalty_edge + penalty_length) * penalty_weight + dislike, (new_penalty_vertex + new_penalty_edge + new_penalty_length) * penalty_weight + new_dislike)) {
            penalty_vertex = new_penalty_vertex;
            penalty_edge = new_penalty_edge;
            penalty_length = new_penalty_length;
            dislike = new_dislike;
            if (update.size() == 0) {
                figure.swap(new_figure);
            } else {
                for (int v : update) figure[v] = new_figure[v];
            }
            if (penalty_vertex + penalty_edge + penalty_length <= 1e-9 && dislike < best_dislike) {
                best_dislike = dislike;
                for (int i = 0; i < n; i++) best_figure[i] = figure[i];
                if (best_dislike == 0) break;
            }
        }
    }
    
    sa.print();
    
    if (best_dislike < 1e18) {
        fprintf(stderr, "dislike: %lld\n", best_dislike);
        output(best_figure);
        if (argc >= 2) output_svg(argv[1], hole, edge, best_figure);
    } else {
        fprintf(stderr, "final_penalty: %.6lf %.6lf %.6lf\n", penalty_vertex, penalty_edge, penalty_length);
        output(figure);
        if (argc >= 2) output_svg(argv[1], hole, edge, figure);
    }
    
    return 0;
}
