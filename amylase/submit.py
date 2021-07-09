import json

from pathlib import Path
import requests


def main():
    bests = {}
    with open("../problems/minimal_dislikes.txt") as f:
        minimal_dislikes = json.load(f)
        global_bests = {d["problem_id"]: d["minimal_dislikes"] for d in minimal_dislikes}
    for solution_dir in Path("../solutions").iterdir():
        solution_name = solution_dir.name
        for problem_id in range(1, 60):
            solution_file = solution_dir / f"{problem_id}.json"
            verdict_file = solution_dir / f"{problem_id}_verdict.json"
            if not solution_file.exists() or not verdict_file.exists():
                continue
            with solution_file.open() as f:
                pose = json.load(f)
            with verdict_file.open() as f:
                verdict = json.load(f)
            if not verdict["isValid"]:
                continue
            score = verdict["score"]
            tup = score, solution_name, pose
            if problem_id not in bests:
                bests[problem_id] = tup
            bests[problem_id] = min(bests[problem_id], tup)
    for problem_id in range(1, 60):
        if problem_id in bests:
            print(f"{problem_id}: global: {global_bests[problem_id]}, ours: {bests[problem_id][0]}")
            headers = {'Authorization': 'Bearer 78145a42-91f5-4559-af81-3b0990463771'}
            response = requests.post(f"https://poses.live/api/problems/{problem_id}/solutions", headers=headers, json=bests[problem_id][2])
            print(response.text)
        else:
            print(f"{problem_id}: global: {global_bests[problem_id]}, ours: None")


if __name__ == '__main__':
    main()