from pathlib import Path
import json
from amylase.bruteforce import dislike, is_point_inside, is_edge_inside, is_valid_edge
from collections import defaultdict
import random
from multiprocessing import Pool


def optimize(spec, pose):
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
    node_n = len(figure["vertices"])
    distances = [[node_n for _ in figure["vertices"]] for _ in figure["vertices"]]
    for fr, to in figure["edges"]:
        graph[fr].append(to)
        graph[to].append(fr)
        distances[fr][to] = 1
        distances[to][fr] = 1
    for i in range(node_n):
        distances[i][i] = 0

    for k in range(node_n):
        for i in range(node_n):
            for j in range(node_n):
                distances[i][j] = min(distances[i][j], distances[i][k] + distances[k][j])

    def sample_subgraph():
        root = random.choice(range(len(figure["vertices"])))
        size = random.choice(range(1, min(4, node_n)))
        scored_vertices = [(distances[root][i] + random.random(), i) for i in range(node_n)]
        scored_vertices.sort()
        return {i for p, i in scored_vertices[:size]}

    global_best = dislike(spec["hole"], pose["vertices"]), pose["vertices"]
    for _ in range(3):
        orig_positions = global_best[1]
        subgraph = sample_subgraph()

        positions = []
        def dfs(i):
            if i >= len(orig_positions):
                score = dislike(spec["hole"], positions)
                return score, positions[:]

            candidates = valid_positions if i in subgraph else [orig_positions[i]]
            best = 10 ** 18, []
            for p in candidates:
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
        global_best = min(dfs(0), global_best)
    return {"vertices": global_best[1]}


def run_optimize(args):
    solution_name, problem_id, spec, pose = args
    prev_score = dislike(spec["hole"], pose["vertices"])
    if prev_score == 0:
        return pose
    print(f"problem id: {problem_id}, solution name: {solution_name}, current score: {prev_score}")
    optimized_pose = optimize(spec, pose)
    optimized_score = dislike(spec["hole"], optimized_pose["vertices"])
    print(f"problem id: {problem_id}, solution name: {solution_name}, score: {optimized_score} (improvement: {prev_score - optimized_score})")
    return optimized_pose


def main():
    args_list = []
    existing_best = {}
    for solution_dir in Path("../solutions").iterdir():
        solution_name = solution_dir.name
        for solution_file in solution_dir.iterdir():
            if not solution_file.name.endswith(".json"):
                continue
            if "verdict" in solution_file.name:
                continue
            with solution_file.open() as f:
                pose = json.load(f)
            problem_id = solution_file.name.replace(".json", "")
            with open(f"../problems/{problem_id}.json") as f:
                spec = json.load(f)
            args_list.append((solution_name, problem_id, spec, pose))
            existing_score = dislike(spec["hole"], pose["vertices"])
            if problem_id not in existing_best:
                existing_best[problem_id] = existing_score
            existing_best[problem_id] = min(existing_best[problem_id], existing_score)

    def args_filter(args):
        solution_name, problem_id, spec, pose = args
        score = dislike(spec["hole"], pose["vertices"])
        return score <= existing_best[problem_id] and int(problem_id) <= 1

    args_list = list(filter(args_filter, args_list))
    pool = Pool(processes=7)
    results = pool.map(run_optimize, args_list)
    best_poses = {}
    for (solution_name, problem_id, spec, pose), optimized_pose in zip(args_list, results):
        score = dislike(spec["hole"], optimized_pose["vertices"])
        if score >= existing_best[problem_id]:
            continue
        if problem_id not in best_poses:
            best_poses[problem_id] = score, optimized_pose
        best_poses[problem_id] = min(best_poses[problem_id], (score, optimized_pose))
    for problem_id, (score, optimized_pose) in best_poses.items():
        print(f"problem_id: {problem_id}, optimized score: {score} (improbement: {existing_best[problem_id] - score})")
        with open(f"../solutions/amylase-postprocess/{problem_id}.json", "w") as f:
            json.dump(optimized_pose, f)


if __name__ == '__main__':
    main()