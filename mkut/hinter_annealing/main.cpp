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
number min_x = 1e18, min_y = 1e18, max_x = 0, max_y = 0;
double penalty_weight;
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

bool is_edge_inside2(vector<P> hole, const P& p1, const P& p2) {
    if (!is_point_inside(hole, p1)) return false;
    if (!is_point_inside(hole, p2)) return false;
    for (int i = 0; i < hole.size(); ++i) {
        int j = (i + 1) % hole.size();
        if (ccw(p1, p2, hole[i]) * ccw(p1, p2, hole[j]) < 0 && ccw(hole[i], hole[j], p1) * ccw(hole[i], hole[j], p2) < 0)
            return false;
    }
    vector<P> splitting_points = {p1, p2};
    for (P point: hole) {
        if (is_on_segment(p1, p2, point)) {
            splitting_points.push_back(point);
        }
    }
    sort(splitting_points.begin(), splitting_points.end());
    P double_mid = make_pair(p1.X +p2.X, p1.Y + p2.Y);
    vector<P> double_hole = vector<P>(hole.size());
    transform(hole.begin(), hole.end(), double_hole.begin(), [](P p){ return make_pair(p.X * 2, p.Y * 2);});
    for (int i = 0; i < splitting_points.size() - 1; i++) {
        vector<P> sub_edge; sub_edge.push_back(splitting_points[i]); sub_edge.push_back(splitting_points[i+1]);
        P double_mid = make_pair(sub_edge[0].X + sub_edge[1].X, sub_edge[0].Y + sub_edge[1].Y);
        if (!is_point_inside(double_hole, double_mid)) {
            return false;
        }
    }
    return true;
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

number d(const P& p, const P& q) {
    return (p.X - q.X) * (p.X - q.X) + (p.Y - q.Y) * (p.Y - q.Y);
}

number calc_dislike(const vector<P>& hole, const vector<P>& positions, const vector<int>& hole_hint) {
    number ds = 0;

    for (int i = 0; i < hole.size(); i++) {
        int v_id = hole_hint[i];
        ds += d(hole[i], positions[v_id]);
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

void output(const vector<int>& assignment) {
    for (int i = 0; i < assignment.size(); i++) {
        printf("%d ", assignment[i]);
    }
    printf("\n");
}

double calc_cost(vector<vector<double>>& dist, vector<vector<double>>& hole_dist, vector<int>& assignment) {
    double cost = 0;
    for (int i = 0; i < assignment.size(); i++) {
        for (int j = 0; j < assignment.size(); j++) {
            double edge_d = dist[assignment[i]][assignment[j]];
            double hole_d = hole_dist[i][j];
            if (hole_d > edge_d) {
                cost += (edge_d - hole_d) * (edge_d - hole_d);
            } else {
                cost += -(edge_d - hole_d);
            }
            //cerr << "dist[" << assignment[i] << "][" << assignment[j] << "]=" << dist[assignment[i]][assignment[j]] << endl;
            //cerr << "hole[" << i << "][" << j << "]=" << hole_dist[i][j] << endl;
        }
    }
    return cost;
}

int main(int argc, char* argv[]) {
    json j;
    std::cin >> j;
    problem prob = j.get<problem>();

    vector<P> hole = prob.hole;
    vector<pair<int, int>> edge = prob.figure.edges;
    vector<P> figure = prob.figure.vertices;
    number epsilon = prob.epsilon;

    int n = figure.size();
    int m = prob.hole.size();

    vector<vector<double>> dist(n, vector<double>(n, 1e18));
    for (int i = 0; i < n; i++) {
        dist[i][i] = 0;
    }
    for (E& e: prob.figure.edges) {
        dist[e.first][e.second] = sqrt(d(prob.figure.vertices[e.first], prob.figure.vertices[e.second]));
        dist[e.second][e.first] = sqrt(d(prob.figure.vertices[e.first], prob.figure.vertices[e.second]));
    }
    for (int k = 0; k < n; k++) {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]);
            }
        }
    }

    vector<vector<double>> hole_dist(m, vector<double>(m, 1e18));
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < m; j++) {
            if (is_edge_inside2(prob.hole, prob.hole[i], prob.hole[j])) {
                hole_dist[i][j] = sqrt(d(prob.hole[i], prob.hole[j]));
            }
        }
    }
    for (int k = 0; k < m; k++) {
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < m; j++) {
                hole_dist[i][j] = min(hole_dist[i][j], hole_dist[i][k] + hole_dist[k][j]);
            }
        }
    }



return 0;

    number best_cost = 1e18;
    vector<int> best_assignment;
    
    for (int T = 0; T < 10; T++ ) {
    number local_best_cost = 1e18;

    vector<int> assignment(m);

    for (int i = 0; i < assignment.size(); i++) {
        assignment[i] = random::get(n);
    }
    
    double cost = calc_cost(dist, hole_dist, assignment);
    
    fprintf(stderr, "initial_cost: %.6lf\n", cost);
    fflush(stderr);
    
    simulated_annealing sa;
    vector<int> new_assignment = assignment;
    while (!sa.end()) {
        int select = random::get(60);
        new_assignment = assignment;

        if (select < 50) {
            // ランダムな点を動かす
            int hole_id = random::get(m);
            int v_id = random::get(n);
            if (new_assignment[hole_id] == v_id) continue;
            new_assignment[hole_id] = v_id;
        } else if (select < 55) {
            // 回す
            int rot = random::get(1, m - 1);
            for (int i = 0; i < m; i++) {
                new_assignment[i] = assignment[(i + rot) % m];
            }
        } else if (select < 60) {
            // swap
            int rot = random::get(1, m - 1);
            for (int i = 0; i < m; i++) {
                new_assignment[i] = assignment[(i + 1) % m];
                new_assignment[(i + 1) % m] = assignment[i];
            }
        }

        double new_cost = calc_cost(dist, hole_dist, new_assignment);
        
        if (sa.accept(cost, new_cost)) {
            assignment = new_assignment;
            cost = new_cost;
            if (cost < best_cost) {
                best_cost = cost;
                best_assignment = assignment;
                if (best_cost == 0) break;
            }
            if (cost < local_best_cost) {
                local_best_cost = cost;
            }
        }
    }
    
    sa.print();
    
    if (local_best_cost < 1e18) {
        fprintf(stderr, "dislike: %lld\n", local_best_cost);
        output(best_assignment);
    } else {
        // fprintf(stderr, "final_cost: %.6lf\n", cost);
    }
    }
    
    return 0;
}
