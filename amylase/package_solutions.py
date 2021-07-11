import itertools
import json
import math
from collections import defaultdict

import pulp
from pathlib import Path


MAX_PROBLEM_ID = 106


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
                "output_path": solution_file,
            })
    return solutions


def is_qualified(solution, minimal_dislikes):
    if not solution["verdict"]["isValid"]:
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


def main():
    solutions = load_solutions()
    print(f"loaded {len(solutions)} solutions")
    with open("../problems/minimal_dislikes.txt") as f:
        minimal_dislikes = {obj["problem_id"]: obj["minimal_dislikes"] for obj in json.load(f)}
    solutions = [solution for solution in solutions if is_qualified(solution, minimal_dislikes)]
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
        for sol_id1, sol_id2 in itertools.combinations(solution_ids, 2):
            model += variables[sol_id1] + variables[sol_id2] <= 1
    # bonus constraints
    bonus_providers = defaultdict(list)
    for solution_id, solution in enumerate(solutions):
        for bonus in solution["verdict"]["bonusObtained"]:
            bonus_providers[(solution["problem_id"], bonus["bonus"])].append(solution_id)
    for solution_id, solution in enumerate(solutions):
        for bonus in solution["solution"].get("bonuses", []):
            bonus_problem_id = bonus["problem"]
            bonus_type = bonus["bonus"]
            provider_ids = bonus_providers[(bonus_problem_id, bonus_type)]
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
    return selected_solutions


if __name__ == '__main__':
    main()