import json

from amylase.bruteforce import is_point_inside, is_edge_inside
from pathlib import Path


def run_tests(func, testcase_dir):
    passed, failed = [], []
    for case_file in Path(testcase_dir).iterdir():
        if not case_file.name.endswith(".json"):
            continue
        with case_file.open() as f:
            test_case = json.load(f)
        actual = func(**test_case["args"])
        expected = test_case["expected"]
        if actual == expected:
            passed.append(case_file)
        else:
            failed.append(case_file)
    if not failed:
        print(f"passed all {len(passed)} test cases.")
    else:
        print(f"failed some tests")
        for failed_path in failed:
            print(failed_path)


def main():
    print("testing is_point_inside")
    run_tests(is_point_inside, "testcases/is_point_inside")
    print("testing is_edge_inside")
    run_tests(is_edge_inside, "testcases/is_edge_inside")


if __name__ == '__main__':
    main()