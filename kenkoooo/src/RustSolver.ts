import { Problem } from "./utils";

export const solveAnnealing = async (problem: Problem) => {
  const module = await import("./wasm-rust/build");
  const ans = module.solve_annealing(JSON.stringify(problem));
  return JSON.parse(ans) as { vertices: [number, number][] };
};

export const solvePartialBruteForce = async (
  problem: Problem,
  pose: { vertices: [number, number][] },
  fixed: number[],
  setPose: (pose: [number, number][]) => void
) => {
  const module = await import("./wasm-rust/build");
  module.solve_brute_force(
    JSON.stringify(problem),
    JSON.stringify(pose),
    JSON.stringify(fixed),
    (poseStr: string) => {
      console.log("yo");
      const pose: { vertices: [number, number][] } = JSON.parse(poseStr);
      setPose(pose.vertices);
    }
  );
};
