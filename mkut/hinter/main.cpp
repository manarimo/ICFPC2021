#include <iostream>
#include <vector>
#include <algorithm>
#include <tuple>
#include <fstream>
#include <cmath>
#include <queue>
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
    return outside / sqrt(dist_point(edge[0].X, edge[0].Y, edge[1].X, edge[1].Y));
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

double score(Problem& problem, vector<P> current, vector<pair<int, int>>& related_edge_ids) {
    double sc = 0;
    for (E e: problem.figure.edges) {
        vector<P> seg; seg.push_back(current[e.first]); seg.push_back(current[e.second]);
        if (!is_edge_inside(problem.hole, seg)) {
            sc += d(current[e.first], current[e.second]) * edge_outside_ratio(problem.hole, seg);
        }
        number eps = epsilon(problem, e, current[e.first], current[e.second]);
        if (eps > problem.epsilon) {
            sc += eps - problem.epsilon;
        }
    }
    return sc;
}

vector<P> finalize(Problem& problem, vector<P>& current) {
    vector<pair<E,int>> bad_edges;
    for (E e: problem.figure.edges) {
        vector<P> seg; seg.push_back(current[e.first]); seg.push_back(current[e.second]);
        if (!is_edge_inside(problem.hole, seg)) {
            bad_edges.push_back(make_pair(e, 0));
        }
        number eps = epsilon(problem, e, current[e.first], current[e.second]);
        if (eps > problem.epsilon) {
            bad_edges.push_back(make_pair(e, 1));
        }
    }
    int i = random::get(bad_edges.size());
    pair<E, int>& be = bad_edges[i];
    int reason = be.second;
    int r = random::get(2);
    int target = r == 0 ? be.first.first : be.first.second;
    int fixed = r == 1 ? be.first.first : be.first.second;

    vector<pair<int, int>> related_edge_ids;
    for (pair<int, int> edge_ids: problem.figure.edges) {
        if (edge_ids.first == target || edge_ids.second == target) {
            related_edge_ids.push_back(edge_ids);
        }
    }

    number dx[] = {1, 0, -1, 0};
    number dy[] = {0, 1, 0, -1};
    vector<P> seg; seg.push_back(current[fixed]); seg.push_back(current[target]);
    double current_outside = edge_outside_ratio(problem.hole, seg);
    number current_eps = epsilon(problem, be.first, current[target], current[fixed]);
    double min_score = score(problem, current, related_edge_ids) * 1.1;
    P min_p = current[target];
    for (int k = 0; k < 4; k++) {
        vector<P> next = current;
        P next_p(current[target].X + dx[k], current[target].Y + dy[k]);
        next[target] = next_p;
        double next_score = score(problem, next, related_edge_ids);
        if (reason == 0) {
            vector<P> seg; seg.push_back(current[fixed]); seg.push_back(next_p);
            double outside = edge_outside_ratio(problem.hole, seg);
            if (outside < current_outside && next_score < min_score) {
                min_score = next_score;
                min_p = next_p;
            }
        } else if (reason == 1) {
            double eps = epsilon(problem, be.first, next_p, current[fixed]);
            if (eps < current_eps && next_score < min_score) {
                min_score = next_score;
                min_p = next_p;
            }
        }
    }
    number dxx = (min_p.X - current[target].X);
    number dyy = (min_p.Y - current[target].Y);
    if (dxx != 0 || dyy != 0) {
        cerr << target << "-" << fixed << "(" << reason << "): " << dxx << "," << dyy << endl;
        cerr << "before=" << score(problem, current, related_edge_ids) << " after=" << min_score << endl;
    }
    
    current[target] = min_p;
    return current;
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

struct Node {
    vector<int> assignment;
    double cost = 0;

    Node() {}
    Node(vector<int>& assignment, double cost) : assignment(assignment), cost(cost) {}

    bool operator<(const Node& that) const {
        if (cost != that.cost) return cost > that.cost;
        return assignment < that.assignment;
    }
};

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

    int m = prob.hole.size();
    int n = prob.figure.vertices.size();

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
            vector<P> seg; seg.push_back(prob.hole[i]); seg.push_back(prob.hole[j]);
            if (is_edge_inside(prob.hole, seg)) {
                hole_dist[i][j] = sqrt(d(prob.hole[i], prob.hole[j]));
                hole_dist[j][i] = sqrt(d(prob.hole[i], prob.hole[j]));
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

    priority_queue<Node> q;
    q.push(Node());
    vector<int> ans;
    double cost;
    while (!q.empty()) {
        Node node = q.top(); q.pop();
        if (node.assignment.size() == m) {
            ans = node.assignment;
            cost = node.cost;
            break;
        }
        for (int i = 0; i < n; i++) {
            Node nnode = node;
            int hole_id = node.assignment.size();
            
            for (int j = 0; j < node.assignment.size(); j++) {
                double hole_d = hole_dist[hole_id][j];
                double edge_d = dist[i][node.assignment[j]];
                nnode.cost += hole_d <= edge_d ? -(edge_d - hole_d) : (hole_d - edge_d) * (hole_d - edge_d);
            }
            nnode.assignment.push_back(i);
            q.push(nnode);
        }
    }

    for (int i = 0; i < m; i++) {
        cout << ans[i] << " ";
    }
    cout << endl;

    cerr << "cost: " << cost << endl;

/*
    vector<P> hint = prob.figure.vertices;
    for (int i = 0; i < m; i++) {
        hint[ans[i]] = prob.hole[i];
    }
    
    print_json(hint);
    */
}