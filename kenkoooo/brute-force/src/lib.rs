use anyhow::{Context, Result};
use serde::de::DeserializeOwned;
use serde::Serialize;
use std::fs::File;
use std::io::{BufReader, BufWriter};
use std::path::{Path, PathBuf};

pub mod amylase_bruteforce;

pub trait PathBufExt {
    fn is_json(&self) -> Result<bool>;
    fn problem_id(&self) -> Result<i64>;
    fn parse_json<T: DeserializeOwned>(&self) -> Result<T>;
}

impl PathBufExt for PathBuf {
    fn is_json(&self) -> Result<bool> {
        if self.is_file() {
            let extension = self
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
            .file_stem()
            .and_then(|s| s.to_str())
            .context("no file name")?
            .parse::<i64>()?;
        Ok(problem_id)
    }
    fn parse_json<T: DeserializeOwned>(&self) -> Result<T> {
        let file = File::open(self)?;
        let solution: T = serde_json::from_reader(BufReader::new(file))?;
        Ok(solution)
    }
}

pub trait PathRefExt {
    fn write_json<T: Serialize>(&self, value: &T) -> Result<()>;
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
}
