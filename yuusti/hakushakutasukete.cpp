#include <cstdio>
#include <cstdlib>
#include <cmath>
#include <vector>
#include <algorithm>
#include <fstream>
#include <iostream>
#include "problem.h"
#include "geo.h"

using namespace std;
using namespace manarimo;

problem_t problem;

int main() {
    load_problem(cin, problem);

    vector<P> hole = problem.hole;
    vector<E> edge = problem.figure.edges;
    vector<P> figure = problem.figure.vertices;
    number epsilon = problem.epsilon;

    // problem 90
    cout << problem.is_edge_inside(make_pair(593, 655), make_pair(610, 562)) << endl;

    for (int x = 593; x <= 610; ++x) {
        cout << "x: " << x << " " << problem.is_edge_inside(make_pair(593, 655), make_pair(x, 562)) << endl;
    }
    exit(0);
}