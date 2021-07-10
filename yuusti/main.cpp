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

int main() {
    json js;
    cin >> js;
    auto prob = js.get<problem>();

    vector<P> hole = prob.hole;
    vector<E> edge = prob.figure.edges;
    vector<P> figure = prob.figure.vertices;
    number epsilon = prob.epsilon;

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

    for (int i = 0; i < figure.size(); ++i) {
        for (int j = 0; j < hole_d.size(); ++j) {
            vector<int> used(figure.size());
            vector<int> pos;
            vector<vector<int>> result;
            int threshold = 3;
            int len = dfs(graph, hole_d, edge_d, i, j + 1, used, pos, epsilon, j, result, threshold);

            if (len > threshold) {
                cout << "\n\n" << threshold + 1 << "-" << len << endl;
                cout << "start hole:" << (j + 1) % hole_d.size() << endl;
                for (int k = 0; k < result.size(); ++k) {
                    for (int l = 0; l < result[k].size(); ++l) {
                        cout << result[k][l] << (l == result[k].size() ? "\n" : " ");
                    }
                    cout << endl;
                }
            }
        }
    }

}