use std::ops::Sub;

#[derive(Copy, Clone)]
pub struct Point {
    pub x: i64,
    pub y: i64,
}

pub struct Edge {
    pub src: Point,
    pub dst: Point,
}

impl Sub<Point> for Point {
    type Output = Point;

    fn sub(self, rhs: Self) -> Self::Output {
        Self {
            x: self.x - rhs.x,
            y: self.y - rhs.y,
        }
    }
}

impl Point {
    pub fn dot(&self, rhs: &Self) -> i64 {
        self.x * rhs.x + self.y * rhs.y
    }
    pub fn cross(&self, rhs: &Self) -> i64 {
        self.x * rhs.y - self.y * rhs.x
    }
    pub fn d(&self, rhs: &Self) -> i64 {
        (*self - *rhs).dot(&(*self - *rhs))
    }
    pub fn is_contained(&self, hole: &[Point]) -> bool {
        let n = hole.len();

        let max_x = hole.iter().max_by_key(|p| p.x).unwrap().x;
        let min_x = hole.iter().min_by_key(|p| p.x).unwrap().x;
        let outer = Point {
            x: max_x + (max_x - min_x) * 2 + 1,
            y: self.y + 1,
        };

        let mut crossings = 0;
        for i in 0..n {
            let next = (i + 1) % n;
            let p1 = hole[i];
            let p2 = hole[next];
            let d1 = p1 - *self;
            let d2 = p2 - *self;
            let area = d1.cross(&d2);
            if area == 0 && d1.x * d2.x <= 0 && d1.y * d2.y <= 0 {
                // On this edge.
                return true;
            }
            if ccw(*self, outer, p1) * ccw(*self, outer, p2) < 0
                && ccw(p1, p2, *self) * ccw(p1, p2, outer) < 0
            {
                crossings += 1;
            }
        }
        crossings % 2 == 1
    }
}

impl Edge {
    pub fn is_contained(&self, hole: &[Point]) -> bool {
        let n = hole.len();

        if !self.src.is_contained(hole) {
            return false;
        }
        if !self.dst.is_contained(hole) {
            return false;
        }

        let is_crossing = hole.iter().enumerate().any(|(i, &p1)| {
            let p2 = hole[(i + 1) % n];
            ccw(self.src, self.dst, p1) * ccw(self.src, self.dst, p2) < 0
                && ccw(p1, p2, self.src) * ccw(p1, p2, self.dst) < 0
        });
        if is_crossing {
            return false;
        }

        let double_mid = Point {
            x: self.src.x + self.dst.x,
            y: self.src.y + self.dst.y,
        };
        let double_hole = hole
            .iter()
            .map(|p| Point {
                x: p.x * 2,
                y: p.y * 2,
            })
            .collect::<Vec<_>>();

        double_mid.is_contained(&double_hole)
    }

    pub fn is_valid(&self, source: &Edge, epsilon: i64) -> bool {
        let src_dist = source.src.d(&source.dst);
        let dst_dist = self.src.d(&self.dst);
        (dst_dist - src_dist).abs() * 1_000_000 <= epsilon * src_dist
    }
}

pub fn dislike(hole: &[Point], pose: &[Point]) -> i64 {
    let mut sum = 0;
    for h in hole {
        sum += pose.iter().map(|p| h.d(p)).min().unwrap();
    }
    sum
}

pub fn count_contained_edges(hole: &[Point], pose: &[Point], edges: &[[usize; 2]]) -> usize {
    edges
        .iter()
        .filter(|&&[i, j]| {
            let src = pose[i];
            let dst = pose[j];
            let edge = Edge { src, dst };
            edge.is_contained(hole)
        })
        .count()
}
pub fn count_contained_points(hole: &[Point], pose: &[Point]) -> usize {
    pose.iter().filter(|p| p.is_contained(hole)).count()
}
pub fn count_valid_edges(
    pose: &[Point],
    edges: &[[usize; 2]],
    original_pose: &[Point],
    eps: i64,
) -> usize {
    edges
        .iter()
        .filter(|&&[i, j]| {
            let src = pose[i];
            let dst = pose[j];
            let edge = Edge { src, dst };

            let src = original_pose[i];
            let dst = original_pose[j];
            let original = Edge { src, dst };

            edge.is_valid(&original, eps)
        })
        .count()
}

pub fn ccw(p: Point, q: Point, r: Point) -> i64 {
    let qp = q - p;
    let rp = r - p;
    qp.cross(&rp)
}
