import itertools
import json
import math
from collections import defaultdict

import pulp
from pathlib import Path
import shutil


MAX_PROBLEM_ID = 132


def load_solutions():
    base_directory = Path("../")
    solutions = []
    problems = {}
    problem_dir = base_directory / "problems"
    for problem_id in range(1, MAX_PROBLEM_ID + 1):
        with (problem_dir / f"{problem_id}.json").open() as f:
            problems[problem_id] = json.load(f)
    for solution_dir in (base_directory / "solutions").iterdir():
        for problem_id in range(1, MAX_PROBLEM_ID + 1):
            solution_file = solution_dir / f"{problem_id}.json"
            verdict_file = solution_dir / f"{problem_id}_verdict.json"
            if not solution_file.exists() or not verdict_file.exists():
                continue
            with solution_file.open() as f:
                solution = json.load(f)
            with verdict_file.open() as f:
                verdict = json.load(f)
            solutions.append({
                "problem_id": problem_id,
                "problem": problems[problem_id],
                "solution": solution,
                "verdict": verdict,
                "solver_name": solution_dir.name,
            })
    return solutions


def is_qualified(solution, minimal_dislikes, hide_betters):
    if not solution["verdict"]["isValid"]:
        return False
    if hide_betters and solution["verdict"]["score"] < minimal_dislikes[solution["problem_id"]]:
        print(f"excluding {solution['solver_name']}/{solution['problem_id']} because it is too good to share with rivals.")
        return False
    return True


def _calc_score(n_vertices, n_edges, n_hole, best_dislike, team_dislike):
    return math.ceil(1000 * math.log(n_vertices * n_edges * n_hole / 6, 2) * math.sqrt((best_dislike + 1) / (team_dislike + 1)))


def evaluate_score(solution, minimal_dislikes):
    team_dislike = solution["verdict"]["score"]
    best_dislike = minimal_dislikes[solution["problem_id"]]
    n_vertices = len(solution["problem"]["figure"]["vertices"])
    n_edges = len(solution["problem"]["figure"]["edges"])
    n_hole = len(solution["problem"]["hole"])
    if team_dislike >= best_dislike:
        return _calc_score(n_vertices, n_edges, n_hole, best_dislike, team_dislike)
    else:
        max_score = _calc_score(n_vertices, n_edges, n_hole, team_dislike, team_dislike)
        rival_score = _calc_score(n_vertices, n_edges, n_hole, team_dislike, best_dislike)
        return max_score + (max_score - rival_score)


def main(hide_betters: bool = False):
    submission_dir = Path("../solutions/_best_submission/")
    if submission_dir.exists():
        shutil.rmtree(submission_dir)

    solutions = load_solutions()
    print(f"loaded {len(solutions)} solutions")
    with open("../problems/minimal_dislikes.txt") as f:
        minimal_dislikes = {obj["problem_id"]: obj["minimal_dislikes"] for obj in json.load(f)}
    solutions = [solution for solution in solutions if is_qualified(solution, minimal_dislikes, hide_betters)]
    print(f"{len(solutions)} qualified solutions")

    model = pulp.LpProblem(sense=pulp.LpMaximize)
    n = len(solutions)
    variables = [pulp.LpVariable(f"use_{i}", lowBound=0, upBound=1, cat=pulp.LpBinary) for i in range(n)]
    solution_ids_by_problem = defaultdict(list)
    for solution_id, solution in enumerate(solutions):
        solution_ids_by_problem[solution["problem_id"]].append(solution_id)
    # objective
    objective = 0
    for solution_id, solution in enumerate(solutions):
        objective += evaluate_score(solution, minimal_dislikes) * variables[solution_id]
    model += objective
    # one solution per one problem
    for solution_ids in solution_ids_by_problem.values():
        constraint = 0
        for solution_id in solution_ids:
            constraint += variables[solution_id]
        model += constraint <= 1
    # bonus constraints
    bonus_providers = defaultdict(list)
    for solution_id, solution in enumerate(solutions):
        for bonus in solution["verdict"]["bonusObtained"]:
            bonus_providers[(bonus["problem"], bonus["bonus"])].append(solution_id)
    for solution_id, solution in enumerate(solutions):
        for bonus in solution["solution"].get("bonuses", []):
            bonus_type = bonus["bonus"]
            provider_ids = bonus_providers[(solution["problem_id"], bonus_type)]
            constraint = 1 - variables[solution_id]
            for provider_id in provider_ids:
                constraint += variables[provider_id]
            model += constraint >= 1
    model.solve()

    selected_solutions = {}
    for solution_id, variable in enumerate(variables):
        if round(pulp.value(variable)):
            solution = solutions[solution_id]
            selected_solutions[solution["problem_id"]] = solution

    # bonus verification/postprocessing
    for problem_id, solution in selected_solutions.items():
        for using_bonus in solution["solution"].get("bonuses", []):
            ok = True
            if using_bonus.get("problem", -1) not in selected_solutions:
                ok = False
            else:
                found = False
                for provided_bonus in selected_solutions[using_bonus["problem"]]["verdict"]["bonusObtained"]:
                    if provided_bonus["bonus"] == using_bonus["bonus"] and provided_bonus["problem"] == problem_id:
                        found = True
                if not found:
                    ok = False
            if ok:
                continue
            print(f"bonus validation failed for problem_id: {problem_id} (solver: {solution['solver_name']}). searching for other available choices.")
            found_id = None
            for provider_id, provider_solution in selected_solutions.items():
                for provided_bonus in provider_solution["verdict"]["bonusObtained"]:
                    if provided_bonus["bonus"] == using_bonus["bonus"] and provided_bonus["problem"] == problem_id:
                        found_id = provider_id
            if found_id is None:
                print("!!! No bonus providers found. This submission will be invalid.")
            else:
                print(f"using problem_id: {found_id} as a bonus provider for problem_id: {problem_id} (solver: {solution['solver_name']})")
                using_bonus["problem"] = found_id

    submission_dir.mkdir(parents=True)

    with open("../web/_submission_report.txt", "w") as report_f:
        def _print(*args):
            print(*args)
            print(*args, file=report_f)
        _print(f"objective: {pulp.value(model.objective)}")
        _print("")
        for problem_id in range(1, MAX_PROBLEM_ID + 1):
            solution = selected_solutions.get(problem_id)
            if solution is None:
                solution_name = "None"
                score = "None"
            else:
                solution_name = solution["solver_name"]
                score = solution['verdict']['score']
                with (submission_dir / f"{solution['problem_id']}.json").open("w") as f:
                    json.dump(solution["solution"], f)
            _print(f"{problem_id:03}: {solution_name} (dislike: {score})")
    return selected_solutions


if __name__ == '__main__':
    main()