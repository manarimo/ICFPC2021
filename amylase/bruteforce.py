import json
import math
from argparse import ArgumentParser
from collections import defaultdict
from pathlib import Path


def sub(p, q):
    # p - q
    return [p[0] - q[0], p[1] - q[1]]


def dot(p, q):
    return p[0] * q[0] + p[1] * q[1]


def cross(p, q):
    return p[0] * q[1] - p[1] * q[0]


def ccw(p, q, r):
    return cross(sub(q, p), sub(r, p))


def is_point_inside(hole, point):
    xs = []
    for x, y in hole:
        xs.append(x)
    max_x = max(xs)
    min_x = min(xs)
    outer = [max_x + (max_x - min_x) * 2 + 1, point[1] + 1]

    crossings = 0
    for i in range(len(hole)):
        j = (i + 1) % len(hole)
        d1 = sub(hole[i], point)
        d2 = sub(hole[j], point)
        area = cross(d1, d2)
        if area != 0:
            continue
        if d1[0] * d2[0] <= 0 and d1[1] * d2[1] <= 0:
            # on this edge.
            return True
        if ccw(point, outer, hole[i]) * ccw(point, outer, hole[j]) < 0 and ccw(hole[i], hole[j], point) * ccw(hole[i], hole[j], outer) < 0:
            crossings += 1
    return crossings % 2 == 1


def is_edge_inside(hole, edge):
    for point in edge:
        if not is_point_inside(hole, point):
            return False
    for i in range(len(hole)):
        j = (i + 1) % len(hole)
        if ccw(edge[0], edge[1], hole[i]) * ccw(edge[0], edge[1], hole[j]) < 0 and ccw(hole[i], hole[j], edge[0]) * ccw(hole[i], hole[j], edge[1]) < 0:
            return False
    double_mid = [edge[0][0] + edge[1][0], edge[0][1] + edge[1][1]]
    double_hole = [[p[0] * 2, p[1] * 2] for p in hole]
    if not is_point_inside(double_hole, double_mid):
        return False
    return True


def d(p, q):
    return (p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1])


def is_valid_edge(orig_p, orig_q, dest_p, dest_q, epsilon):
    orig_dist = d(orig_p, orig_q)
    dest_dist = d(dest_p, dest_q)
    return abs(dest_dist - orig_dist) * 1_000_000 <= epsilon * orig_dist


def dislike(hole, positions):
    ds = 0
    for h in hole:
        ds += min(d(h, p) for p in positions)
    return ds


def solve(spec):
    xs, ys = [], []
    for v in spec["hole"]:
        xs.append(v[0])
        ys.append(v[1])
    min_x = min(xs)
    max_x = max(xs)
    min_y = min(ys)
    max_y = max(ys)
    valid_positions = []
    for x in range(min_x, max_x + 1):
        for y in range(min_y, max_y + 1):
            if is_point_inside(spec["hole"], [x, y]):
                valid_positions.append([x, y])
    figure = spec["figure"]
    graph = defaultdict(list)
    for fr, to in figure["edges"]:
        graph[fr].append(to)
        graph[to].append(fr)

    orig_positions = figure["vertices"]
    positions = []
    def dfs(i):
        if i >= len(orig_positions):
            return dislike(spec["hole"], positions), positions[:]

        best = 10 ** 18, []
        for p in valid_positions:
            valid = True
            for j in graph[i]:
                if j >= i:
                    continue
                if not is_valid_edge(orig_positions[i], orig_positions[j], p, positions[j], spec["epsilon"]):
                    valid = False
                    break
                if not is_edge_inside(spec["hole"], [p, positions[j]]):
                    valid = False
                    break
            if not valid:
                continue
            positions.append(p)
            best = min(dfs(i + 1), best)
            positions.pop()
        return best
    return dfs(0)


def main(input_path, output_path):
    with open(input_path) as f:
        spec = json.load(f)
    score, pose = solve(spec)
    print(f"dislike: {score}")
    if score < 10 ** 18:
        with open(output_path, "w") as f:
            json.dump({"vertices": pose}, f)


if __name__ == '__main__':
    output_dir = Path("../solutions/amylase-bruteforce/")
    output_dir.mkdir(parents=True, exist_ok=True)
    for problem_id in [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]:
        print(f"problem_id: {problem_id}")
        input_path = f"../problems/{problem_id}.json"
        output_path = str(output_dir / f"{problem_id}.json")
        main(input_path, output_path)
