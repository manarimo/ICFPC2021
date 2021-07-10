import * as fs from 'fs';
import * as path from 'path';
import {dislike, Edge, isEdgeInside, isValidEdge, Point, Polygon} from "../ts-lib/amyfunc";

enum BonusType {
    GLOBALIST = "GLOBALIST",
    BREAK_A_LEG = "BREAK_A_LEG"
}

interface Bonus {
    bonus: BonusType,
    problem: number,
    position: number[]
}

interface Problem {
    hole: Polygon;
    figure: {
        edges: number[][];
        vertices: Point[];
    };
    epsilon: number;
    bonuses: Bonus[];
}

interface Solution {
    vertices: Point[];
}

interface Verdict {
    isValid: boolean;
    score: number;
    bonusObtained: Bonus[];
    error?: any;
}

function loadProblems(): {[key: string]: Problem} {
    const problems: {[key: string]: Problem} = {};
    const files = fs.readdirSync(path.join(__dirname, '..', 'problems'));
    files.filter((f) => f.endsWith('.json')).forEach((file) => {
        const id = path.basename(file, '.json');
        const buffer = fs.readFileSync(`${__dirname}/../problems/${file}`, 'utf-8');
        const json = JSON.parse(buffer);
        problems[id] = {
            hole: json['hole'].map((a: number[]) => ({x: a[0], y: a[1]})),
            figure: {
                edges: json['figure']['edges'],
                vertices: json['figure']['vertices'].map((a: number[]) => ({x: a[0], y: a[1]}))
            },
            epsilon: json['epsilon'],
            bonuses: json['bonuses']
        };
    });
    return problems;
}

function loadSolution(file: string): Solution {
    const buffer = fs.readFileSync(file, 'utf-8');
    const solution = JSON.parse(buffer);
    return {
        vertices: solution['vertices'].map((a: number[]) => ({x: a[0], y: a[1]}))
    };
}

function isValidSolution(problem: Problem, solution: Solution): Verdict {
    for (let i = 0; i < problem.figure.edges.length; ++i) {
        const e = problem.figure.edges[i];
        const srcEdge = { src: problem.figure.vertices[e[0]], dst: problem.figure.vertices[e[1]] };
        const dstEdge = { src: solution.vertices[e[0]], dst: solution.vertices[e[1]] };
        if (!isValidEdge(srcEdge, dstEdge, problem['epsilon'])) {
            return {
                isValid: false,
                score: 0,
                bonusObtained: [],
                error: {
                    srcEdge,
                    dstEdge,
                    message: `Edge ${i} violates length constraint`,
                }
            };
        }
        if (!isEdgeInside(problem.hole, dstEdge)) {
            return {
                isValid: false,
                score: 0,
                bonusObtained: [],
                error: {
                    dstEdge,
                    message: `Edge ${i} is not in the hole`,
                },
            };
        }
    }
    const bonusObtained = [];
    for (const bonus of problem.bonuses) {
        if (solution.vertices.some(point => point.x === bonus.position[0] && point.y === bonus.position[1])) {
            bonusObtained.push(bonus);
        }
    }
    return {
        isValid: true,
        bonusObtained: bonusObtained,
        score: dislike(problem.hole, solution.vertices)
    };
}

const problems = loadProblems();
const solutionNames = fs.readdirSync(path.join(__dirname, '..', 'solutions'));
solutionNames.forEach((name) => {
    const baseDir = path.join(__dirname, '..', 'solutions', name);
    fs.readdirSync(baseDir).filter((f) => f.endsWith('.json') && f.indexOf('_verdict') == -1).forEach((file) => {
        console.log(`Checking ${baseDir}/${file}...`);
        const id = path.basename(file, '.json');
        const solution = loadSolution(path.join(baseDir, file));
        const verdict = isValidSolution(problems[id], solution);
        fs.writeFileSync(path.join(baseDir, `${id}_verdict.json`), JSON.stringify(verdict, undefined, 4));
    });
});