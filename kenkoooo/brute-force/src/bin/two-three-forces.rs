use anyhow::Result;
use brute_force::{
    amylase_bruteforce, extract_valid_best_solutions, load_all_problems, load_solutions, PathRefExt,
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

    let problems = load_all_problems(problem_dir_or_file)?;
    let solutions = load_solutions(solution_dir)?;

    let best_solutions = extract_valid_best_solutions(problems, solutions);

    for force in 1..=2 {
        best_solutions.clone().into_par_iter().for_each(
            |(problem_id, (dislike, problem, mut solution, solver_name)): (
                i64,
                (i64, Problem, Pose, String),
            )| {
                let mut best_dislike = dislike;
                loop {
                    let before_dislike = best_dislike;

                    let output = output_dir.join(format!("{}.json", problem_id));
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

                    if best_dislike == before_dislike {
                        break;
                    }
                }
            },
        );
    }

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
