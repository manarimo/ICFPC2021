pub use manarimo_lib::geometry;
pub use manarimo_lib::types;
pub mod solver;

use crate::solver::solve;
use crate::types::{Pose, Problem};
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

}

#[wasm_bindgen]
pub fn solve_annealing(problem_json: &str) -> String {
    let problem: Problem = serde_json::from_str(problem_json).unwrap();
    let vertices = problem.figure.vertices.clone();
    let (ans, score) = solve(problem, Pose { vertices });
    log(&format!("score={}", score));
    let ans = serde_json::to_string(&ans).unwrap();
    ans
}
