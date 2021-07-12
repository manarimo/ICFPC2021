use anyhow::Result;
use brute_force::PathRefExt;
use manarimo_lib::geometry::{
    count_contained_edges, count_contained_points, count_valid_edges, dislike, Point,
};
use manarimo_lib::types::{Bonus, Pose, Problem};
use rand::prelude::*;
use std::collections::BTreeSet;
use std::path::Path;

fn main() -> Result<()> {
    dotenv::dotenv()?;
    env_logger::init();

    let args: Vec<String> = std::env::args().collect();

    let problem: Problem = args[1].parse_json()?;
    let solution: Pose = args[2].parse_json()?;
    let mut prohibited = BTreeSet::new();
    for s in args[4].split(',') {
        let s = s.trim();
        if s.len() == 0 {
            continue;
        }
        let v = s.parse::<usize>()?;
        prohibited.insert(v);
    }
    solve(&problem, &solution, &args[3], &prohibited)?;

    Ok(())
}

fn solve<P: AsRef<Path>>(
    problem: &Problem,
    solution: &Pose,
    output: P,
    prohibited: &BTreeSet<usize>,
) -> Result<()> {
    let mut rng = StdRng::seed_from_u64(717);

    let hole: Vec<Point> = problem.hole.iter().map(Point::from).collect();
    let orig_pose: Vec<Point> = problem.figure.vertices.iter().map(Point::from).collect();
    let edges = problem.figure.edges.clone();

    let hole = &hole;
    let edges = &edges;
    let orig_pose = &orig_pose;

    let mut current_state: Vec<Point> = solution.vertices.iter().map(Point::from).collect();
    let mut current_cost = calc_globalist_cost(&current_state, edges, orig_pose);
    assert!(is_valid(&current_state, hole, edges), "Can not start");

    let fixed_dislike = dislike(hole, &current_state);

    loop {
        let n = current_state.len();
        let select = rng.gen_range(0..n);
        if prohibited.contains(&select) {
            continue;
        }

        let dx = rng.gen_range(-1..=1);
        let dy = rng.gen_range(-1..=1);
        if dx == dy {
            continue;
        }
        let prev = current_state[select];
        current_state[select].x += dx;
        current_state[select].y += dy;

        if !is_valid(&current_state, hole, edges) {
            current_state[select] = prev;
            continue;
        }
        if dislike(hole, &current_state) > fixed_dislike {
            current_state[select] = prev;
            continue;
        }

        let new_cost = calc_globalist_cost(&current_state, edges, orig_pose);
        if new_cost < current_cost {
            log::info!("{} -> {}", current_cost, new_cost);
            current_cost = new_cost;

            let pose = Pose {
                vertices: current_state.iter().map(|p| [p.x, p.y]).collect(),
                bonuses: Some(vec![Bonus {
                    bonus: "GLOBALIST".to_string(),
                }]),
            };
            output.write_json(&pose)?;
        } else {
            current_state[select] = prev;
        }
    }
}

fn is_valid(solution: &[Point], hole: &[Point], edges: &[[usize; 2]]) -> bool {
    if count_contained_points(hole, solution) != solution.len() {
        return false;
    }
    if count_contained_edges(hole, solution, edges) != edges.len() {
        return false;
    }
    true
}

fn calc_globalist_cost(solution: &[Point], edges: &[[usize; 2]], orig_pose: &[Point]) -> f64 {
    edges
        .iter()
        .map(|&[from, to]| {
            let p = orig_pose[from];
            let q = orig_pose[to];
            let d1 = p.d(&q);

            let p = solution[from];
            let q = solution[to];
            let d2 = p.d(&q);

            let difference = (d1 - d2).abs();
            (difference * 1_000_000) as f64 / d1 as f64
        })
        .sum::<f64>()
}
