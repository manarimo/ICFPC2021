import json
from pathlib import Path


def main():
    for problem_file in Path("../../problems").iterdir():
        if not problem_file.name.endswith(".json"):
            continue
        with problem_file.open() as f:
            spec = json.load(f)
        hole = spec["hole"]
        xs, ys = [], []
        for x, y in hole:
            xs.append(x)
            ys.append(y)
        outer = [max(xs) + 1, max(ys) + 1]
        problem_id = problem_file.name.replace(".json", "")
        for p_id, point in enumerate(hole):
            test_case = {
                "args": {
                    "hole": hole,
                    "point": point
                },
                "expected": True
            }
            with open(f"is_point_inside/gen_{problem_id}_{p_id}.json", "w") as f:
                json.dump(test_case, f)
            with open(f"is_edge_inside/gen_{problem_id}_{p_id}_outer.json", "w") as f:
                json.dump({
                    "args": {
                        "hole": hole,
                        "edge": [hole[p_id], outer]
                    },
                    "expected": False
                }, f)
        with open(f"is_point_inside/gen_{problem_id}_outer.json", "w") as f:
            json.dump({
                "args": {
                    "hole": hole,
                    "point": outer
                },
                "expected": False
            }, f)
        for e_id in range(len(hole)):
            n_id = (e_id + 1) % len(hole)
            test_case = {
                "args": {
                    "hole": hole,
                    "edge": [hole[e_id], hole[n_id]]
                },
                "expected": True
            }
            with open(f"is_edge_inside/gen_{problem_id}_{e_id}.json", "w") as f:
                json.dump(test_case, f)



if __name__ == '__main__':
    main()