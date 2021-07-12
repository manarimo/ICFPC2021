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

    let mut state: Vec<Point> = solution.vertices.iter().map(Point::from).collect();
    assert_eq!(
        count_valid_edges(&state, edges, orig_pose, eps),
        edges.len(),
        "invalid edges"
    );
    assert_eq!(
        count_contained_points(hole, &state),
        state.len(),
        "out points"
    );
    assert_eq!(
        count_contained_edges(hole, &state, edges),
        edges.len(),
        "out edges"
    );

    let mut best_dislike = dislike(hole, &state);
    log::info!("Start from {}", best_dislike);
    const REPORT_INTERVAL: usize = 0xfffff;
    for step in 0.. {
        if step & REPORT_INTERVAL == REPORT_INTERVAL {
            log::info!("step={} dislike={}", step, best_dislike);
        }
        let n = state.len();
        let select = rng.gen_range(0..n);

        let dx = rng.gen_range(-1..=1);
        let dy = rng.gen_range(-1..=1);
        if dx == dy {
            continue;
        }
        let prev = state[select];
        state[select].x += dx;
        state[select].y += dy;

        if !is_valid(&state, hole, edges, orig_pose, eps) {
            state[select] = prev;
            continue;
        }

        let dislike = dislike(hole, &state);
        if dislike < best_dislike {
            best_dislike = dislike;
        } else {
            state[select] = prev;
        }
    }
    (state, best_dislike)
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
