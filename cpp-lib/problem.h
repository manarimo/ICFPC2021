#ifndef ICFPC2021_PROBLEM_H
#define ICFPC2021_PROBLEM_H

#include "json.hpp"
#include "geo.h"
#include <vector>
#include <string>
#include <fstream>

namespace manarimo {
    using namespace std;
    using namespace geo;
    using json = nlohmann::json;
    using E = pair<int, int>;

    struct figure_t {
        vector<E> edges;
        vector<P> vertices;
    };

    struct problem {
        vector<P> hole;
        figure_t figure;
        number epsilon;
    };

    struct hint {
        vector<P> vertices;
    };

    void from_json(const json& j, P& p) {
        j.at(0).get_to(p.first);
        j.at(1).get_to(p.second);
    }

    void from_json(const json& j, E& e) {
        j.at(0).get_to(e.first);
        j.at(1).get_to(e.second);
    }

    void from_json(const json& j, figure_t& f) {
        j.at("edges").get_to(f.edges);
        j.at("vertices").get_to(f.vertices);
    }

    void from_json(const json& j, problem& p) {
        j.at("hole").get_to(p.hole);
        j.at("figure").get_to(p.figure);
        j.at("epsilon").get_to(p.epsilon);
    }

    void from_json(const json& j, hint& h) {
        j.at("vertices").get_to(h.vertices);
    }

    problem load_problem(const string &filename) {
        ifstream f(filename);
        return load_problem(filename);
    }

    problem load_problem(istream &f) {
        json j;
        f >> j;
        return j.get<problem>();
    }
};

#endif //ICFPC2021_PROBLEM_H
