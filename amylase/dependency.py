import json
from collections import defaultdict
from pathlib import Path


def main():
    graph = defaultdict(list)
    for problem_file in Path("../problems").iterdir():
        if not problem_file.name.endswith(".json"):
            continue
        problem_id = problem_file.name.replace(".json", "")
        fr = int(problem_id)
        with problem_file.open() as f:
            spec = json.load(f)
        for bonus in spec["bonuses"]:
            to = bonus["problem"]
            label = bonus["bonus"]
            print(", ".join([str(fr), str(to), label]))
            graph[fr - 1].append(to - 1)
    vis = [False] * len(graph)
    for pos in range(len(graph)):
        if vis[pos]:
            continue
        path = []
        while not vis[pos]:
            path.append(pos + 1)
            vis[pos] = True
            if not graph[pos]:
                break
            pos = graph[pos][0]
        print(" -> ".join(map(str, path)))


if __name__ == '__main__':
    main()