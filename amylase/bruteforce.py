import json
import math
from argparse import ArgumentParser
from collections import defaultdict
from pathlib import Path
from functools import lru_cache
import random


def sub(p, q):
    # p - q
    return [p[0] - q[0], p[1] - q[1]]


def dot(p, q):
    return p[0] * q[0] + p[1] * q[1]


def cross(p, q):
    return p[0] * q[1] - p[1] * q[0]


def ccw(p, q, r):
    return cross(sub(q, p), sub(r, p))


def is_on_segment(segment, point):
    d1 = sub(segment[0], point)
    d2 = sub(segment[1], point)
    area = cross(d1, d2)
    if area == 0 and d1[0] * d2[0] <= 0 and d1[1] * d2[1] <= 0:
        return True
    return False


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
        if is_on_segment([hole[i], hole[j]], point):
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

    splitting_points = edge[:]
    for point in hole:
        if is_on_segment(edge, point):
            splitting_points.append(point)
    splitting_points.sort()

    double_hole = [[p[0] * 2, p[1] * 2] for p in hole]
    for sub_edge in zip(splitting_points[:-1], splitting_points[1:]):
        double_mid = [sub_edge[0][0] + sub_edge[1][0], sub_edge[0][1] + sub_edge[1][1]]
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


def solve(spec, report_result):
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
    random.shuffle(valid_positions)
    figure = spec["figure"]
    graph = defaultdict(list)
    for fr, to in figure["edges"]:
        graph[fr].append(to)
        graph[to].append(fr)
    vertex_ids = list(range(len(graph)))
    vertex_ids.sort(key=lambda vid: len(graph[vid]), reverse=True)
    vid2order = {}
    for o, vid in enumerate(vertex_ids):
        vid2order[vid] = o
    orig_positions = figure["vertices"]
    positions = []
    def dfs(i, best):
        if i >= len(orig_positions):
            result = dislike(spec["hole"], positions)
            if result < best:
                best = result
                reconstructed_positions = [positions[vid2order[vid]] for vid in range(len(positions))]
                report_result(best, reconstructed_positions)
            return best

        vid = vertex_ids[i]
        for p in valid_positions:
            valid = True
            for j in graph[vid]:
                if vid2order[j] >= i:
                    continue
                if not is_valid_edge(orig_positions[vid], orig_positions[j], p, positions[vid2order[j]], spec["epsilon"]):
                    valid = False
                    break
                if not is_edge_inside(spec["hole"], [p, positions[vid2order[j]]]):
                    valid = False
                    break
            if not valid:
                continue
            positions.append(p)
            best = dfs(i + 1, best)
            positions.pop()
        return best
    dfs(0, 10 ** 18)


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
    output_dir = Path("../solutions/amylase-bruteforce/")
    output_dir.mkdir(parents=True, exist_ok=True)
    from multiprocessing import Pool
    pool = Pool(processes=7)

    args = []
    for problem_id in [41, 49, 51, 57, 58, 2, 4, 5, 9, 10]:
        input_path = f"../problems/{problem_id}.json"
        output_path = str(output_dir / f"{problem_id}.json")
        args.append((input_path, output_path))
    pool.map(_main, args)
