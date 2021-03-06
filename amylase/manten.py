import math
import random

from amylase.bruteforce import is_point_inside, dislike, is_edge_inside, is_valid_edge, d
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
    skip = 2
    for x in range(min_x, max_x + 1, step=skip):
        for y in range(min_y, max_y + 1, step=skip):
            if is_point_inside(hole, [x, y]):
                valid_positions.append([x, y])
    graph = defaultdict(list)
    for fr, to in edges:
        graph[fr].append(to)
        graph[to].append(fr)
    distance_inf = (max_x - min_x) + (max_y - min_y)
    distance_upperbounds = [[distance_inf for _ in nodes] for _ in nodes]
    for i in range(len(nodes)):
        distance_upperbounds[i][i] = 0
    for fr, tos in graph.items():
        for to in tos:
            distance_upperbounds[fr][to] = ((1 + spec["epsilon"] / 1_000_000) * d(nodes[fr], nodes[to])) ** 0.5
    for k in range(len(nodes)):
        for i in range(len(nodes)):
            for j in range(len(nodes)):
                distance_upperbounds[i][j] = min(distance_upperbounds[i][j], distance_upperbounds[i][k] + distance_upperbounds[k][j])

    positions = []
    def dfs(i, hints, best):
        if i >= len(nodes):
            score = dislike(hole, positions)
            if score < best:
                report_result(score, positions)
            return min(score, best)
        candidate_positions = [hints[i]] if i in hints else valid_positions
        for p in candidate_positions:
            valid = True
            for j in range(len(nodes)):
                if j >= i and j not in hints:
                    continue
                if j in hints:
                    j_position = hints[j]
                else:
                    j_position = positions[j]
                if j in graph[i]:
                    if not is_valid_edge(nodes[i], nodes[j], p, j_position, spec["epsilon"]):
                        valid = False
                        break
                else:
                    if d(p, j_position) > math.ceil(distance_upperbounds[i][j] ** 2):
                        valid = False
                        break
                if not is_edge_inside(hole, [p, j_position]):
                    valid = False
                    break
            if not valid:
                continue
            positions.append(p)
            best = min(dfs(i + 1, hints, best), best)
            if best == 0: return best
            positions.pop()
        return best

    assignments = []
    def hint_dfs(i, best):
        hints = {i: hole[assignment] for i, assignment in enumerate(assignments) if assignment != -1}
        if len(hole) - len(hints) > len(nodes) - i:
            return best
        if i >= len(nodes):
            positions.clear()
            return dfs(0, hints, best)
        used = set(assignments) - {-1}
        candidate = [assign for assign in range(len(hole)) if assign not in used] + [-1]
        random.shuffle(candidate)
        for assignment in candidate:
            valid = True
            if assignment != -1:
                for j in range(len(nodes)):
                    if j >= i:
                        continue
                    if j not in hints:
                        continue
                    if j in graph[i]:
                        if not is_valid_edge(nodes[i], nodes[j], hole[assignment], hints[j], spec["epsilon"]):
                            valid = False
                            break
                    else:
                        if d(hole[assignment], hints[j]) > math.ceil(distance_upperbounds[i][j] ** 2):
                            valid = False
                            break
                    if not is_edge_inside(hole, [hole[assignment], hints[j]]):
                        valid = False
                        break
            if not valid:
                continue
            assignments.append(assignment)
            best = hint_dfs(i + 1, best)
            if best == 0: return best
            assignments.pop()
        return best
    hint_dfs(0, 10 ** 18)


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
    for problem_id in [10, 64, 72, 73, 77]:
        input_path = f"../problems/{problem_id}.json"
        output_path = str(output_dir / f"{problem_id}.json")
        args.append((input_path, output_path))
    pool.map(_main, args)
