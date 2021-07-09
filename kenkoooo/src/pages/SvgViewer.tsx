import { Figure, Problem } from "../utils";
import React from "react";
import { EditorState } from "./EditorState";

interface PointProps {
  x: number;
  y: number;
  pointId: number;
  isEditing: boolean;
  onMouseDown: () => void;
}
const Point = (props: PointProps) => {
  const { x, y, pointId, isEditing } = props;
  const color = isEditing ? "blue" : "black";
  return (
    <circle
      key={pointId}
      cx={x}
      cy={y}
      r="0.7"
      fill={color}
      onMouseDown={props.onMouseDown}
      style={{ cursor: "pointer" }}
    />
  );
};

const sqDistance = (p: [number, number], q: [number, number]) => {
  const dx = BigInt(p[0] - q[0]);
  const dy = BigInt(p[1] - q[1]);
  return dx * dx + dy * dy;
};

const absolute = (a: bigint, b: bigint) => {
  if (a > b) {
    return a - b;
  } else {
    return b - a;
  }
};

const UserFigureLayer = (props: {
  problem: Problem;
  userVertices: [number, number][];
  onEdit: (pointId: number) => void;
  editorState: EditorState | null;
}) => {
  const epsilon = BigInt(props.problem.epsilon);
  const originalVertices = props.problem.figure.vertices;

  return (
    <>
      {props.problem.figure.edges.map(([i, j]) => {
        const piOriginal = originalVertices[i];
        const pjOriginal = originalVertices[j];
        const originalDist = sqDistance(piOriginal, pjOriginal);

        const pi = props.userVertices[i];
        const pj = props.userVertices[j];
        const userDist = sqDistance(pi, pj);

        const difference = absolute(userDist, originalDist);

        // difference/originalDist <= epsilon/1_000_000
        const ok = difference * BigInt(1_000_000) <= epsilon * originalDist;
        const color = ok ? "red" : "blue";
        const strokeWidth = ok ? "0.3" : "0.5";

        const key = `${i}-${j}`;
        return (
          <line
            key={key}
            x1={pi[0]}
            y1={pi[1]}
            x2={pj[0]}
            y2={pj[1]}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
      })}
      {props.userVertices.map(([x, y], pointId) => {
        return (
          <Point
            key={pointId}
            x={x}
            y={y}
            pointId={pointId}
            onMouseDown={() => props.onEdit(pointId)}
            isEditing={props.editorState?.pointId === pointId}
          />
        );
      })}
    </>
  );
};

interface Props {
  problem: Problem;
  userFigure: Figure;
  editorState: EditorState | null;
  onMouseUp: () => void;
  onLatticeTouch: (p: [number, number]) => void;
  onEdit: (pointId: number) => void;
}

export const SvgViewer = (props: Props) => {
  const { problem } = props;
  const holePolygon = problem.hole.map(([x, y]) => `${x},${y}`).join(" ");

  const offset = 10;

  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  problem.hole.forEach(([x, y]) => {
    minX = Math.min(x, minX);
    minY = Math.min(y, minY);
    maxX = Math.max(x, maxX);
    maxY = Math.max(y, maxY);
  });
  problem.figure.vertices.forEach(([x, y]) => {
    minX = Math.min(x, minX);
    minY = Math.min(y, minY);
    maxX = Math.max(x, maxX);
    maxY = Math.max(y, maxY);
  });

  const width = Math.max(maxX - minX, maxY - minY) + 2 * offset;

  return (
    <svg
      viewBox={`${minX - offset} ${minY - offset} ${width} ${width}`}
      xmlns="http://www.w3.org/2000/svg"
      onMouseUp={props.onMouseUp}
      onMouseLeave={props.onMouseUp}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const absoluteX = e.clientX - rect.left;
        const absoluteY = e.clientY - rect.top;
        const x = Math.round((absoluteX * width) / rect.width) - offset;
        const y = Math.round((absoluteY * width) / rect.height) - offset;

        props.onLatticeTouch([x, y]);
      }}
    >
      <rect
        x={minX - offset}
        y={minY - offset}
        width={width}
        height={width}
        fill="#87857e"
        stroke="none"
      />
      <polygon points={holePolygon} fill="#e1ddd1" stroke="none" />
      <UserFigureLayer
        problem={problem}
        userVertices={props.userFigure.vertices}
        editorState={props.editorState}
        onEdit={props.onEdit}
      />
    </svg>
  );
};
