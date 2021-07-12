from pathlib import Path
import json
import itertools
from amylase.bruteforce import solve


def _load_hint(problem_id: int, spec):
    with Path(f"../solutions/_best_submission_for_seed/{problem_id}.json").open() as f:
        best_pose = json.load(f)
    hole_tuple = set(tuple(p) for p in spec["hole"])
    hint = {}
    for vid, vertex in enumerate(best_pose["vertices"]):
        if tuple(vertex) in hole_tuple:
            hint[vid] = [vertex]
    return hint


def main(input_path, output_path, use_hint):
    try:
        with open(input_path) as f:
            spec = json.load(f)
        bonuses = [bonus for bonus in spec["bonuses"] if bonus["bonus"] == "GLOBALIST"]
        vertices = spec["figure"]["vertices"]
        if use_hint:
            base_hint = _load_hint(int(input_path.split("/")[-1].replace(".json", "")), spec)
        else:
            base_hint = {}
        if len(vertices) < len(bonuses):
            print(f"{input_path}: not enough vertices")
            return
        if len(bonuses) == 0:
            print(f"{input_path}: no globalist bonus")
            return

        best = 10 ** 18
        print(f"start: {input_path} -> {output_path}")
        for assignment in itertools.permutations(range(len(vertices)), len(bonuses)):
            hint = {}
            hint.update(base_hint)
            hint.update({vid: [bonus["position"]] for vid, bonus in zip(assignment, bonuses)})
            def report_result(score, pose):
                print(f"{input_path} dislike: {score}")
                with open(output_path, "w") as f:
                    json.dump({"vertices": pose}, f)
            best = solve(spec, hint, report_result, best, skip=1)
    except Exception as e:
        print(e)
    finally:
        print(f"end: {input_path} -> {output_path}")


def _main(args):
    main(*args)


def run_all(hint):
    output_dir = Path("../solutions/amylase-get-globalist-hint/" if hint else "../solutions/amylase-get-globalist/")
    output_dir.mkdir(parents=True, exist_ok=True)
    from pebble import ProcessPool
    import multiprocessing
    with ProcessPool(max_workers=multiprocessing.cpu_count() - 1) as pool:
        args = []
        for problem_id in range(1, 133):
            input_path = f"../problems/{problem_id}.json"
            output_path = str(output_dir / f"{problem_id}.json")
            args.append((input_path, output_path, hint))
        pool.map(_main, args, chunksize=1, timeout=60)


if __name__ == '__main__':
    run_all(False)
    run_all(True)
