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


def is_inside(hole, point):
    areas = []
    for i in range(len(hole)):
        j = (i + 1) % len(hole)
        areas.append(cross(sub(hole[i], point), sub(hole[j], point)))
    for area in areas:
        if area != 0:
            sig = area
    for area in areas:
        if area * sig < 0:
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
            if is_inside(spec["hole"], [x, y]):
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
    for problem_id in [11, 12, 13, 15]:
        print(f"problem_id: {problem_id}")
        input_path = f"../problems/{problem_id}.json"
        output_path = str(output_dir / f"{problem_id}.json")
        main(input_path, output_path)
