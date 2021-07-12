import requests
from amylase.package_solutions import main as select_solutions


def main():
    selected_solutions = select_solutions()
    for problem_id, solution in selected_solutions.items():
        print(f"submitting {problem_id}")
        headers = {'Authorization': 'Bearer 78145a42-91f5-4559-af81-3b0990463771'}
        response = requests.post(f"https://poses.live/api/problems/{problem_id}/solutions", headers=headers, json=solution["solution"])
        print(response.text)


if __name__ == '__main__':
    main()