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
    let (ans, score) = solve(
        problem,
        Pose {
            vertices,
            bonuses: Some(vec![]),
        },
    );
    log(&format!("score={}", score));
    let ans = serde_json::to_string(&ans).unwrap();
    ans
}

#[wasm_bindgen]
pub fn solve_brute_force(
    problem_json: &str,
    solution_json: &str,
    fixed_indices_json: &str,
    f: &js_sys::Function,
) {
    let problem: Problem = serde_json::from_str(problem_json).unwrap();
    let solution: Pose = serde_json::from_str(solution_json).unwrap();
    let fixed: Vec<usize> = serde_json::from_str(fixed_indices_json).unwrap();
    log("started");
    brute_force::amylase_bruteforce::solve(
        problem,
        &fixed,
        solution,
        |pose, _score| {
            let pose_string = serde_json::to_string(&pose).unwrap();
            let pose_string = JsValue::from_str(&pose_string);
            let this = JsValue::null();
            let _ = f.call1(&this, &pose_string);
        },
        |step: usize| {
            if step % 10000 == 0 {
                log(&format!("step={}", step));
            }
        },
    );
}
