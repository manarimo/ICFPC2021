import { Figure, pairToPoint, Problem } from "../utils";
import { d } from "../tslib/amyfunc";
import { Table } from "react-bootstrap";

const calcEdgeCost = (figure: Figure, pose: [number, number][]) => {
  return figure.edges.map(([from, to]) => {
    const vi1 = pairToPoint(figure.vertices[from]);
    const vj1 = pairToPoint(figure.vertices[to]);
    const d1 = d(vi1, vj1);

    const vi2 = pairToPoint(pose[from]);
    const vj2 = pairToPoint(pose[to]);
    const d2 = d(vi2, vj2);
    const cost = Math.abs(d1 - d2) / d1;
    return {
      cost,
      from,
      to,
    };
  });
};

interface Props {
  problem: Problem;
  pose: [number, number][];
}

export const GlobalistTable = (props: Props) => {
  const { problem, pose } = props;
  const edges = calcEdgeCost(problem.figure, pose);
  edges.sort((e1, e2) => e2.cost - e1.cost);
  return (
    <Table>
      <thead>
        <tr>
          <th>辺</th>
          <th>コスト</th>
        </tr>
      </thead>
      <tbody>
        {edges.map((e) => {
          const key = `${e.from}-${e.to}`;
          return (
            <tr key={key}>
              <td>{`(${e.from}, ${e.to})`}</td>
              <td>{e.cost}</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};
