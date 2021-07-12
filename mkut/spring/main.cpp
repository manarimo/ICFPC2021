#include <iostream>
#include <vector>
#include <algorithm>
#include <tuple>
#include <fstream>
#include <cmath>
#include "json.hpp"

using namespace std;
using json = nlohmann::json;

#define X first
#define Y second

using number = long long;
using P = pair<number, number>;
using E = pair<int, int>;

#define DELTA 0.1

struct figure_t {
   vector<E> edges;
   vector<P> vertices;
};

struct Problem {
    vector<P> hole;
    figure_t figure;
    number epsilon;
    P min_p, max_p;
    vector<int> deg;
};

struct Solution {
   vector<P> vertices;
};

struct State {
    vector<P> pos;
    vector<P> vel;

    void print_err() {
        for (int i = 0; i < pos.size(); i++) {
            cerr << "#" << i << ": " << "v=(" << pos[i].X << "," << pos[i].Y << ")  a=(" << vel[i].X << "," << vel[i].Y << ")" << endl;
        }
    }
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

void from_json(const json& j, Problem& p) {
    j.at("hole").get_to(p.hole);
    j.at("figure").get_to(p.figure);
    j.at("epsilon").get_to(p.epsilon);
}

void from_json(const json& j, Solution& s) {
    j.at("vertices").get_to(s.vertices);
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

P sub(P p, P q) {
    return make_pair(p.X - q.X, p.Y - q.Y);
}

number dot(P p, P q) {
    return p.X * q.X + p.Y * q.Y;
}

number cross(P p, P q) {
    return p.X * q.Y - p.Y * q.X;
}

number ccw (P p, P q, P r) {
    return cross(sub(q, p), sub(r, p));
}

P intersection(P& p1, P& p2, P& p3, P& p4) {
    double det = (p1.X - p2.X) * (p4.Y - p3.Y) - (p4.X - p3.X) * (p1.Y - p2.Y);
    double t = ((p4.Y - p3.Y) * (p4.X - p2.X) + (p3.X - p4.X) * (p4.Y - p2.Y)) / det;
    number x = round(t * p1.X + (1.0 - t) * p2.X);
    number y = round(t * p1.Y + (1.0 - t) * p2.Y);
    return make_pair(x, y);
}

bool is_on_segment(vector<P> segment, P point) {
    P d1 = sub(segment[0], point);
    P d2 = sub(segment[1], point);
    number area = cross(d1, d2);
    if (area == 0 && d1.X * d2.X <= 0 && d1.Y * d2.Y <= 0) {
        return true;
    }
    return false;
}

bool is_point_inside(vector<P> hole, P point) {
    vector<number> xs;
    for (auto p: hole) {
        xs.push_back(p.X);
    }
    auto minmax_x = minmax_element(xs.begin(), xs.end());
    P outer = make_pair(*minmax_x.second + (*minmax_x.second - *minmax_x.first) * 2 + 1, point.Y + 1);

    int crossings = 0;
    for (int i = 0; i < hole.size(); ++i) {
        int j = (i + 1) % hole.size();
        vector<P> seg; seg.push_back(hole[i]); seg.push_back(hole[j]);
        if (is_on_segment(seg, point)) {
            return true;
        }
        if (ccw(point, outer, hole[i]) * ccw(point, outer, hole[j]) < 0 && ccw(hole[i], hole[j], point) * ccw(hole[i], hole[j], outer) < 0) {
            crossings += 1;
        }
    }
    return crossings % 2 == 1;
}

bool is_edge_inside(vector<P> hole, vector<P> edge) {
    for (P point: edge) {
        if (!is_point_inside(hole, point)) return false;
    }
    for (int i = 0; i < hole.size(); ++i) {
        int j = (i + 1) % hole.size();
        if (ccw(edge[0], edge[1], hole[i]) * ccw(edge[0], edge[1], hole[j]) < 0 && ccw(hole[i], hole[j], edge[0]) * ccw(hole[i], hole[j], edge[1]) < 0)
            return false;
    }
    vector<P> splitting_points = edge;
    for (P point: hole) {
        if (is_on_segment(edge, point)) {
            splitting_points.push_back(point);
        }
    }
    sort(splitting_points.begin(), splitting_points.end());
    P double_mid = make_pair(edge[0].X + edge[1].X, edge[0].Y + edge[1].Y);
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

number d(P p, P q) {
    return (p.X - q.X) * (p.X - q.X) + (p.Y - q.Y) * (p.Y - q.Y);
}

bool is_valid_edge(P orig_p, P orig_q, P dest_p, P dest_q, number epsilon) {
    number orig_dist = d(orig_p, orig_q);
    number dest_dist = d(dest_p, dest_q);
    return abs(dest_dist - orig_dist) * 1000000 <= epsilon * orig_dist;
}

number dislike(vector<P> hole, vector<P> positions) {
    number ds = 0;
    for (P h: hole) {
        number min_p = 1e18;
        for (P p: positions) {
            min_p = min(min_p, d(h, p));
        }
        ds += min_p;
    }
    return ds;
}

bool validate(Problem& problem, vector<P>& positions) {
    double sc = 0;
    for (pair<int, int>& edge_ids: problem.figure.edges) {
        P p1 = positions[edge_ids.first];
        P p2 = positions[edge_ids.second];
        vector<P> edge; edge.push_back(p1); edge.push_back(p2);
        if (!is_edge_inside(problem.hole, edge)) {
            return false;
        }
        number optimal_d = d(problem.figure.vertices[edge_ids.first], problem.figure.vertices[edge_ids.second]);
        number current_d = d(p1, p2);
        number eps = abs(current_d - optimal_d) * 1e6 / optimal_d;
        if (eps > problem.epsilon) {
            return false;
        }
    }
    return true;
}

number epsilon(Problem& problem, pair<int, int> edge_ids, P p1, P p2) {
    number optimal_d = d(problem.figure.vertices[edge_ids.first], problem.figure.vertices[edge_ids.second]);
    number current_d = d(p1, p2);
    return abs(current_d - optimal_d) * 1e6 / optimal_d;
}

double diff_spring(Problem& problem, pair<int, int> edge_ids, P p1, P p2) {
    number optimal_d = d(problem.figure.vertices[edge_ids.first], problem.figure.vertices[edge_ids.second]);
    number diff = optimal_d * problem.epsilon / 1000000;
    number optimal_d_min = optimal_d - diff;
    number optimal_d_max = optimal_d + diff;
    number current_d = d(p1, p2);
    if (current_d < optimal_d_min) return sqrt(optimal_d_min) - sqrt(current_d);
    if (current_d > optimal_d_max) return sqrt(current_d) - sqrt(optimal_d_max);
    return 0;
}

double dist_point(double px1, double py1, double px2, double py2) {
    return (px2 - px1) * (px2 - px1) + (py2 - py1) * (py2 - py1);
}

double get_ratio(const P& l1, const P& l2, const P& p) {
    P v = sub(l2, l1);
    P w = sub(p, l1);
    return (double)(v.X * w.X + v.Y * w.Y) / (v.X * v.X + v.Y * v.Y);    
}

double edge_outside_ratio(vector<P> hole, vector<P> edge) {
    double outside = 0;
    vector<P> splitting_points = edge;
    for (int i = 0; i < hole.size(); ++i) {
        int j = (i + 1) % hole.size();
        if (ccw(edge[0], edge[1], hole[i]) * ccw(edge[0], edge[1], hole[j]) < 0 && ccw(hole[i], hole[j], edge[0]) * ccw(hole[i], hole[j], edge[1]) < 0) {
            P is = intersection(hole[i], hole[j], edge[0], edge[1]);
            splitting_points.push_back(is);
        }
    }
    for (P point: hole) {
        if (is_on_segment(edge, point)) {
            splitting_points.push_back(point);
        }
    }
    sort(splitting_points.begin(), splitting_points.end());
    P double_mid = make_pair(edge[0].X + edge[1].X, edge[0].Y + edge[1].Y);
    vector<P> double_hole = vector<P>(hole.size());
    transform(hole.begin(), hole.end(), double_hole.begin(), [](P p){ return make_pair(p.X * 2, p.Y * 2);});
    for (int i = 0; i < splitting_points.size() - 1; i++) {
        vector<P> sub_edge; sub_edge.push_back(splitting_points[i]); sub_edge.push_back(splitting_points[i+1]);
        P double_mid = make_pair(sub_edge[0].X + sub_edge[1].X, sub_edge[0].Y + sub_edge[1].Y);
        if (!is_point_inside(double_hole, double_mid)) {
            outside += sqrt(dist_point(sub_edge[0].X, sub_edge[0].Y, sub_edge[1].X, sub_edge[1].Y));
        }
    }
    return outside / dist_point(edge[0].X, edge[0].Y, edge[1].X, edge[1].Y);
}


pair<double, P> dist_line(const P& l1, const P& l2, const P& p) {
    double t = get_ratio(l1, l2, p);
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    P q(l1.X + (l2.X - l1.X) * t, l1.Y + (l2.Y - l1.Y) * t);
    return make_pair(dist_point(q.X, q.Y, p.X, p.Y), q);
}

double dist_hole_point(const vector<P>& hole, const P& p) {
    double dist = 1e18;
    for (int i = 0; i < hole.size(); i++) {
        dist = min(dist, dist_line(hole[i], hole[(i + 1) % hole.size()], p).first);
    }
    return dist;
}

P nearest_hole_point(const vector<P>& hole, const P& p) {
    double dist = 1e18;
    P ret;
    for (int i = 0; i < hole.size(); i++) {
        auto r = dist_line(hole[i], hole[(i + 1) % hole.size()], p);
        if (r.first < dist) {
            dist = r.first;
            ret = r.second;
        }
    }
    return ret;
}

double score(Problem& problem, vector<P> positions, vector<pair<int, int>>& related_edge_ids) {
    double sc = 0;
    for (pair<int, int>& edge_ids: related_edge_ids) {
        P p1 = positions[edge_ids.first];
        P p2 = positions[edge_ids.second];
        vector<P> edge; edge.push_back(p1); edge.push_back(p2);
        if (!is_edge_inside(problem.hole, edge)) {
            sc += 1e18 * edge_outside_ratio(problem.hole, edge);
        }
        number eps = epsilon(problem, edge_ids, p1, p2);
        sc += eps < problem.epsilon ? 0 : eps;
    }
    for (P h: problem.hole) {
        number min_p = 1e18;
        for (P p: positions) {
            min_p = min(min_p, d(h, p));
        }
        sc += min_p;
    }
    return sc;
}

void collision_tick(Problem& problem, State& current, State& next) {
    double K = 2;
    for (int i = 0; i < current.pos.size(); i++) {
        P& p = current.pos[i];
        if (!is_point_inside(problem.hole, p)) {
            P nearest = nearest_hole_point(problem.hole, p);
            P u = sub(nearest, p);
            double x = sqrt(dot(u, u));
            double k = K;
            double a = k * x;
            next.vel[i].X += u.X == 0 ? 0 : round(u.X / sqrt(dot(u, u)) * a * DELTA * 2.0);
            next.vel[i].Y += u.Y == 0 ? 0 : round(u.Y / sqrt(dot(u, u)) * a * DELTA * 2.0);
        }
    }
    for (pair<int, int> edge_ids: problem.figure.edges) {
        vector<P> edge; edge.push_back(current.pos[edge_ids.first]); edge.push_back(current.pos[edge_ids.second]); 
        if (!is_edge_inside(problem.hole, edge)) {
            double current_outside = edge_outside_ratio(problem.hole, edge);
            for (int t = 0; t < 2; t++) {
                int target = t == 0 ? edge_ids.first : edge_ids.second;
                int fixed = t == 0 ? edge_ids.second : edge_ids.first;
                number dxs[] = {1, 2, 1, 1, 0, -1, -1, -2, -1, -2, -1, -1, 0, 1, 1, 2};
                number dys[] = {0, 1, 1, 2, 1, 2, 1, 1, 0, -1, -1, -2, -1, -2, -1, -1};
                double min_outside = 1e18;
                int min_k = 0;
                for (int k = 0; k < 16; k++) {
                    number dx = dxs[k];
                    number dy = dys[k];
                    P new_p(current.pos[target].X + dx, current.pos[target].Y + dy);
                    vector<P> seg; seg.push_back(current.pos[fixed]); seg.push_back(new_p);
                    double outside = edge_outside_ratio(problem.hole, seg);
                    if (outside < min_outside) {
                        min_outside = outside;
                        min_k = k;
                    }
                }
                P u(dxs[min_k], dys[min_k]);
                double x = current_outside <= min_outside ? 0 : current_outside / (current_outside - min_outside) * sqrt(dot(u, u));
                double k = K;
                double a = k * x;
                next.vel[target].X += u.X == 0 ? 0 : round(u.X / sqrt(dot(u, u)) * a * DELTA);
                next.vel[target].Y += u.Y == 0 ? 0 : round(u.Y / sqrt(dot(u, u)) * a * DELTA);
            }
        }
    }
}

void pull_tick(Problem& problem, State& current, State& next) {
    double K = 0.3;
    for (P& h: problem.hole) {
        number min_diff = d(h, current.pos[0]);
        int nearest = 0;
        for (int i = 1; i < current.pos.size(); i++) {
            number diff = d(h, current.pos[i]);
            if (diff < min_diff) {
                min_diff = diff;
                nearest = i;
            }
        }
        P u = sub(h, current.pos[nearest]);
        double x = sqrt(min_diff);
        double k = K;
        double a = k * x;
        next.vel[nearest].X += u.X == 0 ? 0 : round(u.X / sqrt(dot(u, u)) * a * DELTA * 2.0);
        next.vel[nearest].Y += u.Y == 0 ? 0 : round(u.Y / sqrt(dot(u, u)) * a * DELTA * 2.0);
    }
}

void spring_tick(Problem& problem, State& current, State& next, double timer) {
    double K = 1;
    for (pair<int, int> edge_ids: problem.figure.edges) {
        int i = edge_ids.first;
        int j = edge_ids.second;
        P u = sub(current.pos[j], current.pos[i]);

        double x = diff_spring(problem, edge_ids, current.pos[i], current.pos[j]);
        double k = K * timer;
        double a = k * x;
        next.vel[i].X += u.X == 0 ? 0 : round(u.X / sqrt(dot(u, u)) * a * DELTA);
        next.vel[i].Y += u.Y == 0 ? 0 : round(u.Y / sqrt(dot(u, u)) * a * DELTA);
        next.vel[j].X -= u.X == 0 ? 0 : round(u.X / sqrt(dot(u, u)) * a * DELTA);
        next.vel[j].Y -= u.Y == 0 ? 0 : round(u.Y / sqrt(dot(u, u)) * a * DELTA);
    }
}

void velocity_tick(Problem& problem, State& current, State& next) {
    for (int i = 0; i < current.pos.size(); i++) {
        next.pos[i].X += current.vel[i].X * DELTA;
        next.pos[i].Y += current.vel[i].Y * DELTA;
    }
    for (int i = 0; i < current.pos.size(); i++) {
        next.vel[i].X -= next.vel[i].X / 5;
        next.vel[i].Y -= next.vel[i].Y / 5;
    }
}

State tick(Problem& problem, State current, double timer) {
    State next = current;
    velocity_tick(problem, current, next);
    spring_tick(problem, current, next, timer);
    pull_tick(problem, current, next);
    collision_tick(problem, current, next);
    return next;
}

vector<P> finalize(Problem& problem, vector<P>& current) {
    int v_id = random::get(current.size());

    vector<pair<int, int>> related_edge_ids;
    for (pair<int, int> edge_ids: problem.figure.edges) {
        if (edge_ids.first == v_id || edge_ids.second == v_id) {
            related_edge_ids.push_back(edge_ids);
        }
    }
    double min_score = score(problem, current, related_edge_ids);
    vector<P> min_pose = current;
    int min_dx = 0, min_dy = 0;
    for (int dx = -2; dx <= 2; dx++) {
        for (int dy = -2; dy <= 2; dy++) {
            if (dx == dy) continue;
            vector<P> new_pose = current;
            new_pose[v_id].X += dx;
            new_pose[v_id].Y += dy;
            double sc = score(problem, new_pose, related_edge_ids);
            if (min_score > sc) {
                min_score = sc;
                min_pose = new_pose;
                min_dx = dx;
                min_dy = dy;
            }
        }
    }
    /*
    if (min_dx != 0 && min_dy != 0) {
        cerr << v_id << ": " << min_dx << "," << min_dy << endl;
    }
    */
    return min_pose;
}

void print_json(vector<P>& current) {
    cout << "{" << endl;
    cout << "  \"vertices\": [" << endl;
    for (int i = 0; i < current.size(); i++) {
        cout << "    [" << current[i].X << ", " << current[i].Y << "]" << (i == current.size() - 1 ? "" : ",") << endl;
    }
    cout << "  ]" << endl;
    cout << "}" << endl;
}

int main(int argc, char *argv[]) {
    json j;
    std::cin >> j;
    Problem prob = j.get<Problem>();

    prob.min_p = make_pair(1e18, 1e18);
    prob.max_p = make_pair(-1e18, -1e18);
    prob.deg = vector<int>(prob.figure.vertices.size());
    for (P& h: prob.hole) {
        prob.min_p.X = min(prob.min_p.X, h.X);
        prob.max_p.X = max(prob.max_p.X, h.X);
        prob.min_p.Y = min(prob.min_p.Y, h.Y);
        prob.max_p.Y = max(prob.max_p.Y, h.Y);
    }
    for (auto edge_ids: prob.figure.edges) {
        prob.deg[edge_ids.first]++;
        prob.deg[edge_ids.second]++;
    }

    number min_dislike;
    vector<P> ans;

    for (int T = 0; T < 1; T++) {
        State current;
        current.pos = prob.figure.vertices;
        current.vel = vector<P>(prob.figure.vertices.size());

        if (argc >= 2) {
            ifstream hint_file = ifstream(string(argv[1]));
            string hint_str((std::istreambuf_iterator<char>(hint_file)),
                        std::istreambuf_iterator<char>());
            auto json = json::parse(hint_str);
            auto hints = json["vertices"].get<vector<vector<number>>>();
            vector<P> hint(prob.figure.vertices.size());
            for (int i = 0; i < hints.size(); i++) {
                hint[i].X = hints[i][0];
                hint[i].Y = hints[i][1];
            }
            current.pos = hint;
        }

        if (T > 0) {
            for (int j = 0; j < current.pos.size(); j++) {
                current.pos[j].X = random::get(prob.min_p.X, prob.max_p.X);
                current.pos[j].Y = random::get(prob.min_p.Y, prob.max_p.Y);
            }
        }

        for (int i = 0; i < 15; i++) {
            // if (i%100 == 0) cerr << "==== " << i << " ====" << endl;
            if (i%100 == 0) cerr << ".";
            current = tick(prob, current, 1.0*i/1000);
            current.print_err();
        }
        cerr << endl;
        cerr << "finalize start" << endl;
        for (int i = 0; i < 1e3; i++) {
            if (validate(prob, current.pos)) {
                cerr << "finalize complete!" << endl;
                break;
            }
            current.pos = finalize(prob, current.pos);
        }
        if (T == 0 || validate(prob, current.pos)) {
            min_dislike = validate(prob, current.pos) ? dislike(prob.hole, current.pos) : 1e18;
            ans = current.pos;
            cerr << "[" << T << "]best dislike: " << min_dislike << endl;
        }
    }
    print_json(ans);
}