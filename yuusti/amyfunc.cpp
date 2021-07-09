#include <iostream>
#include <vector>
#include <algorithm>
#include <tuple>

using namespace std;

#define X first
#define Y second

using number = long long;
using P = pair<number, number>;

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

bool is_point_inside(vector<P> hole, P point) {
    vector<number> xs;
    for (auto p: hole) {
        xs.push_back(p.X);
    }
    number min_x, max_x;
    tie(min_x, max_x) = minmax(xs.begin(), xs.end());
    P outer = make_pair(max_x + (max_x - min_x) * 2 + 1, point.Y + 1);

    int crossings = 0;
    for (int i = 0; i < hole.size(); ++i) {
        int j = (i + 1) % hole.size();
        P d1 = sub(hole[i], point);
        P d2 = sub(hole[j], point);
        number area = cross(d1, d2);
        if (area == 0 && d1.X * d2.X && d1.Y * d2.Y <= 0) return true;
        if (ccw(point, outer, hole[i]) * ccw(point, outer, hole[j]) < 0 && ccw(hole[i], hole[j], point) * ccw(hole[i], hole[j], outer) < 0) {
            ++crossings;
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
    P double_mid = make_pair(edge[0].X + edge[1].X, edge[0].Y + edge[1].Y);
    vector<P> double_hole = vector<P>(hole.size());
    transform(hole.begin(), hole.end(), double_hole.begin(), [](P p){ return make_pair(p.X * 2, p.Y * 2);});

    return is_point_inside(double_hole, double_mid);
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
}
