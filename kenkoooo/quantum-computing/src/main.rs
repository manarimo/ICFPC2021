use manarimo_lib::geometry::Point;
use manarimo_lib::types::Problem;
use std::cmp::min;
use std::env::args;
use std::error::Error;
use std::fs::read_to_string;
use std::time::Instant;

fn is_edge_inside(
    hole: &[Point],
    p1: Point,
    p2: Point,
    inside: &[[bool; MAX_C]],
    inside_double: &[[bool; MAX_C * 2]],
) -> bool {
    if !inside[p1.x][p1.y] {
        return false;
    }
    if !inside[p2.x][p2.y] {
        return false;
    }
    let mut prev_ccw = ccw(p1, p2, hole[0]);
    for i in 0..hole.len() {
        let j = (i + 1) % hole.len();
        let next_ccw = ccw(p1, p2, hole[j]);
        if prev_ccw * next_ccw < 0 && ccw(hole[i], hole[j], p1) * ccw(hole[i], hole[j], p2) < 0 {
            return false;
        }
        prev_ccw = next_ccw;
    }

    let mut splitting_points = vec![];
    splitting_points.push(p1);
    splitting_points.push(p2);
    for &p in hole {
        if is_on_segment(p1, p2, p) {
            splitting_points.push(p);
        }
    }

    splitting_points.sort_by_key(|p| (p.x, p.y));
    for i in 0..(splitting_points.len() - 1) {
        if !inside_double[splitting_points[i].x + splitting_points[i + 1].x]
            [splitting_points[i].y + splitting_points[i + 1].y]
        {
            return false;
        }
    }
    true
}
fn calc_penalty_vertex(figure: &[Point], dist: &[[f64; MAX_M]]) -> f64 {
    figure.iter().map(|p| dist[p.x][p.y]).sum::<f64>()
}

fn len_diff(len: i64, min_len: i64, max_len: i64) -> i64 {
    if len < min_len {
        return min_len - len;
    }
    if len > max_len {
        return len - max_len;
    }
    return 0;
}

fn calc_penalty_length(
    edges: &[[usize; 2]],
    figure: &[Point],
    min_len: &[i64],
    max_len: &[i64],
) -> i64 {
    let mut penalty = 0;
    for (i, &[from, to]) in edges.iter().enumerate() {
        penalty += len_diff(d(figure[from], figure[to]), min_len[i], max_len[i]);
    }
    penalty
}

fn calc_penalty_edge(
    hole: &[Point],
    edges: &[[usize; 2]],
    figure: &[Point],
    inside: &[[bool; MAX_C]],
    inside_double: &[[bool; MAX_C * 2]],
    penalty_weight: f64,
) -> f64 {
    let mut penalty = 0.0;
    for &[from, to] in edges {
        if !is_edge_inside(hole, figure[from], figure[to], inside, inside_double) {
            penalty += penalty_weight;
        }
    }
    penalty
}

fn calc_dislike(hole: &[Point], positions: &[Point]) -> i64 {
    let mut sum = 0;
    for &h in hole {
        let mut min_p = 1e18 as i64;
        for &p in positions {
            min_p = min_p.min(d(h, p));
            if min_p == 0 {
                break;
            }
        }
        sum == min_p;
    }
    sum
}

fn calc_dislike2(hole: &[Point], figure: &[Point], new_figure: &[Point], update: &[usize]) -> i64 {
    let mut sum = 0;

    for &h in hole {
        let mut min_p = 1e18 as i64;
        for i in 0..figure.len() {
            if (update.len() >= 1 && update[0] == i) || (update.len() == 2 && update[1] == i) {
                min_p = min_p.min(d(h, new_figure[i]));
            } else {
                min_p = min_p.min(d(h, figure[i]));
            }
        }

        sum += min_p;
    }
    sum
}
fn penalty_vertex_diff(orig: P, dest: P, dist: &[[f64; MAX_C]]) {
    dist[dest.X][dest.Y] - dist[orig.X][orig.Y]
}
fn penalty_edge_diff(
    hole: &[Point],
    graph: &Vec<Vec<(usize, usize)>>,
    figure: &[Point],
    v: usize,
    orig: P,
    dest: P,
    inside: &[[bool; MAX_C]],
    inside_double: &[[bool; MAX_C * 2]],
) -> f64 {
    let mut diff = 0.;
    for &(next, _) in graph[v].iter() {
        if !is_edge_inside(hole, orig, figure[next], inside, inside_double) {
            diff -= penalty_weight;
        }
        if !is_edge_inside(hole, dest, figure[next], inside, inside_double) {
            diff += penalty_weight;
        }
    }
    diff
}
fn penalty_edge_diff2(
    hole: &[Point],
    graph: &Vec<Vec<(usize, usize)>>,
    figure: &[Point],
    v1: usize,
    orig1: P,
    dest1: P,
    v2: usize,
    orig2: P,
    dest2: P,
    inside: &[[bool; MAX_C]],
    inside_double: &[[bool; MAX_C * 2]],
    penalty_weight: f64,
) -> f64 {
    let mut diff = 0.;
    for &(next, _) in graph[v1].iter() {
        if next == v1 {
            if !is_edge_inside(hole, orig1, orig2, inside, inside_double) {
                diff -= penalty_weight;
            }
            if !is_edge_inside(hole, dest1, dest2, inside, inside_double) {
                diff += penalty_weight;
            }
            continue;
        }
        if !is_edge_inside(hole, orig1, figure[next], inside, inside_double) {
            diff -= penalty_weight;
        }
        if !is_edge_inside(hole, dest1, figure[next], inside, inside_double) {
            diff += penalty_weight;
        }
    }
    for &(next, _) in graph[v2].iter() {
        if next == v1 {
            continue;
        }
        if !is_edge_inside(hole, orig2, figure[next], inside, inside_double) {
            diff -= penalty_weight;
        }
        if !is_edge_inside(hole, dest2, figure[next], inside, inside_double) {
            diff += penalty_weight;
        }
    }
    diff
}
fn penalty_length_diff(
    graph: &Vec<Vec<(usize, usize)>>,
    figure: &[Point],
    v: usize,
    orig: Point,
    dest: Point,
    min_len: &[i64],
    max_len: &[i64],
) -> i64 {
    let mut diff = 0;
    for &(next, i) in graph[v].iter() {
        diff -= len_diff(d(orig, figure[next]), min_len[i], max_len[i]);
        diff += len_diff(d(dest, figure[next]), min_len[i], max_len[i]);
    }
    diff
}
fn outside_p(p: Point, min_x: i64, max_x: i64, min_y: i64, max_y: i64) -> bool {
    p.x < min_x || p.x > max_x || p.y < min_y || p.y > max_y
}

fn outside(figure: &[Point], min_x: i64, max_x: i64, min_y: i64, max_y: i64) -> bool {
    figure
        .iter()
        .any(|&p| outside_p(p, min_x, max_x, min_y, max_y))
}

fn d(p: Point, q: Point) -> i64 {
    (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y)
}
fn ccw(p: Point, q: Point, r: Point) -> i64 {
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)
}
fn is_on_segment(p1: Point, p2: Point, p: Point) -> bool {
    let area = (p1.x - p.x) * (p2.y - p.y) - (p1.y - p.y) * (p2.x - p.x);
    area == 0 && (p1.x - p.x) * (p2.x - p.x) <= 0 && (p1.y - p.y) * (p2.y - p.y) <= 0
}
fn is_point_inside(hole: &[Point], point: Point, outer: Point) -> bool {
    let mut crossing = 0;
    let n = hole.len();
    for i in 0..n {
        let j = (i + 1) % n;
        if is_on_segment(hole[i], hole[j], point) {
            return true;
        }
        if ccw(point, outer, hole[i]) * ccw(point, outer, hole[j]) < 0
            && ccw(hole[i], hole[j], point) * ccw(hole[i], hole[j], outer) < 0
        {
            crossing += 1;
        }
    }
    crossings % 2 == 1
}
fn dist_point(px1: f64, py1: f64, px2: f64, py2: f64) -> f64 {
    (px2 - px1) * (px2 - px1) + (py2 - py1) * (py2 - py1)
}
fn get_ratio(l1: Point, l2: Point, p: Point) -> f64 {
    let vx = l2.x - l1.x;
    let vy = l2.y - l1.y;
    let wx = p.x - l1.x;
    let wy = p.y - l1.y;
    (vx * wx + vy * wy) as f64 / (vx * vx + vy * vy) as f64
}
fn dist_line(l1: Point, l2: Point, p: Point) -> f64 {
    let t = get_ratio(l1, l2, p).min(1.0).max(0.0);
    dist_point(
        l1.x + (l2.x - l1.x) * t,
        l1.y + (l2.y - l1.y) * t,
        p.x as f64,
        p.y as f64,
    )
}
fn dist_hole_point(hole: &[Point], p: Point) -> f64 {
    let mut dist = 1e18;
    let n = hole.len();
    for i in 0..n {
        let d = dist_line(hole[i], hole[(i + 1) % n], p);
        dist = dist.min(d);
    }
    dist
}

const MAX_C: usize = 1000;
const MAX_M: usize = 1000;

struct Solver {
    inside: Vec<Vec<bool>>,
    inside_double: Vec<Vec<bool>>,
    dist: Vec<Vec<f64>>,
    min_len: Vec<i64>,
    max_len: Vec<i64>,
}

const INV_MAX: f64 = 1.0 / (1 << 32) as f64;
struct XorShift {
    x: u32,
    y: u32,
    z: u32,
    w: u32,
}

impl XorShift {
    fn get(&mut self) -> u32 {
        let t = self.x ^ (self.x << 11);
        self.x = self.y;
        self.y = self.z;
        self.z = self.w;
        self.w = (self.w ^ (self.w >> 19)) ^ (t ^ (t >> 8));
        self.w
    }
    fn probability(&mut self) -> f64 {
        self.get() as f64 * INV_MAX
    }
}

const LOG_SIZE: usize = (1 << 16) - 1;
const UPDATE_INTERVAL: i64 = (1 << 8) - 1;
const START_TEMP: f64 = 100.;
const TIME_LIMIT: f64 = 10.;
const TEMP_RATIO: f64 = (END_TEMP - START_TEMP) / TIME_LIMIT;

struct SimulatedAnnealing {
    log_probability: [f64; LOG_SIZE + 1],
    iteration: i64,
    accepted: i64,
    rejected: i64,
    time: Instant,
    temp: f64,
}

impl SimulatedAnnealing {
    fn time_second(&self) -> f64 {
        self.time.elapsed().as_millis() as f64 / 1000.
    }
    fn end(&mut self) -> bool {
        self.iteration += 1;
        if self.iteration & UPDATE_INTERVAL == 0 {
            let time = self.time_second();
            self.temp = START_TEMP + TEMP_RATIO * time;
            time >= TIME_LIMIT
        } else {
            false
        }
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let args = args().collect::<Vec<_>>();
    let problem: Problem = serde_json::from_str(&read_to_string(&args[1])?)?;
    let hole = problem
        .hole
        .into_iter()
        .map(Point::from)
        .collect::<Vec<_>>();
    let edges = problem.figure.edges;
    let figure = problem
        .figure
        .vertices
        .into_iter()
        .map(Point::from)
        .collect::<Vec<_>>();
    let eps = problem.epsilon;

    let n = figure.len();
    let mut graph = vec![vec![]; n];
    for (i, &[from, to]) in edges.iter().enumerate() {
        graph[from].push((to, i));
        graph[to].push((from, i));
    }

    let mut d1 = vec![];
    let mut d2 = vec![];
    for i in 0..n {
        if graph[i].len() == 1 {
            d1.push(i);
        } else if graph[i].len() == 2 {
            d2.push(i)
        }
    }

    let min_x = hole.iter().map(|p| p.x).min().unwrap();
    let max_x = hole.iter().map(|p| p.x).max().unwrap();
    let min_y = hole.iter().map(|p| p.y).min().unwrap();
    let max_y = hole.iter().map(|p| p.y).max().unwrap();
    let outer = Point {
        x: max_x * 2 + 1,
        y: max_y * 2 + 1,
    };

    let mut inside = [[false; MAX_C]; MAX_C];
    let mut dist = [[0.0; MAX_C]; MAX_C];
    for x in min_x..=max_x {
        for y in min_y..=max_y {
            let point = Point { x, y };
            inside[x][y] = is_point_inside(&hole, point, outer);
            if !inside[x][y] {
                dist[x][y] = dist_hole_point(&hole, point);
            }
        }
    }

    let double_hole = hole
        .iter()
        .map(|p| Point {
            x: p.x * 2,
            y: p.y * 2,
        })
        .collect::<Vec<_>>();
    let mut inside_double = [[false; MAX_C * 2]; MAX_C * 2];
    for x in (min_x * 2)..=(max_x * 2) {
        for y in (min_y * 2)..=(max_y * 2) {
            inside_double[x][y] = is_point_inside(&double_hole, Point { x, y });
        }
    }

    let mut min_len = [0; MAX_M];
    let mut max_len = [0; MAX_M];
    for (i, &[from, to]) in edges.iter().enumerate() {
        let orig = d(figure[from], figure[to]);
        let diff = orig * eps / 1000000;
        min_len[i] = orig - diff;
        max_len[i] = orig + diff;
    }

    //hint

    let mut dislike = calc_dislike(&hole, &figure);
    let mut weight = (dislike as f64).sqrt();
    let mut penalty_weight = weight;

    let mut penalty_vertex = calc_penalty_vertex(&hole, &dist);
    let mut penalty_edge = calc_penalty_edge(
        &hole,
        &edges,
        &figure,
        &inside,
        &inside_double,
        penalty_weight,
    );
    let mut penalty_length = calc_penalty_length(&edges, &figure, &min_len, &max_len);

    let mut sa = SimulatedAnnealing {};
    let mut best_dislike = 1 << 60;
    let mut rng = XorShift {
        x: 123456789,
        y: 362436039,
        z: 521288629,
        w: 88675123,
    };
    let mut new_figure = figure.clone();
    while !sa.end() {
        let select = rng.get() % 100;
        let penalty_weight = weight * (sa.time_second() + 1.0) * (sa.time_second() + 1.0);
        let mut new_penalty_vertex = penalty_vertex;
        let mut new_penalty_edge = penalty_edge;
        let mut new_penalty_length = penalty_length;
        let mut new_dislike = 0;
        let mut update = vec![];

        if select < 40 {
            let dx = (rng.get() % 3) as i64 - 1;
            let dy = (rng.get() % 3) as i64 - 1;
            if dx == 0 && dy == 0 {
                continue;
            }

            let v = (rng.get() as usize) % n;
            new_figure[v].x = figure[v].x + dx;
            new_figure[v].y = figure[v].y + dy;
            if outside_p(new_figure[v], min_x, max_x, min_y, max_y) {
                continue;
            }
            update.push(v);
        } else if select < 80 {
            let dx = (rng.get() % 3) as i64 - 1;
            let dy = (rng.get() % 3) as i64 - 1;
            if dx == 0 && dy == 0 {
                continue;
            }

            let r = (rng.get() as usize) % edges.len();
            let [v, w] = edges[r];
            new_figure[v].x = figure[v].x + dx;
            new_figure[v].y = figure[v].y + dy;
            new_figure[w].x = figure[w].x + dx;
            new_figure[w].y = figure[w].y + dy;
            if outside_p(new_figure[v], min_x, max_x, min_y, max_y)
                || outside_p(new_figure[w], min_x, max_x, min_y, max_y)
            {
                continue;
            }
            update.push(v);
            update.push(w);
        } else if select < 85 {
            let dx = (rng.get() % 3) as i64 - 1;
            let dy = (rng.get() % 3) as i64 - 1;
            if dx == 0 && dy == 0 {
                continue;
            }

            for i in 0..n {
                new_figure[i].x = figure[i].x + dx;
                new_figure[i].y = figure[i].y + dy;
            }
            if outside_p(new_figure[v], min_x, max_x, min_y, max_y) {
                continue;
            }
            update.push(v);
        } else if select < 100 {
            let vf = (rng.get() as usize) % n;
            let vh = (rng.get() as usize) % hole.len();

            new_figure[vf] = hole[vh];
            if outside_p(new_figure[vf], min_x, max_x, min_y, max_y) {
                continue;
            }
            update.push(vf);
        }

        if update.is_empty() {
            new_penalty_vertex = calc_penalty_vertex(&new_figure, &dist);
            new_penalty_edge = calc_penalty_edge(
                &new_figure,
                &edges,
                &new_figure,
                &inside,
                &inside_double,
                penalty_weight,
            );
            new_penalty_length = calc_penalty_length(&edges, &new_figure, &min_len, &max_len);
            new_dislike = calc_dislike2(&hole, &new_figure, &figure, &update);
        } else if update.len() == 1 {
            let v = update[0];
            new_penalty_vertex += penalty_vertex_diff(figure[v], new_figure[v], &dist);
            new_penalty_edge += penalty_edge_diff(
                &hole,
                &graph,
                &figure,
                v,
                figure[v],
                new_figure[v],
                &inside,
                &inside_double,
            );
            new_penalty_length += penalty_length_diff(
                &graph,
                &figure,
                v,
                figure[v],
                new_figure[v],
                &min_len,
                &max_len,
            );
            new_dislike = calc_dislike2(&hole, &new_figure, &figure, &update);
        } else {
            let v = update[0];
            let w = update[1];
            new_penalty_vertex += penalty_vertex_diff(figure[v], new_figure[v], &dist);
            new_penalty_vertex += penalty_vertex_diff(figure[w], new_figure[w], &dist);
            new_penalty_edge += penalty_edge_diff2(
                &hole,
                &graph,
                &figure,
                v,
                figure[v],
                new_figure[v],
                w,
                figure[w],
                new_figure[w],
                &inside,
                &inside_double,
                penalty_weight,
            );
        }
    }

    Ok(())
}
