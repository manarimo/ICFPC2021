import { pairToPoint, Problem } from "../utils";
import { d } from "../tslib/amyfunc";
import { Table } from "react-bootstrap";

const calcEdgeCost = (problem: Problem, pose: [number, number][]) => {
  const eps = problem.epsilon;
  const figure = problem.figure;
  return figure.edges.map(([from, to]) => {
    const vi1 = pairToPoint(figure.vertices[from]);
    const vj1 = pairToPoint(figure.vertices[to]);
    const d1 = d(vi1, vj1);

    const vi2 = pairToPoint(pose[from]);
    const vj2 = pairToPoint(pose[to]);
    const d2 = d(vi2, vj2);
    const cost =
      (Math.abs(d1 - d2) * 1_000_000) / eps / d1 / figure.edges.length;
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
  const edges = calcEdgeCost(problem, pose);
  edges.sort((e1, e2) => e2.cost - e1.cost);

  let costSum = 0.0;
  edges.forEach((e) => {
    costSum += e.cost;
  });
  return (
    <>
      <Table size="sm">
        <tbody>
          <tr>
            <th>GLOBALIST Budget 使用率</th>
            <td style={costSum > 1 ? { color: "red" } : {}}>
              {(costSum * 100).toFixed(2)}%
            </td>
          </tr>
        </tbody>
      </Table>
      <Table size="sm">
        <thead>
          <tr>
            <th>辺</th>
            <th>Budget使用率</th>
          </tr>
        </thead>
        <tbody>
          {edges
            .filter((e) => e.cost > 0)
            .map((e) => {
              const key = `${e.from}-${e.to}`;
              return (
                <tr key={key}>
                  <td>{`(${e.from}, ${e.to})`}</td>
                  <td>{(e.cost * 100).toFixed(2)}%</td>
                </tr>
              );
            })}
        </tbody>
      </Table>
    </>
  );
};
