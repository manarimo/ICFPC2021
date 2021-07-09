#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <vector>
#include <algorithm>

using namespace std;

#define X first
#define Y second

using number = long long;
using P = pair<number, number>;

const int MAX_C = 1000;
const int MAX_M = 1000;
const double COS = cos(0.1);
const double SIN = sin(0.1);
bool inside[MAX_C][MAX_C];
bool inside_double[MAX_C * 2][MAX_C * 2];
double dist[MAX_C][MAX_C];
number min_len[MAX_M];
number max_len[MAX_M];
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
    timer timer;
};

simulated_annealing::simulated_annealing() {
    timer.start();
    for (int i = 0; i <= LOG_SIZE; i++) log_probability[i] = log(random::probability());
}

inline double simulated_annealing::get_time() {
    return time;
}

inline bool simulated_annealing::end() {
    iteration++;
    if ((iteration & UPDATE_INTERVAL) == 0) {
        time = timer.get_time();
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

P sub(const P& p, const P& q) {
    return make_pair(p.X - q.X, p.Y - q.Y);
}

number dot(const P& p, const P& q) {
    return p.X * q.X + p.Y * q.Y;
}

number cross(const P& p, const P& q) {
    return p.X * q.Y - p.Y * q.X;
}

number ccw (const P& p, const P& q, const P& r) {
    return cross(sub(q, p), sub(r, p));
}

bool is_on_segment(const P& p1, const P& p2, const P& p) {
    P d1 = sub(p1, p);
    P d2 = sub(p2, p);
    number area = cross(d1, d2);
    if (area == 0 && d1.X * d2.X <= 0 && d1.Y * d2.Y <= 0) return true;
    return false;
}

bool is_point_inside(const vector<P>& hole, const P& point) {
    int crossings = 0;
    for (int i = 0; i < hole.size(); ++i) {
        int j = (i + 1) % hole.size();
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
        int j = (i + 1) % hole.size();
        if (ccw(p1, p2, hole[i]) * ccw(p1, p2, hole[j]) < 0 && ccw(hole[i], hole[j], p1) * ccw(hole[i], hole[j], p2) < 0) return false;
    }
    
    vector<P> splitting_points = {p1, p2};
    for (const P& p : hole) {
        if (is_on_segment(p1, p2, p)) splitting_points.push_back(p);
    }
    sort(splitting_points.begin(), splitting_points.end());
    
    for (int i = 0; i + 1 < splitting_points.size(); i++) {
        P p = make_pair(splitting_points[i].X + splitting_points[i + 1].X, splitting_points[i].Y + splitting_points[i + 1].Y);
        if (!inside_double[p.X][p.Y]) return false;
    }
    
    return true;
}

number d(const P& p, const P& q) {
    return (p.X - q.X) * (p.X - q.X) + (p.Y - q.Y) * (p.Y - q.Y);
}

number calc_dislike(const vector<P>& hole, const vector<P>& positions) {
    number ds = 0;
    for (const P& h: hole) {
        number min_p = 1e18;
        for (const P& p: positions) {
            min_p = min(min_p, d(h, p));
        }
        ds += min_p;
    }
    return ds;
}

double dist_point(double px1, double py1, double px2, double py2) {
    return (px2 - px1) * (px2 - px1) + (py2 - py1) * (py2 - py1);
}

double get_ratio(const P& l1, const P& l2, const P& p) {
    P v = sub(l2, l1);
    P w = sub(p, l1);
    return (double)(v.X * w.X + v.Y * w.Y) / (v.X * v.X + v.Y * v.Y);    
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

vector<pair<int, int>> read_graph() {
    int m = read_number();
    
    vector<pair<int, int>> graph(m);
    for (int i = 0; i < m; i++) {
        int x = read_number();
        int y = read_number();
        graph[i] = make_pair(x, y);
    }
    
    return graph;
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

double calc_penalty_edge(const vector<P>& hole, const vector<pair<int, int>>& graph, const vector<P>& figure) {
    double penalty = 0;
    for (const pair<int, int>& p : graph) {
        if (!is_edge_inside(hole, figure[p.first], figure[p.second])) penalty += 10;
    }
    return penalty;
}

number len_diff(number len, number min_len, number max_len) {
    if (len < min_len) return min_len - len;
    if (len > max_len) return len - max_len;
    return 0;
}

double calc_penalty_length(const vector<pair<int, int>>& graph, const vector<P>& figure) {
    double penalty = 0;
    for (int i = 0; i < graph.size(); i++) {
        penalty += len_diff(d(figure[graph[i].first], figure[graph[i].second]), min_len[i], max_len[i]);
    }
    return penalty;
}

bool outside(const vector<P>& figure) {
    for (const P& p : figure) {
        if (p.X < 0 || p.X >= MAX_C || p.Y < 0 || p.Y >= MAX_C) return true;
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

void output_svg(const char* file, const vector<P>& hole, const vector<pair<int, int>>& graph, const vector<P>& figure) {
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
    fprintf(fp, "<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n");
    fprintf(fp, "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" viewBox=\"%lld %lld %lld %lld\" style=\"background-color: #00000066\">\n", min_x, min_y, max_x - min_x, max_y - min_y);
    
    fprintf(fp, "  <path d=\"M ");
    for (int i = 0; i < hole.size(); i++) {
        if (i > 0) fprintf(fp, " L ");
        fprintf(fp, "%lld,%lld", hole[i].X, hole[i].Y);
    }
    fprintf(fp, "\" style=\"fill:#ffffff; fill-rule:evenodd; stroke: none\" />\n");
    
    fprintf(fp, "  <g style=\"fill:none;stroke:#ff0000;stroke-linecap:round\">");
    for (const pair<int, int>& p : graph) {
        fprintf(fp, "<path d=\"M %lld,%lld L %lld,%lld\" />", figure[p.first].X, figure[p.first].Y, figure[p.second].X, figure[p.second].Y);
    }
    fprintf(fp, "</g>\n");
    
    fprintf(fp, "</svg>\n");
    
    fclose(fp);
}

int main(int argc, char* argv[]) {
    vector<P> hole = read_hole();
    vector<pair<int, int>> graph = read_graph();
    vector<P> figure = read_figure();
    number epsilon = read_number();
    int n = figure.size();
    
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
    
    for (int i = 0; i < graph.size(); i++) {
        number orig = d(figure[graph[i].first], figure[graph[i].second]);
        number diff = orig * epsilon / 1000000;
        min_len[i] = orig - diff;
        max_len[i] = orig + diff;
    }
    
    double penalty_vertex = calc_penalty_vertex(figure);
    double penalty_edge = calc_penalty_edge(hole, graph, figure);
    double penalty_length = 0;
    number dislike = calc_dislike(hole, figure);
    fprintf(stderr, "initial_penalty: %.6lf %.6lf %.6lf\n", penalty_vertex, penalty_edge, penalty_length);
    fflush(stderr);
    
    simulated_annealing sa;
    number best_dislike = 1e18;
    vector<P> new_figure(n);
    vector<P> best_figure(n);
    while (!sa.end()) {
        int select = random::get(90);
        double time = sa.get_time() * 1000;
        double new_penalty_vertex = 0;
        double new_penalty_edge = 0;
        double new_penalty_length = 0;
        number new_dislike = 0;
        for (int i = 0; i < n; i++) new_figure[i] = figure[i];
        
        if (select < 40) {
            int dx = random::get(3);
            int dy = random::get(3);
            dx--;
            dy--;
            if (dx == 0 && dy == 0) continue;
            
            int v = random::get(n);
            new_figure[v].X += dx;
            new_figure[v].Y += dy;
        } else if (select < 80) {
            int dx = random::get(3);
            int dy = random::get(3);
            dx--;
            dy--;
            if (dx == 0 && dy == 0) continue;
            
            int r = random::get(graph.size());
            int v = graph[r].first;
            int w = graph[r].second;
            new_figure[v].X += dx;
            new_figure[v].Y += dy;
            new_figure[w].X += dx;
            new_figure[w].Y += dy;
        } else if (select < 85) {
            int dx = random::get(3);
            int dy = random::get(3);
            dx--;
            dy--;
            if (dx == 0 && dy == 0) continue;
            
            for (int i = 0; i < n; i++) {
                new_figure[i].X += dx;
                new_figure[i].Y += dy;
            }
        } else if (select < 90) {
            double sum_x = 0, sum_y = 0;
            for (const P& p : figure) {
                sum_x += p.X;
                sum_y += p.Y;
            }
            sum_x /= n;
            sum_y /= n;
            
            int r = random::get(2);
            for (int i = 0; i < n; i++) {
                double x = figure[i].X - sum_x;
                double y = figure[i].Y - sum_y;
                if (r == 0) {
                    new_figure[i].X = round(sum_x + x * COS - y * SIN);
                    new_figure[i].Y = round(sum_y + y * COS + x * SIN);
                } else {
                    new_figure[i].X = round(sum_x + x * COS + y * SIN);
                    new_figure[i].Y = round(sum_y + y * COS - x * SIN);
                }
            }
        }
        
        if (outside(new_figure)) continue;
        
        new_penalty_vertex = calc_penalty_vertex(new_figure);
        new_penalty_edge = calc_penalty_edge(hole, graph, new_figure);
        new_penalty_length = calc_penalty_length(graph, new_figure);
        new_dislike = calc_dislike(hole, new_figure);
        if (sa.accept((penalty_vertex + penalty_edge + penalty_length) * time + dislike, (new_penalty_vertex + new_penalty_edge + new_penalty_length) * time + new_dislike)) {
            penalty_vertex = new_penalty_vertex;
            penalty_edge = new_penalty_edge;
            penalty_length = new_penalty_length;
            dislike = new_dislike;
            figure.swap(new_figure);
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
        if (argc >= 2) output_svg(argv[1], hole, graph, best_figure);
    } else {
        fprintf(stderr, "final_penalty: %.6lf %.6lf %.6lf\n", penalty_vertex, penalty_edge, penalty_length);
        if (argc >= 2) output_svg(argv[1], hole, graph, figure);
    }
    
    return 0;
}