import React from "react";
import { Figure, Problem } from "../utils";
import { Button, Container } from "react-bootstrap";
import { solvePartialBruteForce } from "../RustSolver";
import {solveSinglePoint} from "../Solver";

interface Props {
  problem: Problem;
  userFigure: Figure;
  selectedVertices: number[];
  onSolve: (pose: [number, number][]) => void;
}
export const SinglePointSolverPanel = (props: Props) => {
  const isLegBroken =
    props.userFigure.vertices.length > props.problem.figure.vertices.length;
  return (
    <Container>
      <Button
        disabled={isLegBroken}
        onClick={() => {
          const solution = solveSinglePoint(
            props.userFigure.vertices,
            props.problem,
            props.selectedVertices[0]
          );
          if (solution !== undefined) {
            const newPose = props.userFigure.vertices.map((x) => x)
            newPose[props.selectedVertices[0]] = [solution.x, solution.y];
            props.onSolve(newPose);
          }
        }}
      >
        選択した点を固定してbrute-force
      </Button>
    </Container>
  );
};
