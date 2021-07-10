import json


def distance(p, q):
    d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2
    return d ** 0.5


def norm(v):
    return distance(v, [0, 0])


def normalized_vector(fr_v, to_v):
    dx, dy = to_v[0] - fr_v[0], to_v[1] - fr_v[1]
    n = norm([dx, dy])
    if n == 0:
        return [0, 0]
    return [dx / n, dy / n]


def bounding_box(points):
    xs, ys = [], []
    for x, y in points:
        xs.append(x)
        ys.append(y)
    min_x = min(xs)
    max_x = max(xs)
    min_y = min(ys)
    max_y = max(ys)
    return min_x, max_x, min_y, max_y


def translate(sx, sy, tx, ty, v):
    assert sx < sy
    assert tx < ty
    return (ty - tx) / (sy - sx) * (v - sx) + tx


def expand(spec):
    hole = spec["hole"]
    vertices = spec["figure"]["vertices"]
    edges = spec["figure"]["edges"]

    edge_lengths = []
    for fr, to in edges:
        edge_lengths.append(distance(vertices[fr], vertices[to]))

    weight = 1
    spring_k = 1
    gravity = 4000
    time_delta = 1e-2

    positions = [p[:] for p in vertices]
    velocities = [[0, 0] for _ in vertices]

    for t in range(10000):
        for (fr, to), edge_length in zip(edges, edge_lengths):
            current_distance = distance(positions[fr], positions[to])
            force = (current_distance - edge_length) * spring_k
            direction = normalized_vector(positions[fr], positions[to])
            for dim in range(2):
                velocities[to][dim] -= force / weight * direction[dim] * time_delta
                velocities[fr][dim] += force / weight * direction[dim] * time_delta
        for fr in range(len(positions)):
            for to in range(fr):
                current_distance = max(distance(positions[fr], positions[to]), 1)
                force = (weight ** 2) * gravity / (current_distance ** 2)
                direction = normalized_vector(positions[fr], positions[to])
                for dim in range(2):
                    velocities[to][dim] += force / weight * direction[dim] * time_delta
                    velocities[fr][dim] -= force / weight * direction[dim] * time_delta
        for i in range(len(positions)):
            for dim in range(2):
                positions[i][dim] += velocities[i][dim] * time_delta

        # if t % 1000 == 0:
        #     kinetic_energy = 0.
        #     for velocity in velocities:
        #         kinetic_energy += weight * (norm(velocity) ** 2) / 2
        #     print(kinetic_energy)

    target_box = bounding_box(hole)
    source_box = bounding_box(positions)

    translated_positions = [[translate(source_box[0], source_box[1], target_box[0], target_box[1], p[0]),
                             translate(source_box[2], source_box[3], target_box[2], target_box[3], p[1])
                             ] for p in positions]
    rounded_positions = [[round(v) for v in p] for p in translated_positions]

    return {"vertices": rounded_positions}


def main(problem_id):
    with open(f"../problems/{problem_id}.json") as f:
        spec = json.load(f)
    hint = expand(spec)
    with open(f"../hints/spring-expand/{problem_id}.json", "w") as f:
        json.dump(hint, f)


if __name__ == '__main__':
    from multiprocessing import Pool
    pool = Pool(processes=7)
    problem_ids = range(1, 89)
    pool.map(main, problem_ids)
