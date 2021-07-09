import React from "react";

import { Col, Container, Row } from "react-bootstrap";
import { dislike } from "../tslib/amyfunc";
import { Problem } from "../utils";

interface Props {
  userPose: [number, number][];
  problem: Problem;
}

export const PoseInfoPanel = (props: Props) => {
  const hole = props.problem.hole.map(([x, y]) => ({ x, y }));
  const ps = props.userPose.map(([x, y]) => ({ x, y }));
  const dislikeScore = dislike(hole, ps);
  return (
    <Container>
      <Row>
        <Col>dislike: {dislikeScore}</Col>
      </Row>
    </Container>
  );
};
