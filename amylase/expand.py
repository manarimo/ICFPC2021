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


def expand(spec):
    hole = spec["hole"]
    vertices = spec["figure"]["vertices"]
    edges = spec["figure"]["edges"]

    edge_lengths = []
    for fr, to in edges:
        edge_lengths.append(distance(vertices[fr], vertices[to]))

    weight = 1
    spring_k = 1
    gravity = 2000
    time_delta = 1e-3

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

        if t % 1000 == 0:
            kinetic_energy = 0.
            for velocity in velocities:
                kinetic_energy += weight * (norm(velocity) ** 2) / 2
            print(kinetic_energy)
    rounded_positions = [[round(v) for v in p] for p in positions]
    print(rounded_positions)


def main():
    with open("../problems/75.json") as f:
        spec = json.load(f)
        expand(spec)


if __name__ == '__main__':
    main()