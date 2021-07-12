#include <iostream>
#include <vector>
#include <algorithm>
#include <tuple>
#include <fstream>
#include "json.hpp"

using namespace std;
using json = nlohmann::json;

#define X first
#define Y second

using number = long long;
using P = pair<number, number>;
using pose = vector<P>;

struct Problem {
    vector<P> hole;
    vector<pair<int, int>> figure_edges;
    vector<P> figure_vertices;
    number epsilon;
    P min_p, max_p;
};

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

bool is_bad_vertex(Problem& problem, pose& current, int v_id) {
    if (!is_point_inside(problem.hole, current[v_id])) {
        return true;
    }
    for (pair<int, int> edge_ids: problem.figure_edges) {
        if (edge_ids.first != v_id && edge_ids.second != v_id) {
            continue;
        }
        if (!is_point_inside(problem.hole, current[edge_ids.first]) || !is_point_inside(problem.hole, current[edge_ids.second])) {
            continue;
        }
        vector<P> edge; edge.push_back(current[edge_ids.first]); edge.push_back(current[edge_ids.second]); 
        if (!is_edge_inside(problem.hole, edge)) {
            return true;
        }
    }
    return false;
}

bool validate(Problem& problem, vector<P>& positions) {
    double sc = 0;
    for (pair<int, int>& edge_ids: problem.figure_edges) {
        P p1 = positions[edge_ids.first];
        P p2 = positions[edge_ids.second];
        vector<P> edge; edge.push_back(p1); edge.push_back(p2);
        if (!is_edge_inside(problem.hole, edge)) {
            return false;
        }
        number optimal_d = d(problem.figure_vertices[edge_ids.first], problem.figure_vertices[edge_ids.second]);
        number current_d = d(p1, p2);
        number eps = abs(current_d - optimal_d) * 1e6 / optimal_d;
        if (eps > problem.epsilon) {
            return false;
        }
    }
    return true;
}

number epsilon(Problem& problem, pair<int, int> edge_ids, P p1, P p2) {
    number optimal_d = d(problem.figure_vertices[edge_ids.first], problem.figure_vertices[edge_ids.second]);
    number current_d = d(p1, p2);
    return abs(current_d - optimal_d) * 1e6 / optimal_d;
}

double score(Problem& problem, vector<P> positions, double timer, vector<pair<int, int>>& related_edge_ids) {
    double sc = 0;
    for (pair<int, int>& edge_ids: related_edge_ids) {
        P p1 = positions[edge_ids.first];
        P p2 = positions[edge_ids.second];
        vector<P> edge; edge.push_back(p1); edge.push_back(p2);
        if (!is_edge_inside(problem.hole, edge)) {
            //return 1e18;
            sc += 1e18;
        }
        number eps = epsilon(problem, edge_ids, p1, p2);
        sc += eps < problem.epsilon ? 0 : eps * timer;
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

pose try_move(Problem& problem, pose current, double timer) {
    int v_id = random::get(current.size());

    vector<pair<int, int>> related_edge_ids;
    for (pair<int, int> edge_ids: problem.figure_edges) {
        if (edge_ids.first == v_id || edge_ids.second == v_id) {
            related_edge_ids.push_back(edge_ids);
        }
    }
    double min_score = 1e25;
    pose min_pose = current;
    int min_x = 0, min_y = 0;
    int w = problem.max_p.X - problem.min_p.X;
    int h = problem.max_p.Y - problem.min_p.Y;
    int left = max(problem.min_p.X, current[v_id].X - 1);
    int right = min(problem.max_p.X, current[v_id].X + 1);
    int bottom = max(problem.min_p.Y, current[v_id].Y - 1);
    int top = min(problem.max_p.Y, current[v_id].Y + 1);
    // if (!is_point_inside(problem.hole, current[v_id])) {
        left = problem.min_p.X;
        right = problem.max_p.X;
        bottom = problem.min_p.Y;
        top = problem.max_p.Y;
    // }

    for (int x = left; x <= right; x++) {
        for (int y = bottom; y <= top; y++) {
            pose new_pose = current;
            new_pose[v_id].X = x;
            new_pose[v_id].Y = y;
            if (!is_point_inside(problem.hole, new_pose[v_id])) {
                continue;
            }
            double sc = score(problem, new_pose, timer, related_edge_ids);
            if (min_score > sc) {
                min_score = sc;
                min_pose = new_pose;
                min_x = x;
                min_y = y;
            }
        }
    }
    if (min_x != current[v_id].X || min_y != current[v_id].Y) {
        cerr << v_id << ": " << min_x << "," << min_y << endl;
    }
    /*
    int min_dx = 0, min_dy = 0;
    for (int dx = -2; dx <= 2; dx++) {
        for (int dy = -2; dy <= 2; dy++) {
            pose new_pose = current;
            new_pose[v_id].X += dx;
            new_pose[v_id].Y += dy;
            double sc = score(problem, new_pose, timer);
            if (min_score > sc) {
                min_score = sc;
                min_pose = new_pose;
                min_dx = dx;
                min_dy = dy;
            }
        }
    }
    if (min_dx != 0 && min_dy != 0) {
        cerr << v_id << ": " << min_dx << "," << min_dy << endl;
    }
    */
    return min_pose;
}

pose finalize(Problem& problem, pose current) {
    int n = 1e2;
    while (!validate(problem, current) && n--) {
        current = try_move(problem, current, 1e6);
    }
    cerr << "finalize: " << n << endl << endl;
    return current;
}

int main(int argc, char *argv[]) {
    int n_hole; cin >> n_hole;
    vector<P> hole(n_hole);
    for (int i = 0; i < n_hole; i++) {
        cin >> hole[i].X >> hole[i].Y;
    }
    int n_figure_edges; cin >> n_figure_edges;
    vector<pair<int, int>> figure_edges(n_figure_edges);
    for (int i = 0; i < n_figure_edges; i++) {
        cin >> figure_edges[i].first >> figure_edges[i].second;
    }
    int n_figure_vertices; cin >> n_figure_vertices;
    vector<P> figure_vertices(n_figure_vertices);
    for (int i = 0; i < n_figure_vertices; i++) {
        cin >> figure_vertices[i].X >> figure_vertices[i].Y;
    }
    number eps; cin >> eps;
    Problem p;
    p.hole = hole;
    p.figure_edges = figure_edges;
    p.figure_vertices = figure_vertices;
    p.epsilon = eps;
    p.min_p = make_pair(1e18, 1e18);
    p.max_p = make_pair(-1e18, -1e18);
    for (P& h: hole) {
        p.min_p.X = min(p.min_p.X, h.X);
        p.min_p.Y = min(p.min_p.Y, h.Y);
        p.max_p.X = max(p.max_p.X, h.X);
        p.max_p.Y = max(p.max_p.Y, h.Y);
    }
/*
    ifstream hintstream = ifstream(string(argv[1]));
    int n_hint; hintstream >> n_hint;
    pose hint(n_hint);
    for (int i = 0; i < n_hint; i++) {
        hintstream >> hint[i].X >> hint[i].Y;
        hint[i].X = 44;
        hint[i].Y = 51;
    }
*/

    ifstream hint_file = ifstream(string(argv[1]));
    string hint_str((std::istreambuf_iterator<char>(hint_file)),
                 std::istreambuf_iterator<char>());
    auto json = json::parse(hint_str);
    auto hints = json["vertices"].get<vector<vector<number>>>();
    pose hint(p.figure_vertices.size());
    for (int i = 0; i < hints.size(); i++) {
        hint[i].X = hints[i][0];
        hint[i].Y = hints[i][1];
    }

    pose current = hint; //p.figure_vertices;

    for (int i = 0; i < 1000; i++) {
        if (i%100 == 0) cerr << "==== " << i << " ====" << endl;
        current = try_move(p, current, 1.0*i/1000);
    }
    cerr << "finalize start" << endl;
    current = finalize(p, current);

    cout << "{" << endl;
    cout << "  \"vertices\": [" << endl;
    for (int i = 0; i < current.size(); i++) {
        cout << "    [" << current[i].X << ", " << current[i].Y << "]" << (i == current.size() - 1 ? "" : ",") << endl;
    }
    cout << "  ]" << endl;
    cout << "}" << endl;
}