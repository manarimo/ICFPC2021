use anyhow::Result;
use brute_force::{PathBufExt, PathRefExt};
use manarimo_lib::geometry::{
    count_contained_edges, count_contained_points, count_valid_edges, dislike, Point,
};
use manarimo_lib::types::{Pose, Problem};
use rand::prelude::*;
use std::path::PathBuf;
use std::time::Instant;

fn main() -> Result<()> {
    dotenv::dotenv()?;
    env_logger::init();

    let args: Vec<String> = std::env::args().collect();
    let input = &args[1];
    let solution = &args[2];
    let output = &args[3];

    let problem: Problem = PathBuf::from(input).parse_json()?;
    let solution: Pose = PathBuf::from(solution).parse_json()?;

    let (state, dislike) = solve(&problem, &solution);
    log::info!("dislike={}", dislike);

    let pose = Pose {
        vertices: state.into_iter().map(|p| [p.x, p.y]).collect(),
        bonuses: None,
    };
    output.write_json(&pose)?;

    Ok(())
}

fn solve(problem: &Problem, solution: &Pose) -> (Vec<Point>, i64) {
    let mut rng = StdRng::seed_from_u64(717);

    let hole: Vec<Point> = problem.hole.iter().map(Point::from).collect();
    let orig_pose: Vec<Point> = problem.figure.vertices.iter().map(Point::from).collect();
    let edges = problem.figure.edges.clone();
    let eps = problem.epsilon;

    let hole = &hole;
    let edges = &edges;
    let orig_pose = &orig_pose;

    let mut current_state: Vec<Point> = solution.vertices.iter().map(Point::from).collect();
    assert_eq!(
        count_valid_edges(&current_state, edges, orig_pose, eps),
        edges.len(),
        "invalid edges"
    );
    assert_eq!(
        count_contained_points(hole, &current_state),
        current_state.len(),
        "out points"
    );
    assert_eq!(
        count_contained_edges(hole, &current_state, edges),
        edges.len(),
        "out edges"
    );

    let mut best_dislike = dislike(hole, &current_state);
    let mut best_state = current_state.clone();
    let mut current_dislike = best_dislike;
    log::info!("Start from {}", best_dislike);

    const UPDATE_TEMP_INTERVAL: usize = 0xfff;
    const REPORT_INTERVAL: u128 = 3000;
    const START_TEMP: f64 = 15000.0;
    const END_TEMP: f64 = 1.0;
    const END_TIME: u128 = 60_000;

    let mut temp = START_TEMP;
    let start = Instant::now();
    let mut prev = Instant::now();
    for step in 0.. {
        if step & UPDATE_TEMP_INTERVAL == UPDATE_TEMP_INTERVAL {
            let elapsed_millis = start.elapsed().as_millis();
            if elapsed_millis >= END_TIME {
                break;
            }

            let progress_ratio = elapsed_millis as f64 / END_TIME as f64;
            temp = START_TEMP + (END_TEMP - START_TEMP) * progress_ratio;
        }

        if prev.elapsed().as_millis() > REPORT_INTERVAL {
            log::info!("current={} best={}", current_dislike, best_dislike);
            prev = Instant::now();
        }

        let n = current_state.len();
        let select = rng.gen_range(0..n);

        let dx = rng.gen_range(-1..=1);
        let dy = rng.gen_range(-1..=1);
        if dx == dy {
            continue;
        }
        let prev = current_state[select];
        current_state[select].x += dx;
        current_state[select].y += dy;

        if !is_valid(&current_state, hole, edges, orig_pose, eps) {
            current_state[select] = prev;
            continue;
        }

        let new_dislike = dislike(hole, &current_state);
        let point = current_dislike - new_dislike;
        let prob = (point as f64 / temp).exp();
        if prob > rng.gen_range(0.0..1.0) {
            current_dislike = new_dislike;
        } else {
            current_state[select] = prev;
        }

        if current_dislike < best_dislike {
            best_state = current_state.clone();
            best_dislike = current_dislike;
        }
    }
    (best_state, best_dislike)
}

fn is_valid(
    solution: &[Point],
    hole: &[Point],
    edges: &[[usize; 2]],
    orig_pose: &[Point],
    eps: i64,
) -> bool {
    count_valid_edges(solution, edges, orig_pose, eps) == edges.len()
        && count_contained_points(hole, solution) == solution.len()
        && count_contained_edges(hole, solution, edges) == edges.len()
}
