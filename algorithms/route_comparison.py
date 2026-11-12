
from dijkstra import dijkstra
from astar import astar

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

dijkstra_path, dijkstra_distance = dijkstra(
    graph, "A", "E"
)

astar_path, astar_distance = astar(
    graph, heuristic, "A", "E"
)

print("ROUTE OPTIMIZATION COMPARISON")
print("--------------------------------")
print("Dijkstra Path:", dijkstra_path)
print("Dijkstra Distance:", dijkstra_distance)

print("A* Path:", astar_path)
print("A* Distance:", astar_distance)

print("--------------------------------")

if dijkstra_distance == astar_distance:
    print("Both algorithms found the same shortest distance.")
else:
    print("The route distances are different.")
