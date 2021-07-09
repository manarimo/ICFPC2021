import math
from pathlib import Path
import json


def main():
    header = ["name", "hole_vs", "fig_es", "fig_vs", "eps", "max_score"]
    print(", ".join(header))
    for file in Path("../problems").iterdir():
        if not file.name.endswith(".json"):
            continue
        with file.open() as f:
            spec = json.load(f)
        data = [file.name, len(spec["hole"]), len(spec["figure"]["edges"]), len(spec["figure"]["vertices"]), spec["epsilon"]]
        ub = math.ceil(1000 * math.log(len(spec["hole"]) * len(spec["figure"]["vertices"]) * len(spec["figure"]["edges"]) / 6, 2))
        data.append(ub)
        print(", ".join(map(str, data)))


if __name__ == '__main__':
    main()