import { Problem } from "./utils";
import { isEdgeInside, isPointInside, isValidEdge } from "./tslib/amyfunc";

const THRESHOLD = 100;

const D = [
  [1, -1],
  [1, 1],
];

const toPoint = ([x, y]: [number, number]) => ({ x, y });

export const solveSinglePoint = (
    pose: [number, number][],
    problem: Problem,
    targetPointId: number
) => {
  const holePolygon = problem.hole.map(([x, y]) => ({ x, y }));
  const originalPose = problem.figure.vertices;
  const epsilon = problem.epsilon;

  const edges = [] as [number, number][];
  problem.figure.edges.forEach(([i, j]) => {
    if (i === targetPointId || j === targetPointId) {
      edges.push([i, j]);
    }
  });

  const [curX, curY] = pose[targetPointId];
  for (let distance = 0; distance < THRESHOLD; distance++) {
    for (let xDirection of [1, -1]) {
      for (let [dx, dy] of D) {
        let x = curX - distance * xDirection;
        let y = curY;
        for (let i = 0; i < distance; i++) {
          x += dx * xDirection;
          y += dy;
          if (!isPointInside(holePolygon, { x, y })) {
            continue;
          }

          const targetPoint = { x, y };
          const edgeCheck = edges.every(([i, j]) => {
            const piOriginal = toPoint(originalPose[i]);
            const pjOriginal = toPoint(originalPose[j]);
            const pi = i === targetPointId ? targetPoint : toPoint(pose[i]);
            const pj = j === targetPointId ? targetPoint : toPoint(pose[j]);
            const newEdge = { src: pi, dst: pj };
            return (
                isValidEdge(
                    { src: piOriginal, dst: pjOriginal },
                    newEdge,
                    epsilon
                ) && isEdgeInside(holePolygon, newEdge)
            );
          });
          if (edgeCheck) {
            return targetPoint;
          }
        }
      }
    }

  }
};
