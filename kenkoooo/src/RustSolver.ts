import { Problem } from "./utils";

export const solveAnnealing = async (problem: Problem) => {
  const module = await import("./wasm-rust/build");
  const ans = module.solve_annealing(JSON.stringify(problem));
  return JSON.parse(ans) as { vertices: [number, number][] };
};
