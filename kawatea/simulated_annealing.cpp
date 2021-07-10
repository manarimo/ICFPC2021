#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <vector>
#include <algorithm>
#include <fstream>
#include <iostream>
#include "json.hpp"

using namespace std;
using json = nlohmann::json;

#define X first
#define Y second

using number = long long;
using P = pair<number, number>;
using E = pair<int, int>;

const int MAX_C = 1000;
const int MAX_M = 1000;
bool inside[MAX_C][MAX_C];
bool inside_double[MAX_C * 2][MAX_C * 2];
double dist[MAX_C][MAX_C];
number min_len[MAX_M];
number max_len[MAX_M];
P outer;

struct figure_t {
   vector<E> edges;
   vector<P> vertices;
};

struct problem {
    vector<P> hole;
    figure_t figure;
    number epsilon;
};

struct hint {
    vector<P> vertices;
};

void from_json(const json& j, P& p) {
    j.at(0).get_to(p.first);
    j.at(1).get_to(p.second);
}

void from_json(const json& j, E& e) {
    j.at(0).get_to(e.first);
    j.at(1).get_to(e.second);
}

void from_json(const json& j, figure_t& f) {
    j.at("edges").get_to(f.edges);
    j.at("vertices").get_to(f.vertices);
}

void from_json(const json& j, problem& p) {
    j.at("hole").get_to(p.hole);
    j.at("figure").get_to(p.figure);
    j.at("epsilon").get_to(p.epsilon);
}

void from_json(const json& j, hint& h) {
    j.at("vertices").get_to(h.vertices);
}

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
    constexpr static double TIME_LIMIT = 10;
    constexpr static double START_TEMP = 100;
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

number dot(const P& p, const P& q) {
    return p.X * q.X + p.Y * q.Y;
}

number cross(const P& p, const P& q) {
    return p.X * q.Y - p.Y * q.X;
}

number ccw (const P& p, const P& q, const P& r) {
    return (q.X - p.X) * (r.Y - p.Y) - (q.Y - p.Y) * (r.X - p.X);
}

bool is_on_segment(const P& p1, const P& p2, const P& p) {
    number area = (p1.X - p.X) * (p2.Y - p.Y) - (p1.Y - p.Y) * (p2.X - p.X);
    if (area == 0 && (p1.X - p.X) * (p2.X - p.X) <= 0 && (p1.Y - p.Y) * (p2.Y - p.Y) <= 0) return true;
    return false;
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
    for (int i = 0; i < hole.size(); ++i) {
        int j = i + 1;
        if (__builtin_expect(j >= hole.size(), 0)) {
            j = 0;
        }
        if (ccw(p1, p2, hole[i]) * ccw(p1, p2, hole[j]) < 0 && ccw(hole[i], hole[j], p1) * ccw(hole[i], hole[j], p2) < 0) return false;
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

number d(const P& p, const P& q) {
    return (p.X - q.X) * (p.X - q.X) + (p.Y - q.Y) * (p.Y - q.Y);
}

number calc_dislike(const vector<P>& hole, const vector<P>& positions) {
    number ds = 0;

    #pragma omp parallel
    for (const P& h: hole) {
        number min_p = 1e18;

        #pragma omp parallel
        for (const P& p: positions) {
            min_p = min(min_p, d(h, p));
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

double dist_point(double px1, double py1, double px2, double py2) {
    return (px2 - px1) * (px2 - px1) + (py2 - py1) * (py2 - py1);
}

double get_ratio(const P& l1, const P& l2, const P& p) {
    double vx = l2.X - l1.X;
    double vy = l2.Y - l1.Y;
    double wx = p.X - l1.X;
    double wy = p.Y - l1.Y;
    return (double)(vx * wx + vy * wy) / (vx * vx + vy * vy);    
}

double dist_line(const P& l1, const P& l2, const P& p) {
    double t = get_ratio(l1, l2, p);
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    return dist_point(l1.X + (l2.X - l1.X) * t, l1.Y + (l2.Y - l1.Y) * t, p.X, p.Y);
}

double dist_hole_point(const vector<P>& hole, const P& p) {
    double dist = 1e18;
    for (int i = 0; i < hole.size(); i++) {
        dist = min(dist, dist_line(hole[i], hole[(i + 1) % hole.size()], p));
    }
    return dist;
}

P reflection(const P& p1, const P& p2, const P& p) {
    double t = get_ratio(p1, p2, p);
    double x = p1.X + t * (p2.X - p1.X) * 2 - p.X;
    double y = p1.Y + t * (p2.Y - p1.Y) * 2 - p.Y;
    return make_pair(round(x), round(y));
}

number read_number() {
    number x;
    scanf("%lld", &x);
    return x;
}

vector<P> read_hole() {
    int n = read_number();
    
    vector<P> hole(n);
    for (int i = 0; i < n; i++) {
        number x = read_number();
        number y = read_number();
        hole[i] = make_pair(x, y);
    }
    
    return hole;
}

vector<pair<int, int>> read_edge() {
    int m = read_number();
    
    vector<pair<int, int>> edge(m);
    for (int i = 0; i < m; i++) {
        int x = read_number();
        int y = read_number();
        edge[i] = make_pair(x, y);
    }
    
    return edge;
}

vector<P> read_figure() {
    int n = read_number();
    
    vector<P> figure(n);
    for (int i = 0; i < n; i++) {
        number x = read_number();
        number y = read_number();
        figure[i] = make_pair(x, y);
    }
    
    return figure;
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
        if (!is_edge_inside(hole, figure[p.first], figure[p.second])) penalty += 10;
    }
    return penalty;
}

double penalty_edge_diff(const vector<P>& hole, const vector<vector<pair<int, int>>>& graph, const vector<P>& figure, int v, const P& orig, const P& dest) {
    double diff = 0;
    for (const pair<int, int>& p : graph[v]) {
        if (!is_edge_inside(hole, orig, figure[p.first])) diff -= 10;
        if (!is_edge_inside(hole, dest, figure[p.first])) diff += 10;
    }
    return diff;
}

double penalty_edge_diff(const vector<P>& hole, const vector<vector<pair<int, int>>>& graph, const vector<P>& figure, int v1, const P& orig1, const P& dest1, int v2, const P& orig2, const P& dest2) {
    double diff = 0;
    for (const pair<int, int>& p : graph[v1]) {
        if (p.first == v2) {
            if (!is_edge_inside(hole, orig1, orig2)) diff -= 10;
            if (!is_edge_inside(hole, dest1, dest2)) diff += 10;
            continue;
        }
        if (!is_edge_inside(hole, orig1, figure[p.first])) diff -= 10;
        if (!is_edge_inside(hole, dest1, figure[p.first])) diff += 10;
    }
    for (const pair<int, int>& p : graph[v2]) {
        if (p.first == v1) continue;
        if (!is_edge_inside(hole, orig2, figure[p.first])) diff -= 10;
        if (!is_edge_inside(hole, dest2, figure[p.first])) diff += 10;
    }
    return diff;
}

number len_diff(number len, number min_len, number max_len) {
    if (len < min_len) return min_len - len;
    if (len > max_len) return len - max_len;
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
    return p.X < 0 || p.X >= MAX_C || p.Y < 0 || p.Y >= MAX_C;
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
    json j;
    std::cin >> j;
    problem prob = j.get<problem>();

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
    
    number mx = 0, my = 0;
    for (const P& p : hole) {
        mx = max(mx, p.X);
        my = max(my, p.Y);
    }
    outer = make_pair(mx * 2 + 1, my * 2 + 1);
    
    for (int x = 0; x < MAX_C; x++) {
        for (int y = 0; y < MAX_C; y++) {
            inside[x][y] = is_point_inside(hole, make_pair(x, y));
            if (!inside[x][y]) dist[x][y] = dist_hole_point(hole, make_pair(x, y));
        }
    }
    
    vector<P> double_hole(hole.size());
    for (int i = 0; i < hole.size(); i++) double_hole[i] = make_pair(hole[i].X * 2, hole[i].Y * 2);
    for (int x = 0; x < MAX_C * 2; x++) {
        for (int y = 0; y < MAX_C * 2; y++) {
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
    
    double penalty_vertex = calc_penalty_vertex(figure);
    double penalty_edge = calc_penalty_edge(hole, edge, figure);
    double penalty_length = calc_penalty_length(edge, figure);
    number dislike = calc_dislike(hole, figure);
    double weight = sqrt(dislike);
    fprintf(stderr, "initial_penalty: %.6lf %.6lf %.6lf\n", penalty_vertex, penalty_edge, penalty_length);
    fflush(stderr);
    
    simulated_annealing sa;
    number best_dislike = 1e18;
    vector<P> new_figure(n);
    vector<P> best_figure(n);
    while (!sa.end()) {
        int select = random::get(100);
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
            int v = random::get(n);
            if (graph[v].size() != 1) continue;
            
            int w = graph[v][0].first;
            new_figure[v].X = figure[w].X * 2 - figure[v].X;
            new_figure[v].Y = figure[w].Y * 2 - figure[v].Y;
            if (outside(new_figure[v])) continue;
            update.push_back(v);
        } else if (select < 95) {
            // 次数2の頂点を選び、三角形の対辺に対して鏡像移動する
            int v = random::get(n);
            if (graph[v].size() != 2) continue;
            
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
            if (penalty_vertex + penalty_edge + penalty_length == 0 && dislike < best_dislike) {
                best_dislike = dislike;
                for (int i = 0; i < n; i++) best_figure[i] = figure[i];
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
