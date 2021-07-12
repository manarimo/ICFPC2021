use manarimo_lib::geometry::{dislike, Edge, Point};
use manarimo_lib::types::{Pose, Problem};
use std::cmp::Reverse;

pub struct Xorshift(u64);

impl Xorshift {
    pub fn get(&mut self) -> u64 {
        let mut x = self.0;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.0 = x;
        x
    }
}

trait Shuffle {
    fn shuffle(&mut self, rng: &mut Xorshift);
}
impl<T> Shuffle for Vec<T> {
    fn shuffle(&mut self, rng: &mut Xorshift) {
        let mut length = self.len();
        while length > 0 {
            let next = (rng.get() as usize) % length;
            self.swap(next, length - 1);
            length -= 1;
        }
    }
}

pub fn solve<F, G>(problem: Problem, fixed: &[usize], solution: Pose, report: F, progress_report: G)
where
    F: FnMut(Pose, i64),
    G: Fn(usize) + Copy,
{
    solve_with_step_limit(
        problem,
        fixed,
        solution,
        report,
        progress_report,
        1i32 << 30,
    )
}
pub fn solve_with_step_limit<F, G>(
    problem: Problem,
    fixed: &[usize],
    solution: Pose,
    report: F,
    progress_report: G,
    step_limit: i32,
) where
    F: FnMut(Pose, i64),
    G: Fn(usize) + Copy,
{
    let mut rng = Xorshift(101);
    let hole = problem
        .hole
        .into_iter()
        .map(Point::from)
        .collect::<Vec<_>>();
    let min_x = hole.iter().map(|p| p.x).min().unwrap();
    let max_x = hole.iter().map(|p| p.x).max().unwrap();
    let min_y = hole.iter().map(|p| p.y).min().unwrap();
    let max_y = hole.iter().map(|p| p.y).max().unwrap();

    let mut valid_positions = vec![];
    for x in min_x..=max_x {
        for y in min_y..=max_y {
            let p = Point { x, y };
            if p.is_contained(&hole) {
                valid_positions.push(p);
            }
        }
    }

    valid_positions.shuffle(&mut rng);
    let figure = problem.figure;
    let n = figure.vertices.len();
    let mut graph = vec![vec![]; n];
    for &[from, to] in figure.edges.iter() {
        graph[from].push(to);
        graph[to].push(from);
    }

    let mut vertex_ids = (0..n).collect::<Vec<_>>();
    vertex_ids.sort_by_key(|&i| Reverse(graph[i].len()));

    let mut vid_to_order = vec![0; n];
    for (i, &vid) in vertex_ids.iter().enumerate() {
        vid_to_order[vid] = i;
    }

    let original_pose = figure
        .vertices
        .into_iter()
        .map(Point::from)
        .collect::<Vec<_>>();

    let mut is_fixed = vec![false; n];
    for &vid in fixed {
        is_fixed[vid] = true;
    }
    let dfs = DfsSolver {
        valid_positions,
        original_pose,
        hole,
        vertex_ids,
        graph,
        vid_to_order,
        eps: problem.epsilon,
        template_solution: solution,
        is_fixed,
        progress_report,
        max_step: step_limit as usize,
    };
    let mut report = report;
    dfs.dfs(&mut vec![], 1 << 60, &mut 0, &mut report);
}

struct DfsSolver<G> {
    valid_positions: Vec<Point>,
    original_pose: Vec<Point>,
    hole: Vec<Point>,
    vertex_ids: Vec<usize>,
    graph: Vec<Vec<usize>>,
    vid_to_order: Vec<usize>,
    eps: i64,
    template_solution: Pose,
    is_fixed: Vec<bool>,
    progress_report: G,
    max_step: usize,
}

impl<G: Fn(usize) + Copy> DfsSolver<G> {
    fn dfs<F: FnMut(Pose, i64)>(
        &self,
        positions: &mut Vec<Point>,
        best: i64,
        step: &mut usize,
        report: &mut F,
    ) -> i64 {
        *step += 1;
        (self.progress_report)(*step);
        if *step > self.max_step {
            return best;
        }

        if positions.len() >= self.original_pose.len() {
            let result = dislike(&self.hole, positions);
            return if result < best {
                let n = positions.len();
                let vertices = (0..n)
                    .map(|i| positions[self.vid_to_order[i]])
                    .map(|p| [p.x, p.y])
                    .collect::<Vec<_>>();
                let pose = Pose {
                    vertices,
                    bonuses: None,
                };
                (report)(pose, result);
                result
            } else {
                best
            };
        }

        let i = positions.len();
        let vid = self.vertex_ids[i];
        let mut best = best;

        let template_p = [Point::from(self.template_solution.vertices[vid])];
        let iter = if self.is_fixed[vid] {
            template_p.iter()
        } else {
            self.valid_positions.iter()
        };

        for &p in iter {
            let mut valid = true;
            for &next_vid in self.graph[vid].iter() {
                if self.vid_to_order[next_vid] >= i {
                    continue;
                }

                let edge = Edge::new(p, positions[self.vid_to_order[next_vid]]);
                let source = Edge::new(self.original_pose[vid], self.original_pose[next_vid]);
                if !edge.is_valid(&source, self.eps) {
                    valid = false;
                    break;
                }
                if !edge.is_contained(&self.hole) {
                    valid = false;
                    break;
                }
            }
            if !valid {
                continue;
            }

            positions.push(p);
            best = self.dfs(positions, best, step, report);
            positions.pop();
        }
        best
    }
}
