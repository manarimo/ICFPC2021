use serde::{Deserialize, Serialize};

type Pair = [i64; 2];

#[derive(Deserialize, Clone)]
pub struct Problem {
    pub hole: Vec<Pair>,
    pub epsilon: i64,
    pub figure: Figure,
}

#[derive(Deserialize, Clone)]
pub struct Figure {
    pub edges: Vec<[usize; 2]>,
    pub vertices: Vec<Pair>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Pose {
    pub vertices: Vec<Pair>,
}
