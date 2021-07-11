import * as fs from 'fs';
import * as path from 'path';
import {dislike, Edge, isEdgeInside, isPointInside, isValidEdge, Point, Polygon, d, sub} from "../ts-lib/amyfunc";

enum BonusType {
    GLOBALIST = "GLOBALIST",
    BREAK_A_LEG = "BREAK_A_LEG",
    WALLHACK = "WALLHACK",
    NO_BONUS = "NO_BONUS",
    SUPERFLEX = "SUPERFLEX",
}

interface ProblemBonus {
    bonus: BonusType,
    problem: number,
    position: number[]
}

interface SolutionBonus {
    bonus: BonusType,
    problem: number
    edge?: number[]
}

interface Problem {
    hole: Polygon;
    figure: {
        edges: number[][];
        vertices: Point[];
    };
    epsilon: number;
    bonuses: ProblemBonus[];
}

interface Solution {
    vertices: Point[];
    bonuses?: SolutionBonus[];
}

interface Verdict {
    isValid: boolean;
    score: number;
    bonusObtained: ProblemBonus[];
    error?: any;
}

function loadProblems(): {[key: string]: Problem} {
    const problems: {[key: string]: Problem} = {};
    const files = fs.readdirSync(path.join(__dirname, '..', 'problems'));
    files.filter((f) => f.endsWith('.json')).forEach((file) => {
        const id = path.basename(file, '.json');
        const pathName = `${__dirname}/../problems/${file}`;
        const buffer = fs.readFileSync(pathName, 'utf-8');
        try {
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
        } catch (e) {
            console.error(`Failed to load ${pathName}`, e);
        }
    });
    return problems;
}

function loadSolution(file: string): Solution | null {
    const buffer = fs.readFileSync(file, 'utf-8');
    try {
        const solution = JSON.parse(buffer);
        return {
            ...solution,
            vertices: solution['vertices'].map((a: number[]) => ({x: a[0], y: a[1]}))
        };
    } catch (e) {
        console.error(`Failed to load ${file}`, e);
        return null;
    }
}

function doublePoint(p: Point): Point {
    return {
        x: 2 * p.x,
        y: 2 * p.y
    }
}

function isValidSolution(problem: Problem, solution: Solution): Verdict {
    if (solution.bonuses !== undefined && solution.bonuses.length > 1) {
        return {
            isValid: false,
            score: 0,
            bonusObtained: [],
            error: {
                bonuses: solution.bonuses,
                message: `At most one bonus can be enabled, while ${solution.bonuses.length} bonuses are enabled.`
            }
        }
    }
    const bonus: SolutionBonus = solution.bonuses !== undefined ? solution.bonuses[0] : {bonus: BonusType.NO_BONUS, problem: -1};
    let globalLengthCost = 0.;

    const edgeInsideViolations = [];
    const edgeLengthViolations = [];
    for (let i = 0; i < problem.figure.edges.length; ++i) {
        const e = problem.figure.edges[i];
        const srcEdge = { src: problem.figure.vertices[e[0]], dst: problem.figure.vertices[e[1]] };
        const dstEdge = { src: solution.vertices[e[0]], dst: solution.vertices[e[1]] };

        if (bonus.bonus === BonusType.BREAK_A_LEG && ((e[0] === bonus.edge[0] && e[1] === bonus.edge[1]) || (e[0] === bonus.edge[1] && e[1] === bonus.edge[0]))) {
            // this edge is broken. validating broken edges.
            const doubledAddedEdge1 = {
                src: doublePoint(solution.vertices[e[0]]),
                dst: doublePoint(solution.vertices[solution.vertices.length - 1])
            }
            const doubledAddedEdge2 = {
                src: doublePoint(solution.vertices[e[1]]),
                dst: doublePoint(solution.vertices[solution.vertices.length - 1])
            }
            if (!isValidEdge(srcEdge, doubledAddedEdge1, problem['epsilon']) || !isValidEdge(srcEdge, doubledAddedEdge2, problem['epsilon'])) {
                return {
                    isValid: false,
                    score: 0,
                    bonusObtained: [],
                    error: {
                        srcEdge,
                        dstEdge,
                        message: `broken edge(s) violates length constraint`,
                    }
                };
            }
        } else {
            if (bonus.bonus === BonusType.GLOBALIST) {
                globalLengthCost += Math.abs(d(dstEdge[0], dstEdge[1]) / d(srcEdge[0], srcEdge[1]) - 1);
            } else {
                if (!isValidEdge(srcEdge, dstEdge, problem['epsilon'])) {
                    edgeLengthViolations.push({
                        e,
                        srcEdge,
                        dstEdge,
                        i
                    })
                }
            }
            if (!isEdgeInside(problem.hole, dstEdge)) {
                edgeInsideViolations.push({
                    e,
                    dstEdge,
                    i
                });
            }
        }
    }

    const allowedEdgeLengthViolations = bonus.bonus === BonusType.SUPERFLEX ? 1 : 0;
    if (edgeLengthViolations.length > allowedEdgeLengthViolations) {
        const {i, srcEdge, dstEdge} = edgeLengthViolations[0]
        return {
            isValid: false,
            score: 0,
            bonusObtained: [],
            error: {
                srcEdge,
                dstEdge,
                message: `Edge ${i} violates the length constraint. (${edgeInsideViolations.length} edges violates in total.)`,
            },
        };
    }

    if (bonus.bonus === BonusType.GLOBALIST) {
        const globalLengthBudget = problem.figure.edges.length * problem.epsilon / 1_000_000;
        if (globalLengthCost > globalLengthBudget) {
            return {
                isValid: false,
                score: 0,
                bonusObtained: [],
                error: {
                    globalLengthCost,
                    globalLengthBudget,
                    message: `Global length constraint is violated.`,
                }
            };
        }
    }

    if (bonus.bonus === BonusType.WALLHACK) {
        let ok = false;
        for (let hackedVertexId = 0; hackedVertexId < problem.figure.vertices.length; hackedVertexId++) {
            let subOk = true;
            for (const edgeViolation of edgeInsideViolations) {
                subOk = subOk && (edgeViolation.e[0] === hackedVertexId || edgeViolation.e[1] === hackedVertexId);
            }
            ok = ok || subOk;
            if (ok) {
                break;
            }
        }
        if (!ok) {
            return {
                isValid: false,
                score: 0,
                bonusObtained: [],
                error: {
                    message: `Wallhack constraint is not satisfied. (${edgeInsideViolations.length} edges are outside in total)`,
                },
            };
        }
    } else {
        if (edgeInsideViolations.length > 0) {
            const i = edgeInsideViolations[0].i;
            const dstEdge = edgeInsideViolations[0].dstEdge;
            return {
                isValid: false,
                score: 0,
                bonusObtained: [],
                error: {
                    dstEdge,
                    message: `Edge ${i} is not in the hole. (${edgeInsideViolations.length} edges are outside in total)`,
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
        if (solution !== null) {
            const verdict = isValidSolution(problems[id], solution);
            fs.writeFileSync(path.join(baseDir, `${id}_verdict.json`), JSON.stringify(verdict, undefined, 4));
        }
    });
});