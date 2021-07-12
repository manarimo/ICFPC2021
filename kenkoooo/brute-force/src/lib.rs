use anyhow::{Context, Result};
use manarimo_lib::geometry::{
    count_contained_edges, count_contained_points, count_valid_edges, dislike, Point,
};
use manarimo_lib::types::{Pose, Problem};
use serde::de::DeserializeOwned;
use serde::Serialize;
use std::collections::HashMap;
use std::fs::{read_dir, File};
use std::io::{BufReader, BufWriter};
use std::path::Path;

pub mod amylase_bruteforce;

pub trait PathRefExt {
    fn write_json<T: Serialize>(&self, value: &T) -> Result<()>;
    fn is_json(&self) -> Result<bool>;
    fn problem_id(&self) -> Result<i64>;
    fn parse_json<T: DeserializeOwned>(&self) -> Result<T>;
}

impl<P> PathRefExt for P
where
    P: AsRef<Path>,
{
    fn write_json<T: Serialize>(&self, value: &T) -> Result<()> {
        let file = File::create(self.as_ref())?;
        let writer = BufWriter::new(file);
        serde_json::to_writer(writer, value)?;
        Ok(())
    }
    fn is_json(&self) -> Result<bool> {
        if self.as_ref().is_file() {
            let extension = self
                .as_ref()
                .extension()
                .and_then(|s| s.to_str())
                .context("no extension")?;
            Ok(extension == "json")
        } else {
            Ok(false)
        }
    }

    fn problem_id(&self) -> Result<i64> {
        let problem_id = self
            .as_ref()
            .file_stem()
            .and_then(|s| s.to_str())
            .context("no file name")?
            .parse::<i64>()?;
        Ok(problem_id)
    }
    fn parse_json<T: DeserializeOwned>(&self) -> Result<T> {
        let file = File::open(self.as_ref())?;
        let solution: T = serde_json::from_reader(BufReader::new(file))?;
        Ok(solution)
    }
}

pub fn load_solutions<P: AsRef<Path>>(dir: P) -> Result<HashMap<i64, Vec<(String, Pose)>>> {
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

pub fn extract_valid_best_solutions(
    problems: HashMap<i64, Problem>,
    mut solutions: HashMap<i64, Vec<(String, Pose)>>,
) -> HashMap<i64, (i64, Problem, Pose, String)> {
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
    best_solutions
}

pub fn load_all_problems<P: AsRef<Path>>(file_or_dir: P) -> Result<HashMap<i64, Problem>> {
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
