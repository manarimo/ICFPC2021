import React from "react";
import { Figure, Problem } from "../utils";
import { Button, Container } from "react-bootstrap";
import { solvePartialBruteForce } from "../RustSolver";

interface Props {
  problem: Problem;
  userFigure: Figure;
  selectedVertices: number[];
  onSolve: (pose: [number, number][]) => void;
}
export const SinglePointSolverPanel = (props: Props) => {
  return (
    <Container>
      <Button
        onClick={async () => {
          await solvePartialBruteForce(
            props.problem,
            { vertices: props.userFigure.vertices },
            props.selectedVertices,
            props.onSolve
          );
        }}
      >
        選択した点を固定してbrute-force
      </Button>
    </Container>
  );
};
