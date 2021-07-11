use crate::geometry::{
    count_contained_edges, count_contained_points, count_valid_edges, dislike, Point,
};
use crate::log;
use crate::types::{Pose, Problem};
use std::ops::Range;

pub fn solve(problem: Problem, pose: Pose) -> (Pose, i64) {
    let mut rng = Xorshift(717);

    let original_pose = problem
        .figure
        .vertices
        .into_iter()
        .map(|[x, y]| Point { x, y })
        .collect::<Vec<_>>();
    let mut pose = pose
        .vertices
        .into_iter()
        .map(|[x, y]| Point { x, y })
        .collect::<Vec<_>>();
    let hole = problem
        .hole
        .into_iter()
        .map(|[x, y]| Point { x, y })
        .collect::<Vec<_>>();
    let eps = problem.epsilon;
    let edges = problem.figure.edges;

    const START_TEMP: f64 = 3000.0;
    const END_TEMP: f64 = 1.0;
    const END_STEP: i64 = 1000;

    let mut best_state = pose.clone();
    let mut best_score = score_function(&hole, &pose, eps, &original_pose, &edges, 0);
    let mut current_score = best_score;

    let mut temp = START_TEMP;
    for step in 0..END_STEP {
        if step % 100 == 0 {
            let progress_ratio = step as f64 / END_STEP as f64;
            temp = START_TEMP + (END_TEMP - START_TEMP) * progress_ratio;

            let msg = format!(
                "step={} best_score={} score={}",
                step, best_score, current_score
            );
            log(&msg);
        }

        let v = rng.gen_range(0..pose.len());
        let prev = pose[v];
        let d = if rng.get() % 2 == 0 { 1 } else { -1 };
        if rng.get() % 2 == 0 {
            pose[v].x += d;
        } else {
            pose[v].y += d;
        }

        let new_score = score_function(&hole, &pose, eps, &original_pose, &edges, step);
        let delta_score = current_score - new_score;
        let probability = (delta_score as f64 / temp).exp();
        if probability > rng.gen_p() {
            current_score = new_score;
            if current_score < best_score {
                best_score = current_score;
                best_state = pose.clone();
            }
        } else {
            pose[v] = prev;
        }
    }
    let vertices = best_state.into_iter().map(|p| [p.x, p.y]).collect();
    (
        Pose {
            vertices,
            bonuses: Some(vec![]),
        },
        best_score,
    )
}

fn score_function(
    hole: &[Point],
    pose: &[Point],
    epsilon: i64,
    original_pose: &[Point],
    edges: &[[usize; 2]],
    time: i64,
) -> i64 {
    let edges_in_hole = count_contained_edges(hole, pose, edges);
    let points_in_hole = count_contained_points(hole, pose);
    let valid_edges = count_valid_edges(pose, edges, original_pose, epsilon);
    let dislike = dislike(hole, pose);

    let out_edges = edges.len() - edges_in_hole;
    let out_points = pose.len() - points_in_hole;
    let invalid_edges = edges.len() - valid_edges;

    dislike + (out_edges as i64 + out_points as i64 + invalid_edges as i64) * time
}

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
    pub fn gen_range(&mut self, range: Range<usize>) -> usize {
        let x = self.get() as usize;
        x % range.len() + range.start
    }
    pub fn gen_p(&mut self) -> f64 {
        const N: usize = 100000;
        let x = self.gen_range(0..N);
        x as f64 / N as f64
    }
}
