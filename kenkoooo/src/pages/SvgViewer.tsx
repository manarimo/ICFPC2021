import { Problem } from "../utils";
import React from "react";
import { EditorState } from "./EditorState";
import { absoluteBigInt, sqDistance } from "../calcUtils";

interface PointProps {
  x: number;
  y: number;
  pointId: number;
  isEditing: boolean;
  isSelected: boolean;
  onMouseDown: () => void;
}
const Point = (props: PointProps) => {
  const { x, y, pointId, isEditing, isSelected } = props;
  const color = isEditing ? "blue" : isSelected ? "yellow" : "black";
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

const UserPoseLayer = (props: {
  problem: Problem;
  userPose: [number, number][];
  onEdit: (pointId: number) => void;
  editorState: EditorState | null;
  selectedVertices: number[];
}) => {
  const epsilon = BigInt(props.problem.epsilon);
  const originalVertices = props.problem.figure.vertices;
  return (
    <>
      {props.problem.figure.edges.map(([i, j]) => {
        const piOriginal = originalVertices[i];
        const pjOriginal = originalVertices[j];
        const originalDist = sqDistance(piOriginal, pjOriginal);

        const pi = props.userPose[i];
        const pj = props.userPose[j];
        const userDist = sqDistance(pi, pj);

        const difference = absoluteBigInt(userDist - originalDist);

        // difference/originalDist <= epsilon/1_000_000
        const ok = difference * BigInt(1_000_000) <= epsilon * originalDist;
        const color = ok ? "green" : originalDist < userDist ? "red" : "blue";
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
      {props.userPose.map(([x, y], pointId) => {
        return (
          <text
            x={x}
            y={y}
            fontSize="3"
            style={{
              userSelect: "none",
            }}
          >
            {pointId}
          </text>
        );
      })}
      {props.userPose.map(([x, y], pointId) => {
        return (
          <Point
            key={pointId}
            x={x}
            y={y}
            pointId={pointId}
            onMouseDown={() => props.onEdit(pointId)}
            isEditing={props.editorState?.pointId === pointId}
            isSelected={props.selectedVertices.includes(pointId)}
          />
        );
      })}
    </>
  );
};

interface Props {
  problem: Problem;
  userPose: [number, number][];
  editorState: EditorState | null;
  onMouseUp: () => void;
  onLatticeTouch: (p: [number, number]) => void;
  onEdit: (pointId: number) => void;
  selectedVertices: number[];
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
      <UserPoseLayer
        problem={problem}
        userPose={props.userPose}
        editorState={props.editorState}
        onEdit={props.onEdit}
        selectedVertices={props.selectedVertices}
      />
    </svg>
  );
};
