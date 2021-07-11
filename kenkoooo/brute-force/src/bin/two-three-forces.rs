use anyhow::Result;
use brute_force::{amylase_bruteforce, PathBufExt};
use manarimo_lib::geometry::{dislike, Point};
use manarimo_lib::types::{Pose, Problem};
use rayon::prelude::*;
use std::collections::HashMap;
use std::env;
use std::fs::{read_dir, File};
use std::io::BufWriter;
use std::path::{Path, PathBuf};

fn main() -> Result<()> {
    let args = env::args().collect::<Vec<_>>();

    let problem_dir = &args[1];
    let solution_dir = &args[2];
    let output_dir = PathBuf::from(&args[3]);

    let problems = fetch_all_problems(problem_dir)?;
    let mut solutions = fetch_all_submission_files(solution_dir)?;

    let mut best_solutions = HashMap::new();
    for (problem_id, problem) in problems {
        let hole = problem
            .hole
            .iter()
            .cloned()
            .map(Point::from)
            .collect::<Vec<_>>();
        if let Some(solutions) = solutions.remove(&problem_id) {
            for solution in solutions {
                let pose = solution
                    .vertices
                    .iter()
                    .cloned()
                    .map(Point::from)
                    .collect::<Vec<_>>();
                let dislike = dislike(&hole, &pose);
                let current = best_solutions
                    .entry(problem_id)
                    .or_insert_with(|| (dislike, problem.clone(), solution.clone()));
                if current.0 > dislike {
                    current.0 = dislike;
                    current.2 = solution;
                }
            }
        }
    }

    best_solutions.into_par_iter().for_each(
        |(problem_id, (dislike, problem, mut solution)): (i64, (i64, Problem, Pose))| {
            println!("Solving {}", problem_id);
            let output = output_dir.join(format!("{}.json", problem_id));
            let mut best_dislike = dislike;
            let fixed_lists = get_fixed_lists(problem.figure.vertices.len(), 2);
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
        },
    );

    Ok(())
}

fn get_fixed_lists(n: usize, force: usize) -> Vec<Vec<usize>> {
    if force == 2 {
        (0..n)
            .flat_map(|i| (0..i).map(move |j| (i, j)))
            .map(|(i, j)| (0..n).filter(|&x| x != i && x != j).collect::<Vec<_>>())
            .collect()
    } else if force == 3 {
        (0..n)
            .flat_map(|i| (0..i).map(move |j| (i, j)))
            .flat_map(|(i, j)| (0..j).map(move |k| (i, j, k)))
            .map(|(i, j, k)| {
                (0..n)
                    .filter(|&x| x != i && x != j && x != k)
                    .collect::<Vec<_>>()
            })
            .collect()
    } else {
        unimplemented!();
    }
}

fn fetch_all_submission_files<P: AsRef<Path>>(dir: P) -> Result<HashMap<i64, Vec<Pose>>> {
    let mut solutions = HashMap::new();
    for path in read_dir(dir)? {
        let dir_path = path?.path();
        if !dir_path.is_dir() {
            continue;
        }

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

            solutions
                .entry(problem_id)
                .or_insert_with(Vec::new)
                .push(solution);
        }
    }
    Ok(solutions)
}

fn fetch_all_problems<P: AsRef<Path>>(dir: P) -> Result<HashMap<i64, Problem>> {
    let mut map = HashMap::new();
    for path in read_dir(dir)? {
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
