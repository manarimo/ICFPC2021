import { BONUSTYPE, Figure, Problem } from "../utils";
import React from "react";
import { EditorState } from "./EditorState";
import { absoluteBigInt, sqDistance } from "../calcUtils";

export const getBonusColor = (bonusType: BONUSTYPE) => {
  switch (bonusType) {
    case "GLOBALIST":
      return "yellow";
    case "BREAK_A_LEG":
      return "blue";
    case "WALLHACK":
      return "orange";
    default:
      // bug
      return "white";
  }
};

interface PointProps {
  x: number;
  y: number;
  pointId: number;
  isEditing: boolean;
  isSelected: boolean;
  isBrokenCenter: boolean;
  onMouseDown: () => void;
}
const Point = (props: PointProps) => {
  const { x, y, pointId, isEditing, isSelected, isBrokenCenter } = props;
  const color = isEditing
    ? "blue"
    : isSelected
    ? "#0FF"
    : isBrokenCenter
    ? "white"
    : "black";
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
  userFigure: Figure;
  onEdit: (pointId: number) => void;
  editorState: EditorState | null;
  selectedVertices: number[];
}) => {
  const epsilon = BigInt(props.problem.epsilon);
  const originalVertices = props.problem.figure.vertices;
  const isOnHole = ([x, y]: [number, number]) => {
    return !!props.problem.hole.find(([ox, oy]) => ox === x && oy === y);
  };
  const isLegBroken =
    props.userFigure.vertices.length > props.problem.figure.vertices.length;
  const brokenPointId = props.problem.figure.vertices.length;
  const brokenLegs = props.userFigure.edges.filter(
    ([i, j]) => i === brokenPointId || j === brokenPointId
  );
  const isBrokenLeg = ([i, j]: [number, number]) => {
    const brokenI = brokenLegs[0][0] + brokenLegs[0][1] - brokenPointId;
    const brokenJ = brokenLegs[1][0] + brokenLegs[1][1] - brokenPointId;
    return (
      Math.min(i, j) === Math.min(brokenI, brokenJ) &&
      Math.max(i, j) === Math.max(brokenI, brokenJ)
    );
  };
  const getOriginalLeg = () => {
    const i = brokenLegs[0][0] + brokenLegs[0][1] - brokenPointId;
    const j = brokenLegs[1][0] + brokenLegs[1][1] - brokenPointId;
    return [i, j];
  };
  return (
    <>
      {props.problem.hole.map(([x, y], idx) => {
        return <circle key={idx} cx={x} cy={y} r="0.7" fill="#F0F" />;
      })}
      {props.problem.bonuses.map((bonus, idx) => {
        const [x, y] = bonus.position;
        const color = getBonusColor(bonus.bonus);
        return <circle key={idx} cx={x} cy={y} r="0.7" fill={color} />;
      })}
      {props.problem.figure.edges
        .filter(([i, j]) => !isLegBroken || !isBrokenLeg([i, j]))
        .map(([i, j]) => {
          const piOriginal = originalVertices[i];
          const pjOriginal = originalVertices[j];
          const originalDist = sqDistance(piOriginal, pjOriginal);

          const pi = props.userFigure.vertices[i];
          const pj = props.userFigure.vertices[j];
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
      {brokenLegs.map(([a, b]) => {
        const i = a + b - brokenPointId;
        const k = brokenPointId;
        const originalLeg = getOriginalLeg();
        const j = originalLeg[0] + originalLeg[1] - i;

        const piOriginal = originalVertices[i];
        const pjOriginal = originalVertices[j];
        const originalDist = sqDistance(piOriginal, pjOriginal);

        const pi = props.userFigure.vertices[i];
        const pk = props.userFigure.vertices[k];
        const userDist = sqDistance(pi, pk);

        const difference = absoluteBigInt(BigInt(4) * userDist - originalDist);

        // difference/originalDist <= epsilon/1_000_000
        const ok = difference * BigInt(1_000_000) <= epsilon * originalDist;
        const color = ok
          ? "green"
          : originalDist < BigInt(4) * userDist
          ? "red"
          : "blue";
        const strokeWidth = ok ? "0.3" : "0.5";

        const key = `${i}-${j}`;
        return (
          <line
            key={key}
            x1={pi[0]}
            y1={pi[1]}
            x2={pk[0]}
            y2={pk[1]}
            stroke={color}
            strokeWidth={strokeWidth}
          />
        );
      })}
      {props.userFigure.vertices.map(([x, y], pointId) => {
        return (
          <text
            key={pointId}
            x={x}
            y={y}
            fontSize="3"
            style={{
              userSelect: "none",
            }}
            fill={isOnHole([x, y]) ? "green" : "black"}
          >
            {pointId}
          </text>
        );
      })}
      {props.userFigure.vertices.map(([x, y], pointId) => {
        return (
          <Point
            key={pointId}
            x={x}
            y={y}
            pointId={pointId}
            onMouseDown={() => props.onEdit(pointId)}
            isBrokenCenter={isLegBroken && brokenPointId === pointId}
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
  userFigure: Figure;
  editorState: EditorState | null;
  onMouseUp: () => void;
  onLatticeTouch: (p: [number, number]) => void;
  onEdit: (pointId: number) => void;
  selectedVertices: number[];
  forcedWidth?: number;
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
      style={props.forcedWidth ? { width: props.forcedWidth } : {}}
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
        userFigure={props.userFigure}
        editorState={props.editorState}
        onEdit={props.onEdit}
        selectedVertices={props.selectedVertices}
      />
    </svg>
  );
};
