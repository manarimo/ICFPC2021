const WIDTH = 30;
const HEIGHT = 15;
const EDGE_MAX = 5;

type JudgeInput = {
    hole: number[][],
    figure: {
        edges: number[][],
        vertices: number[][],
    },
    epsilon: number,
};
type JudgeOutput = {
    vertices: number[],
}

const generateEdges = (edgeLength: number) => {
    const edges: number[] = [];
    let remaining = edgeLength;
    while (remaining > 0) {
        let edgeLength = ((Math.random() * (EDGE_MAX - 1)) | 0) + 1;
        if (edgeLength > remaining) {
            edgeLength = remaining;
        }
        edges.push(edgeLength);
        remaining -= edgeLength;
    }
    return edges;
}

const generateSquare = () => {
    const sticks: number[][] = [];
    const top = generateEdges(WIDTH);
    const right = generateEdges(HEIGHT);
    const bottom = [...top].reverse();
    const left = [...right].reverse();
    sticks.push(top);
    sticks.push(right);
    sticks.push(bottom);
    sticks.push(left);
    return sticks;
}

const generateAssigns = () => {

}

const createFigure = (sticks: number[][]) => {
    const [top, right, bottom, left] = sticks;
    const vertices: number[][] = [];
    let x = 0;
    let y = 0;
    vertices.push([x, y]);
    for (const stick of top) {
        x += stick;
        vertices.push([x, y]);
    }
    for (const stick of right) {
        y += stick;
        vertices.push([x, y]);
    }
    for (const stick of bottom) {
        x -= stick;
        vertices.push([x, y]);
    }
    for (const stick of left) {
        y -= stick;
        vertices.push([x, y]);
    }
    const edges: number[][] = [];
    for (let  i = 0; i < vertices.length; i++) {
        edges.push([i, (i + 1) % vertices.length]);
    }
}


generate();