export interface Point {
    x: number;
    y: number;
}

export interface Edge {
    src: Point;
    dst: Point;
}

export type Vector = Point;
export type Polygon = Point[];

export function sub(p: Point, q: Point): Point {
    return {
        x: p.x - q.x,
        y: p.y - q.y
    };
}

export function dot(p: Point, q: Point): number {
    return p.x * q.x + p.y * q.y;
}

export function cross(p: Point, q: Point): number {
    return p.x * q.y - p.y * q.x;
}

export function ccw(p: Point, q: Point, r: Point): number {
    return cross(sub(q, p), sub(r, p));
}

export function isPointInside(hole: Polygon, point: Point): boolean {
    const xs = hole.map((p) => p.x);
    const maxX = xs.reduce((a, b) => Math.max(a, b));
    const minX = xs.reduce((a, b) => Math.min(a, b));
    const outer: Point = {
        x: maxX + (maxX - minX) * 2 + 1,
        y: point.y + 1
    };

    let crossings = 0;
    for (let i = 0; i < hole.length; ++i) {
        const next = (i + 1) % hole.length;
        const p1 = hole[i];
        const p2 = hole[next];
        const d1 = sub(p1, point);
        const d2 = sub(p2, point);
        const area = cross(d1, d2);
        if (area == 0 && d1.x * d2.x <= 0 && d1.y * d2.y <= 0) {
            // On this edge.
            return true
        }
        if (ccw(point, outer, p1) * ccw(point, outer, p2) < 0 && ccw(p1, p2, point) * ccw(p1, p2, outer) < 0) {
            ++crossings;
        }
    }
    return crossings % 2 == 1;
}

export function isEdgeInside(hole: Polygon, edge: Edge): boolean {
    if (!isPointInside(hole, edge.src)) {
        return false;
    }
    if (!isPointInside(hole, edge.dst)) {
        return false;
    }

    const isCrossing  = hole.some((p1, idx) => {
        const p2 = hole[(idx + 1) % hole.length];
        return ccw(edge.src, edge.dst, p1) * ccw(edge.src, edge.dst, p2) < 0 && ccw(p1, p2, edge.src) * ccw(p1, p2, edge.dst) < 0;
    });
    if (isCrossing) {
        return false;
    }

    const doubleMid: Point = {
        x: edge.src.x + edge.dst.x,
        y: edge.src.y + edge.dst.y,
    };
    const doubleHole = hole.map((p) => ({x: p.x*2, y: p.y*2}));
    if (!isPointInside(doubleHole, doubleMid)) {
        return false;
    }

    return true;
}

export function d(p: Point, q: Point): number {
    return dot(sub(p, q), sub(p, q));
}

export function isValidEdge(src: Edge, dst: Edge, eps: number): boolean {
    const srcDist = d(src.src, src.dst);
    const dstDist = d(dst.src, dst.dst);
    return Math.abs(dstDist - srcDist) * 1_000_000 <= eps * srcDist;
}

export function dislike(hole: Polygon, ps: Point[]): number {
    let sum = 0;
    hole.forEach((h) => {
        sum += ps.reduce((acc, p) => Math.min(acc, d(h, p)), Infinity);
    });
    return sum;
}
