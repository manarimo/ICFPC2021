import React, { useState } from "react";
import { Problem } from "../utils";
import { Alert, Button, Container } from "react-bootstrap";
import { solveSinglePoint } from "../Solver";

interface Props {
  problem: Problem;
  userPose: [number, number][];
  selectedVertices: number[];
  onSolve: (answer: [number, number]) => void;
}
export const SinglePointSolverPanel = (props: Props) => {
  const [message, setMessage] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);
  const solve = () => {
    setMessage(null);
    setSolving(true);
    const targetPointId = props.selectedVertices[0];
    const result = solveSinglePoint(
      props.userPose,
      props.problem,
      targetPointId
    );
    if (result) {
      props.onSolve([result.x, result.y]);
    } else {
      setMessage("だめでした・・・");
    }
    setSolving(false);
  };

  return (
    <Container>
      <Button
        disabled={props.selectedVertices.length !== 1 && !solving}
        onClick={solve}
      >
        この点を可能なら制約を満たす位置に移動する
      </Button>
      {message && <Alert>{message}</Alert>}
    </Container>
  );
};
