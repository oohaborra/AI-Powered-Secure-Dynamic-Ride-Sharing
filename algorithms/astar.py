
import heapq

def astar(graph, heuristic, start, destination):
    queue = [(heuristic[start], 0, start)]
    distances = {start: 0}
    previous = {}

    while queue:
        f, g, current = heapq.heappop(queue)

        if current == destination:
            path = []
            node = destination

            while node != start:
                path.append(node)
                node = previous[node]

            path.append(start)
            path.reverse()

            return path, g

        if g > distances[current]:
            continue

        for neighbor, weight in graph[current].items():
            new_distance = g + weight

            if new_distance < distances.get(neighbor, float("inf")):
                distances[neighbor] = new_distance
                previous[neighbor] = current

                new_f = new_distance + heuristic[neighbor]
                heapq.heappush(
                    queue, (new_f, new_distance, neighbor)
                )

    return None, float("inf")


graph = {
    "A": {"B": 4, "C": 2},
    "B": {"A": 4, "C": 1, "D": 5},
    "C": {"A": 2, "B": 1, "D": 8, "E": 10},
    "D": {"B": 5, "C": 8, "E": 2},
    "E": {"C": 10, "D": 2}
}

heuristic = {
    "A": 8,
    "B": 5,
    "C": 7,
    "D": 2,
    "E": 0
}

path, distance = astar(graph, heuristic, "A", "E")

print("A* Shortest Path:", path)
print("Total Distance:", distance, "km")
