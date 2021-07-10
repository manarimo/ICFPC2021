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
    let solution: Pose = serde_json::from_reader(reader)?;

    let fixed = args[4]
        .split(',')
        .map(|x| x.parse::<usize>())
        .collect::<Result<Vec<_>, _>>()?;

    amylase_bruteforce::solve(problem, &fixed, solution, |pose, dislike| {
        let file = File::create(&output).expect("file creation error");
        let writer = BufWriter::new(file);
        serde_json::to_writer(writer, &pose).expect("write error");
        println!("{:?} dislike:{}", output, dislike);
    });

    Ok(())
}
