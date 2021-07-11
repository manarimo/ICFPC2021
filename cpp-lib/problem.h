#ifndef ICFPC2021_PROBLEM_H
#define ICFPC2021_PROBLEM_H

#include "json.hpp"
#include "geo.h"
#include <vector>
#include <string>
#include <fstream>

namespace manarimo {
    using namespace std;
    using namespace geo;
    using json = nlohmann::json;
    using E = pair<int, int>;
    using number = long long;
    constexpr int MAX_C = 2000;

    struct figure_t {
        vector<E> edges;
        vector<P> vertices;
    };

    struct problem_t {
        // 問題定義に書いてある情報
        vector<P> hole;
        figure_t figure;
        number epsilon;

        // 前計算。直接読んでもいいけど、外から書き換えると壊れるので注意
        P outer;
        bool inside[MAX_C][MAX_C];
        bool inside_double[MAX_C * 2][MAX_C * 2];
        double dist[MAX_C][MAX_C];
        number min_x = 1e18, min_y = 1e18, max_x = 0, max_y = 0;

        void init();
        bool is_point_inside(const P& point);
        bool is_edge_inside(const P& p1, const P& p2);
        number calc_dislike(const vector<P>& positions);
        
        void output(const vector<P>& vertices);
    private:
        // 前計算の初期化用にinit()内で使うための関数群
        bool is_point_inside(const vector<P>& hole, const P& point);
        double dist_hole_point(const vector<P>& hole, const P& point);
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

    void from_json(const json& j, problem_t& p) {
        j.at("hole").get_to(p.hole);
    }

    void from_json(const json& j, hint& h) {
        j.at("vertices").get_to(h.vertices);
    }

    void load_problem(const string &filename, problem_t &out) {
        ifstream f(filename);
        return load_problem(filename, out);
    }

    // problem_t が大きすぎて json::get<> で読むとスタックオーバーフローするので、出力先は引数で取る
    void load_problem(istream &f, problem_t &out) {
        json j;
        f >> j;
        j.at("hole").get_to(out.hole);
        j.at("figure").get_to(out.figure);
        j.at("epsilon").get_to(out.epsilon);

        out.init();
    }
};

void manarimo::problem_t::init() {
    for (const P& p : hole) {
        min_x = min(min_x, p.X);
        min_y = min(min_y, p.Y);
        max_x = max(max_x, p.X);
        max_y = max(max_y, p.Y);
    }

    outer = make_pair(max_x * 2 + 1, max_y * 2 + 1);
    for (int x = min_x; x <= max_x; x++) {
        for (int y = min_y; y <= max_y; y++) {
            inside[x - min_x][y - min_y] = is_point_inside(make_pair(x, y));
            if (!inside[x - min_x][y - min_y]) dist[x - min_x][y - min_y] = dist_hole_point(hole, make_pair(x, y));
        }
    }

    vector<P> double_hole(hole.size());
    for (int i = 0; i < hole.size(); i++) double_hole[i] = make_pair(hole[i].X * 2, hole[i].Y * 2);
    for (int x = min_x * 2; x <= max_x * 2; x++) {
        for (int y = min_y * 2; y <= max_y * 2; y++) {
            inside_double[x - min_x * 2][y - min_y * 2] = is_point_inside(double_hole, make_pair(x, y));
        }
    }
}

bool manarimo::problem_t::is_point_inside(const P &point) {
    return is_point_inside(hole, point);
}

inline bool manarimo::problem_t::is_point_inside(const vector<P> &hole, const P &point) {
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

bool manarimo::problem_t::is_edge_inside(const P &p1, const P &p2) {
    if (!inside[p1.X - min_x][p1.Y - min_y]) return false;
    if (!inside[p2.X - min_x][p2.Y - min_y]) return false;

    number prev_ccw = ccw(p1, p2, hole[0]);
    for (int i = 0; i < hole.size(); ++i) {
        int j = i + 1;
        if (__builtin_expect(j >= hole.size(), 0)) {
            j = 0;
        }
        const number next_ccw = ccw(p1, p2, hole[j]);
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
        if (!inside_double[splitting_points[i].X + splitting_points[i + 1].X - min_x * 2][splitting_points[i].Y + splitting_points[i + 1].Y - min_y * 2]) return false;
    }

    return true;
}

manarimo::number manarimo::problem_t::calc_dislike(const vector<P>& positions) {
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

void manarimo::problem_t::output(const vector<P>& vertices) {
    printf("{\"vertices\": [");
    for (int i = 0; i < vertices.size(); i++) {
        if (i > 0) printf(", ");
        printf("[%lld, %lld]", vertices[i].X, vertices[i].Y);
    }
    printf("]}");
}

double manarimo::problem_t::dist_hole_point(const vector<P>& hole, const P& p) {
    double dist = 1e18;
    for (int i = 0; i < hole.size(); i++) {
        dist = min(dist, dist_line(hole[i], hole[(i + 1) % hole.size()], p));
    }
    return dist;
}

#endif //ICFPC2021_PROBLEM_H
