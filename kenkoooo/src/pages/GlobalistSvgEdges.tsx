import React from "react";
import { Figure, pairToPoint, Problem } from "../utils";
import { d } from "../tslib/amyfunc";

interface Props {
  userFigure: Figure;
  problem: Problem;
}

export const GlobalistSvgEdges = (props: Props) => {
  const originalVertices = props.problem.figure.vertices;
  const edges = props.problem.figure.edges;
  const edgeCosts = edges.map(([i, j]) => {
    const piOriginal = pairToPoint(originalVertices[i]);
    const pjOriginal = pairToPoint(originalVertices[j]);
    const originalDist = d(piOriginal, pjOriginal);

    const pi = pairToPoint(props.userFigure.vertices[i]);
    const pj = pairToPoint(props.userFigure.vertices[j]);
    const userDist = d(pi, pj);
    const cost = (Math.abs(userDist - originalDist) * 1_000_000) / originalDist;
    return userDist > originalDist ? cost : -cost;
  });

  const maxAbsCost = Math.max(...edgeCosts.map((cost) => Math.abs(cost)));

  const highH = 200;
  const lowH = 360;
  return (
    <>
      {edges.map(([i, j], idx) => {
        const pi = props.userFigure.vertices[i];
        const pj = props.userFigure.vertices[j];

        const cost = edgeCosts[idx];
        const ratio =
          maxAbsCost === 0 ? 1.0 : (cost + maxAbsCost) / 2 / maxAbsCost;
        const invert = 1.0 - ratio;
        // 240 - 300
        // cost==0 => 270
        const color = hslToHex(lowH + invert * (highH - lowH), 1.0, 0.5);

        const key = `${i}-${j}`;
        return (
          <line
            key={key}
            x1={pi[0]}
            y1={pi[1]}
            x2={pj[0]}
            y2={pj[1]}
            stroke={color}
            strokeWidth="0.3"
          />
        );
      })}
    </>
  );
};
function hslToHex(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0"); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
