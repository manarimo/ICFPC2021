import React from "react";

import { Container, Row, Table } from "react-bootstrap";
import { dislike, isEdgeInside } from "../tslib/amyfunc";
import { Figure, getOutsidePointIds, Pair, Problem } from "../utils";
import { absoluteBigInt, sqDistance } from "../calcUtils";
import { GlobalistTable } from "./GlobalistTable";

interface Props {
  userFigure: Figure;
  problem: Problem;
  usingGlobalist: boolean;
  isWallHacking: boolean;
}

export const PoseInfoPanel = (props: Props) => {
  const { problem, usingGlobalist, isWallHacking } = props;
  const hole = problem.hole.map(([x, y]) => ({ x, y }));
  const ps = props.userFigure.vertices.map(([x, y]) => ({ x, y }));
  const dislikeScore = dislike(hole, ps);

  const originalVertices = problem.figure.vertices;
  const eps = problem.epsilon;

  let tooShortEdges = [] as [number, number][];
  let tooLongEdges = [] as [number, number][];
  let outsideEdges = [] as [number, number][];
  problem.figure.edges.forEach(([from, to]) => {
    const piOriginal = originalVertices[from];
    const pjOriginal = originalVertices[to];
    const originalDist = sqDistance(piOriginal, pjOriginal);

    const pi = props.userFigure.vertices[from];
    const pj = props.userFigure.vertices[to];
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
  // break a leg case
  const isLegBroken =
    props.userFigure.vertices.length > problem.figure.vertices.length;
  if (isLegBroken) {
    const k = problem.figure.vertices.length;
    const [iLeg, jLeg] = props.userFigure.edges.filter(
      ([i, j]) => i === k || j === k
    );
    const i = iLeg[0] + iLeg[1] - k;
    const j = jLeg[0] + jLeg[1] - k;

    const isNotBrokenOriginalEdge = ([a, b]: [number, number]) =>
      !(Math.min(a, b) === Math.min(i, j) && Math.max(a, b) === Math.max(i, j));

    tooShortEdges = tooShortEdges.filter(isNotBrokenOriginalEdge);
    tooLongEdges = tooLongEdges.filter(isNotBrokenOriginalEdge);
    outsideEdges = outsideEdges.filter(isNotBrokenOriginalEdge);

    const piOriginal = originalVertices[i];
    const pjOriginal = originalVertices[j];
    const originalDist = sqDistance(piOriginal, pjOriginal);

    const handleRestrictions = (a: number, b: number) => {
      const pa = props.userFigure.vertices[a];
      const pb = props.userFigure.vertices[b];

      const dist = sqDistance(pa, pb);
      const difference = absoluteBigInt(BigInt(4) * dist - originalDist);
      const ok = difference * BigInt(1_000_000) <= BigInt(eps) * originalDist;
      if (!ok) {
        if (originalDist > dist * BigInt(4)) {
          tooShortEdges.push([a, b]);
        } else {
          tooLongEdges.push([a, b]);
        }
      }
      const edge = {
        src: { x: pa[0], y: pa[1] },
        dst: { x: pb[0], y: pb[1] },
      };
      if (!isEdgeInside(hole, edge)) {
        outsideEdges.push([a, b]);
      }
    };
    handleRestrictions(i, k);
    handleRestrictions(j, k);
  }

  if (isWallHacking) {
    const outsidePointIds = getOutsidePointIds(props.userFigure.vertices, hole);
    const isBothInsideEdges = ([i, j]: Pair) =>
      !outsidePointIds.includes(i) && !outsidePointIds.includes(j);

    tooShortEdges = tooShortEdges.filter(isBothInsideEdges);
    tooLongEdges = tooLongEdges.filter(isBothInsideEdges);
    outsideEdges = outsideEdges.filter(isBothInsideEdges);
  }

  return (
    <Container>
      <Row>
        <Table size="sm">
          <tbody>
            <tr>
              <th>dislike</th>
              <td>{dislikeScore}</td>
            </tr>
            <tr>
              <th>eps</th>
              <td>{eps}</td>
            </tr>
            {isWallHacking && (
              <tr>
                <th>枠の外にある点</th>
                <td>
                  {JSON.stringify(
                    getOutsidePointIds(props.userFigure.vertices, hole)
                  )}
                </td>
              </tr>
            )}
            {!usingGlobalist && (
              <>
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
              </>
            )}
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
      <Row>
        {usingGlobalist && (
          <GlobalistTable problem={problem} pose={props.userFigure.vertices} />
        )}
      </Row>
    </Container>
  );
};
