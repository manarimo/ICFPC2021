import * as fs from 'fs';

const WIDTH = 10_000_000_000;
const EDGE_MAX = Math.floor(WIDTH / 20);
// const WIDTH = 30;
// const EDGE_MAX = 10;
const EDGE_MIN = 1;

type JudgeInput = {
    hole: number[][],
    figure: {
        edges: number[][],
        vertices: number[][],
    },
    epsilon: number,
};
type JudgeOutput = {
    vertices: number[][],
}

const generateEdges = (edgeLength: number) => {
    const edges: number[] = [];
    let remaining = edgeLength;
    while (remaining > 0) {
        let edgeLength = (Math.floor(Math.random() * (EDGE_MAX - EDGE_MIN))) + EDGE_MIN;
        if (edgeLength > remaining) {
            edgeLength = remaining;
        }
        edges.push(edgeLength);
        remaining -= edgeLength;
    }
    return edges;
}

const generateSticks = (width: number) => {
    const top = generateEdges(width);
    return {
        top
    };
}

const generatePosSequencesWeakRestrictions = (oneSideSticks: number[]) => {
    let pos = 0;
    const res: number[] = [];
    for (let i = 0; i < oneSideSticks.length; i++) {
        if (Math.random() < 0.5) {
            pos += oneSideSticks[i];
        } else {
            pos -= oneSideSticks[i];
        }
        res.push(pos);
    }
    return res;
}

const createFigure = (top: number[], right: number[]) => {
    const vertices: number[][] = [];
    let x = 0;
    let y = 0;
    for (const stick of top) {
        x += stick;
        vertices.push([x, y]);
    }
    for (const stick of right) {
        y += stick;
        vertices.push([x, y]);
    }
    for (let i = top.length - 1; i >= 0; i--) {
        x -= top[i];
        vertices.push([x, y]);
    }
    for (let i = right.length - 1; i >= 0; i--) {
        y -= right[i];
        vertices.push([x, y]);
    }
    const edges: number[][] = [];
    for (let  i = 0; i < vertices.length; i++) {
        edges.push([i, (i + 1) % vertices.length]);
    }
    return {
        vertices, edges,
    }
}

const createAnswer = (top: number[]): JudgeOutput => {
    const X = generatePosSequencesWeakRestrictions(top);
    const Y = [1];
    const vertices: number[][] = [];
    for (let i = 0; i < X.length; i++) {
        vertices.push([X[i], 0]);
    }
    for (let i = 0; i < Y.length; i++) {
        vertices.push([X[X.length - 1], Y[i]]);
    }
    // wow not intuitive
    for (let i = X.length - 2; i >= 0; i--) {
        vertices.push([X[i], Y[Y.length - 1]]);
    }
    for (let i = Y.length - 1; i >= 0; i--) {
        vertices.push([0, Y[i]]);
    }
    vertices.push([0, 0]);
    return {
        vertices
    };
}

const createHole = (vertices: number[][]) => {
    let minX = vertices[0][0];
    let maxX = vertices[0][0];
    let minY = vertices[0][1];
    let maxY = vertices[0][1];
    vertices.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    })
    return [
        [minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]
    ];
}

const generate = () => {
    const {top} = generateSticks(WIDTH);
    // WARNING! right can be modified by createAnswer
    const answer = createAnswer(top);
    const figure = createFigure(top, [1]);
    const hole = createHole(answer.vertices);
    const input: JudgeInput = {
        hole, figure, epsilon: 0,
    }
    const vs = figure.vertices.length;
    console.log(vs);
    fs.writeFile(`./problems/${WIDTH}_${1}_${vs}.json`, JSON.stringify(input), () => {});
    fs.writeFile(`./solutions/${WIDTH}_${1}_${vs}.json`, JSON.stringify(answer), () => {});
}

generate();
