use brute_force::amylase_bruteforce;
use manarimo_lib::types::{Pose, Problem};
use std::env;
use std::error::Error;
use std::fs::File;
use std::io::{BufReader, BufWriter};
use std::path::PathBuf;

fn main() -> Result<(), Box<dyn Error>> {
    let args = env::args().collect::<Vec<_>>();

    let file = File::open(&args[1])?;
    let path = PathBuf::from(&args[1]);
    let path = path
        .file_name()
        .expect(&format!("{} is not a file", args[1]));
    let reader = BufReader::new(file);
    let problem: Problem = serde_json::from_reader(reader)?;
    let output_dir = PathBuf::from(&args[2]);
    let output = output_dir.join(path);

    let file = File::open(&args[3])?;
    let reader = BufReader::new(file);
    let mut solution: Pose = serde_json::from_reader(reader)?;

    let n = solution.vertices.len();
    let mut best_dislike = 1 << 60;
    eprintln!("3 forces");
    for (i, j, k) in (0..n)
        .flat_map(|i| (0..i).map(move |j| (i, j)))
        .flat_map(|(i, j)| (0..j).map(move |k| (i, j, k)))
    {
        let fixed = (0..n)
            .filter(|&x| x != i && x != j && x != k)
            .collect::<Vec<_>>();
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

    Ok(())
}
