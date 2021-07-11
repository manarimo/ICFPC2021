use brute_force::amylase_bruteforce;
use manarimo_lib::types::{Pose, Problem};
use rayon::prelude::*;
use std::env;
use std::error::Error;
use std::fs::{read_dir, File};
use std::io::{BufReader, BufWriter};
use std::path::PathBuf;

fn main() -> Result<(), Box<dyn Error>> {
    let args = env::args().collect::<Vec<_>>();
    let output_dir = PathBuf::from(&args[2]);

    let mut pairs = vec![];
    for entry in read_dir(&args[1])? {
        let path = entry?.path();
        if path.is_file() && path.extension().map(|s| s == "json").unwrap_or(false) {
            if let Some(filename) = path.file_name().and_then(|f| f.to_str()) {
                pairs.push((path.clone(), output_dir.join(filename)));
            }
        }
    }

    let mut inputs = vec![];
    for (input, output) in pairs {
        let file = File::open(input)?;
        let reader = BufReader::new(file);
        let problem: Problem = serde_json::from_reader(reader)?;
        inputs.push((problem, output));
    }

    inputs
        .into_par_iter()
        .for_each(|(input, output): (Problem, _)| {
            let solution = Pose {
                vertices: input.figure.vertices.clone(),
                bonuses: None,
            };
            amylase_bruteforce::solve(
                input,
                &[],
                solution,
                |pose, dislike| {
                    let file = File::create(&output).expect("file creation error");
                    let writer = BufWriter::new(file);
                    serde_json::to_writer(writer, &pose).expect("write error");
                    println!("{:?} dislike:{}", output, dislike);
                },
                |_| {
                    // do nothing
                },
            );
        });

    Ok(())
}
