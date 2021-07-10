import * as fs from 'fs';

const WIDTH = 15;
const HEIGHT = 15;
const EDGE_MAX = 10;
const EDGE_MIN = 5;
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
        let edgeLength = ((Math.random() * (EDGE_MAX - EDGE_MIN)) | 0) + EDGE_MIN;
        if (edgeLength > remaining) {
            edgeLength = remaining;
        }
        edges.push(edgeLength);
        remaining -= edgeLength;
    }
    return edges;
}

const generateSticks = (width: number, height: number) => {
    const top = generateEdges(width);
    const right = generateEdges(height);
    return {
        top, right
    };
}

const generatePosSequences = (oneSideSticks: number[]) => {
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

const createAnswer = (top: number[], right: number[]): JudgeOutput => {
    const X = generatePosSequences(top);
    const Y = generatePosSequences(right);
    const vertices: number[][] = [];
    for (let i = 0; i < X.length; i++) {
        vertices.push([X[i], 0]);
    }
    for (let i = 0; i < Y.length; i++) {
        vertices.push([X[X.length - 1], Y[i]]);
    }
    for (let i = X.length - 1; i >= 0; i--) {
        vertices.push([X[i], Y[Y.length - 1]]);
    }
    for (let i = Y.length - 1; i >= 0; i--) {
        vertices.push([0, Y[i]]);
    }
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
    const {top, right} = generateSticks(WIDTH, HEIGHT);
    const figure = createFigure(top, right);
    const answer = createAnswer(top, right);
    const hole = createHole(answer.vertices);
    const input: JudgeInput = {
        hole, figure, epsilon: 0,
    }
    fs.writeFile('./p_keita.json', JSON.stringify(input), () => {});
    fs.writeFile('./a_keita.json', JSON.stringify(answer), () => {});
}

generate();
