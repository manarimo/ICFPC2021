use manarimo_lib::geometry::{dislike, Edge, Point};
use manarimo_lib::types::{Pose, Problem};
use rand::prelude::*;
use std::cmp::Reverse;
use std::env;
use std::error::Error;
use std::fs::{File, OpenOptions};
use std::io::{BufReader, BufWriter};

fn solve(problem: Problem, step_by: usize, output_path: &str) {
    let mut rng = StdRng::seed_from_u64(101);
    let hole = problem
        .hole
        .into_iter()
        .map(Point::from)
        .collect::<Vec<_>>();
    let min_x = hole.iter().map(|p| p.x).min().unwrap();
    let max_x = hole.iter().map(|p| p.x).max().unwrap();
    let min_y = hole.iter().map(|p| p.y).min().unwrap();
    let max_y = hole.iter().map(|p| p.y).max().unwrap();

    let mut valid_positions = vec![];
    for x in (min_x..=max_x).step_by(step_by) {
        for y in (min_y..=max_y).step_by(step_by) {
            let p = Point { x, y };
            if p.is_contained(&hole) {
                valid_positions.push(p);
            }
        }
    }

    valid_positions.shuffle(&mut rng);
    let figure = problem.figure;
    let n = figure.vertices.len();
    let mut graph = vec![vec![]; n];
    for &[from, to] in figure.edges.iter() {
        graph[from].push(to);
        graph[to].push(from);
    }

    let mut vertex_ids = (0..n).collect::<Vec<_>>();
    vertex_ids.sort_by_key(|&i| Reverse(graph[i].len()));

    let mut vid_to_order = vec![0; n];
    for (i, &vid) in vertex_ids.iter().enumerate() {
        vid_to_order[vid] = i;
    }

    let original_pose = figure
        .vertices
        .into_iter()
        .map(Point::from)
        .collect::<Vec<_>>();
    let dfs = DfsSolver {
        valid_positions,
        original_pose,
        hole,
        vertex_ids,
        graph,
        vid_to_order,
        eps: problem.epsilon,
        output_path: output_path.into(),
    };
    dfs.dfs(&mut vec![], 1 << 60);
}

struct DfsSolver {
    valid_positions: Vec<Point>,
    original_pose: Vec<Point>,
    hole: Vec<Point>,
    vertex_ids: Vec<usize>,
    graph: Vec<Vec<usize>>,
    vid_to_order: Vec<usize>,
    eps: i64,
    output_path: String,
}

impl DfsSolver {
    fn dfs(&self, positions: &mut Vec<Point>, best: i64) -> i64 {
        if positions.len() >= self.original_pose.len() {
            let result = dislike(&self.hole, positions);
            return if result < best {
                let n = positions.len();
                let vertices = (0..n)
                    .map(|i| positions[self.vid_to_order[i]])
                    .map(|p| [p.x, p.y])
                    .collect::<Vec<_>>();
                let pose = Pose { vertices };
                let file = File::create(&self.output_path).expect("file creation error");
                let writer = BufWriter::new(file);
                serde_json::to_writer(writer, &pose).expect("write error");
                println!("{} dislike:{}", self.output_path, result);
                result
            } else {
                best
            };
        }

        let i = positions.len();
        let vid = self.vertex_ids[i];
        let mut best = best;
        for &p in self.valid_positions.iter() {
            let mut valid = true;
            for &next_vid in self.graph[vid].iter() {
                if self.vid_to_order[next_vid] >= i {
                    continue;
                }

                let edge = Edge::new(p, positions[self.vid_to_order[next_vid]]);
                let source = Edge::new(self.original_pose[vid], self.original_pose[next_vid]);
                if !edge.is_valid(&source, self.eps) {
                    valid = false;
                    break;
                }
                if !edge.is_contained(&self.hole) {
                    valid = false;
                    break;
                }
            }
            if !valid {
                continue;
            }

            positions.push(p);
            best = self.dfs(positions, best);
            positions.pop();
        }
        best
    }
}

fn main() -> Result<(), Box<dyn Error>> {
    let args = env::args().collect::<Vec<_>>();
    let input_path = &args[1];
    let output_path = &args[2];
    println!("{} ->{}", input_path, output_path);

    let file = File::open(&input_path)?;
    let reader = BufReader::new(file);
    let problem: Problem = serde_json::from_reader(reader)?;
    solve(problem, 1, output_path);

    Ok(())
}
