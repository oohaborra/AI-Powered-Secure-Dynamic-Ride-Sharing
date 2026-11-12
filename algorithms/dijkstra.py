
import heapq

def dijkstra(graph, start, destination):
    distances = {node: float("inf") for node in graph}
    distances[start] = 0

    previous = {}
    queue = [(0, start)]

    while queue:
        current_distance, current_node = heapq.heappop(queue)

        if current_distance > distances[current_node]:
            continue

        if current_node == destination:
            break

        for neighbor, weight in graph[current_node].items():
            distance = current_distance + weight

            if distance < distances[neighbor]:
                distances[neighbor] = distance
                previous[neighbor] = current_node
                heapq.heappush(queue, (distance, neighbor))

    if distances[destination] == float("inf"):
        return None, float("inf")

    path = []
    node = destination

    while node != start:
        path.append(node)
        node = previous[node]

    path.append(start)
    path.reverse()

    return path, distances[destination]


graph = {
    "A": {"B": 4, "C": 2},
    "B": {"A": 4, "C": 1, "D": 5},
    "C": {"A": 2, "B": 1, "D": 8, "E": 10},
    "D": {"B": 5, "C": 8, "E": 2},
    "E": {"C": 10, "D": 2}
}

path, distance = dijkstra(graph, "A", "E")

print("Shortest Path:", path)
print("Total Distance:", distance, "km")
