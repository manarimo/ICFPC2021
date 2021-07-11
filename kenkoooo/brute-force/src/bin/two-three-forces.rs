use anyhow::Result;
use brute_force::{amylase_bruteforce, PathBufExt};
use manarimo_lib::geometry::{
    count_contained_edges, count_contained_points, count_valid_edges, dislike, Point,
};
use manarimo_lib::types::{Pose, Problem};
use rayon::prelude::*;
use std::collections::HashMap;
use std::env;
use std::fs::{read_dir, File};
use std::io::BufWriter;
use std::path::{Path, PathBuf};

fn main() -> Result<()> {
    let args = env::args().collect::<Vec<_>>();

    let problem_dir_or_file = &args[1];
    let solution_dir = &args[2];
    let output_dir = PathBuf::from(&args[3]);

    let problems = fetch_problems(problem_dir_or_file)?;
    let mut solutions = fetch_all_submission_files(solution_dir)?;

    let mut best_solutions = HashMap::new();
    for (problem_id, problem) in problems {
        let hole = problem
            .hole
            .iter()
            .cloned()
            .map(Point::from)
            .collect::<Vec<_>>();
        let original_pose = problem
            .figure
            .vertices
            .iter()
            .cloned()
            .map(Point::from)
            .collect::<Vec<_>>();
        if let Some(solutions) = solutions.remove(&problem_id) {
            for (solver, solution) in solutions {
                let pose = solution
                    .vertices
                    .iter()
                    .cloned()
                    .map(Point::from)
                    .collect::<Vec<_>>();
                if count_contained_edges(&hole, &pose, &problem.figure.edges)
                    != problem.figure.edges.len()
                {
                    continue;
                }
                if count_contained_points(&hole, &pose) != problem.figure.vertices.len() {
                    continue;
                }
                if count_valid_edges(
                    &pose,
                    &problem.figure.edges,
                    &original_pose,
                    problem.epsilon,
                ) != problem.figure.edges.len()
                {
                    continue;
                }

                let dislike = dislike(&hole, &pose);

                let current = best_solutions.entry(problem_id).or_insert_with(|| {
                    (dislike, problem.clone(), solution.clone(), solver.clone())
                });
                if current.0 > dislike {
                    current.0 = dislike;
                    current.2 = solution;
                    current.3 = solver.clone();
                }
            }
        }
    }

    best_solutions.into_par_iter().for_each(
        |(problem_id, (dislike, problem, mut solution, solver_name)): (
            i64,
            (i64, Problem, Pose, String),
        )| {
            for force in 1..=2 {
                let output = output_dir.join(format!("{}.json", problem_id));
                let mut best_dislike = dislike;
                let fixed_lists = get_fixed_lists(problem.figure.vertices.len(), force);
                println!(
                    "Solving {} force={} start={} {}",
                    problem_id, force, best_dislike, solver_name
                );
                for fixed in fixed_lists {
                    amylase_bruteforce::solve(
                        problem.clone(),
                        &fixed,
                        solution.clone(),
                        |pose, dislike| {
                            if dislike < best_dislike {
                                let file = File::create(&output).expect("file creation error");
                                let writer = BufWriter::new(file);
                                serde_json::to_writer(writer, &pose).expect("write error");
                                println!("{:?} dislike:{}", output, dislike);
                                best_dislike = dislike;
                                solution = pose;
                            }
                        },
                        |_| {
                            // do nothing
                        },
                    );
                }
                println!("Solved {}", problem_id);
            }
        },
    );

    Ok(())
}

fn get_fixed_lists(n: usize, force: usize) -> Vec<Vec<usize>> {
    let mut frees = vec![];
    dfs_fixed_list(n, force, &mut vec![], &mut frees);
    frees
        .into_iter()
        .map(|free| (0..n).filter(|&x| !free.contains(&x)).collect::<Vec<_>>())
        .collect()
}

fn dfs_fixed_list(n: usize, force: usize, seg: &mut Vec<usize>, ans: &mut Vec<Vec<usize>>) {
    if force == seg.len() {
        ans.push(seg.clone());
        return;
    }
    let last = if seg.is_empty() {
        n
    } else {
        seg[seg.len() - 1]
    };
    for i in 0..last {
        seg.push(i);
        dfs_fixed_list(n, force, seg, ans);
        assert_eq!(seg.pop(), Some(i));
    }
}

fn fetch_all_submission_files<P: AsRef<Path>>(dir: P) -> Result<HashMap<i64, Vec<(String, Pose)>>> {
    let mut solutions = HashMap::new();
    for path in read_dir(dir)? {
        let dir_path = path?.path();
        if !dir_path.is_dir() {
            continue;
        }

        let solver = match dir_path.file_name().and_then(|s| s.to_str()) {
            Some(solver) => solver,
            None => continue,
        };
        let solver_name = solver.to_string();

        for filepath in read_dir(dir_path)? {
            let filepath = filepath?.path();
            if !filepath.is_json()? {
                continue;
            }

            println!("Loading {:?}", filepath);
            let problem_id = match filepath.problem_id() {
                Ok(problem_id) => problem_id,
                Err(_) => continue,
            };

            let solution = match filepath.parse_json::<Pose>() {
                Ok(solution) => solution,
                Err(_) => continue,
            };

            if let Some(bonuses) = solution.bonuses.as_ref() {
                if !bonuses.is_empty() {
                    continue;
                }
            }

            solutions
                .entry(problem_id)
                .or_insert_with(Vec::new)
                .push((solver_name.clone(), solution));
        }
    }
    Ok(solutions)
}

fn fetch_problems<P: AsRef<Path>>(file_or_dir: P) -> Result<HashMap<i64, Problem>> {
    if file_or_dir.as_ref().is_file() {
        let filepath = file_or_dir.as_ref().to_path_buf();
        let problem_id = filepath.problem_id()?;
        let problem: Problem = filepath.parse_json()?;
        let mut map = HashMap::new();
        map.insert(problem_id, problem);
        Ok(map)
    } else {
        let mut map = HashMap::new();
        for path in read_dir(file_or_dir)? {
            let filepath = path?.path();
            if !filepath.is_json()? {
                continue;
            }
            println!("Loading {:?}", filepath);
            let problem_id = filepath.problem_id()?;
            let problem: Problem = filepath.parse_json()?;
            map.insert(problem_id, problem);
        }
        Ok(map)
    }
}
