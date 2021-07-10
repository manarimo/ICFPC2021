from amylase.bruteforce import is_point_inside, dislike, is_edge_inside, is_valid_edge
from collections import defaultdict
from pathlib import Path
import json
import itertools


def solve(spec, report_result):
    hole = spec["hole"]
    figure = spec["figure"]
    edges = figure["edges"]
    nodes = figure["vertices"]
    if len(hole) > len(nodes):
        return
    xs, ys = [], []
    for v in hole:
        xs.append(v[0])
        ys.append(v[1])
    min_x = min(xs)
    max_x = max(xs)
    min_y = min(ys)
    max_y = max(ys)
    valid_positions = []
    for x in range(min_x, max_x + 1):
        for y in range(min_y, max_y + 1):
            if is_point_inside(hole, [x, y]):
                valid_positions.append([x, y])
    graph = defaultdict(list)
    for fr, to in edges:
        graph[fr].append(to)
        graph[to].append(fr)

    # def fact(n): return 1 if n <= 1 else fact(n - 1) * n
    # perms = fact(len(nodes)) // fact(len(nodes) - len(nodes))
    # if perms >= 10 ** 11:
    #     return
    for assigned in itertools.permutations(range(len(nodes)), len(hole)):
        assignments = {assigned_node: [hole[hole_node]] for hole_node, assigned_node in enumerate(assigned)}
        valid = True
        for i, j in itertools.combinations(assignments.keys(), 2):
            if j not in graph[i]:
                continue
            valid &= is_valid_edge(nodes[i], nodes[j], assignments[i][0], assignments[j][0], spec["epsilon"])
        if not valid:
            continue
        positions = []
        def dfs(i):
            if i >= len(nodes):
                score = dislike(hole, positions)
                return score, positions[:]
            candidate_positions = assignments.get(i, valid_positions)
            for p in candidate_positions:
                valid = True
                for j in graph[i]:
                    if j >= i and j not in assignments:
                        continue
                    if j in assignments:
                        j_position = assignments[j][0]
                    else:
                        j_position = positions[j]
                    if not is_valid_edge(nodes[i], nodes[j], p, j_position, spec["epsilon"]):
                        valid = False
                        break
                    if not is_edge_inside(hole, [p, j_position]):
                        valid = False
                        break
                if not valid:
                    continue
                positions.append(p)
                result = dfs(i + 1)
                if result is not None:
                    return result
                positions.pop()
            return None
        result = dfs(0)
        if result is not None:
            report_result(*result)
            return


def main(input_path, output_path):
    print(f"start: {input_path} -> {output_path}")
    with open(input_path) as f:
        spec = json.load(f)
    def report_result(score, pose):
        print(f"{input_path} dislike: {score}")
        with open(output_path, "w") as f:
            json.dump({"vertices": pose}, f)
    solve(spec, report_result)
    print(f"end: {input_path} -> {output_path}")


def _main(args):
    main(*args)


if __name__ == '__main__':
    output_dir = Path("../solutions/amylase-manten/")
    output_dir.mkdir(parents=True, exist_ok=True)
    from multiprocessing import Pool
    pool = Pool(processes=7)

    args = []
    # for problem_id in range(11, 20):
    for problem_id in [4, 53, 55, 59, 63, 65, 67, 70, 72, 77]:
        input_path = f"../problems/{problem_id}.json"
        output_path = str(output_dir / f"{problem_id}.json")
        args.append((input_path, output_path))
    pool.map(_main, args)
