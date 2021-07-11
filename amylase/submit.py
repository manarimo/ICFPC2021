import requests
from amylase.package_solutions import main as select_solutions
from amylase.package_solutions import MAX_PROBLEM_ID


def main():
    selected_solutions = select_solutions()
    for problem_id in range(1, MAX_PROBLEM_ID + 1):
        solution = selected_solutions.get(problem_id)
        if solution is None:
            solution_name = "None"
            score = "None"
        else:
            solution_name = solution["output_path"].parent.name
            score = solution['verdict']['score']
        print(f"{problem_id:03}: {solution_name} ({score})")

    # return  # for dry run.
    for problem_id, solution in selected_solutions.items():
        print(f"submitting {problem_id}")
        headers = {'Authorization': 'Bearer 78145a42-91f5-4559-af81-3b0990463771'}
        response = requests.post(f"https://poses.live/api/problems/{problem_id}/solutions", headers=headers, json=solution["solution"])
        print(response.text)


if __name__ == '__main__':
    main()