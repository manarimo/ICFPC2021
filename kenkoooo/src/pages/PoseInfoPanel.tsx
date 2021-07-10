import React from "react";

import { Container, Row, Table } from "react-bootstrap";
import { dislike, isEdgeInside } from "../tslib/amyfunc";
import { Problem } from "../utils";
import { absoluteBigInt, sqDistance } from "../calcUtils";

interface Props {
  userPose: [number, number][];
  problem: Problem;
}

export const PoseInfoPanel = (props: Props) => {
  const { problem } = props;
  const hole = problem.hole.map(([x, y]) => ({ x, y }));
  const ps = props.userPose.map(([x, y]) => ({ x, y }));
  const dislikeScore = dislike(hole, ps);

  const originalVertices = problem.figure.vertices;
  const eps = problem.epsilon;

  const tooShortEdges = [] as [number, number][];
  const tooLongEdges = [] as [number, number][];
  const outsideEdges = [] as [number, number][];
  problem.figure.edges.forEach(([from, to]) => {
    const piOriginal = originalVertices[from];
    const pjOriginal = originalVertices[to];
    const originalDist = sqDistance(piOriginal, pjOriginal);

    const pi = props.userPose[from];
    const pj = props.userPose[to];
    const userDist = sqDistance(pi, pj);

    const difference = absoluteBigInt(userDist - originalDist);

    // difference/originalDist <= epsilon/1_000_000
    const ok = difference * BigInt(1_000_000) <= BigInt(eps) * originalDist;
    if (!ok) {
      if (originalDist > userDist) {
        tooShortEdges.push([from, to]);
      } else {
        tooLongEdges.push([from, to]);
      }
    }

    const edge = {
      src: { x: pi[0], y: pi[1] },
      dst: { x: pj[0], y: pj[1] },
    };
    if (!isEdgeInside(hole, edge)) {
      outsideEdges.push([from, to]);
    }
  });
  return (
    <Container>
      <Row>
        <Table>
          <tbody>
            <tr>
              <th>dislike</th>
              <td>{dislikeScore}</td>
            </tr>
            <tr>
              <th>eps</th>
              <td>{eps}</td>
            </tr>
            <tr>
              <th>長すぎる辺</th>
              <td>
                <ul>
                  {tooLongEdges.map(([from, to]) => (
                    <li key={`${from}-${to}`}>
                      ({from}, {to})
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
            <tr>
              <th>短すぎる辺</th>
              <td>
                <ul>
                  {tooShortEdges.map(([from, to]) => (
                    <li key={`${from}-${to}`}>
                      ({from}, {to})
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
            <tr>
              <th>収まっていない辺</th>
              <td>
                <ul>
                  {outsideEdges.map(([from, to]) => (
                    <li key={`${from}-${to}`}>
                      ({from}, {to})
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          </tbody>
        </Table>
      </Row>
    </Container>
  );
};
