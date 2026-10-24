class Constellation:
    def __init__(self):
        self.nodes = {}
        self.edges = []
        self.surfaces = []

    def add_node(self, name, data=None):
        self.nodes[name] = data

    def add_edge(self, a, b, relation):
        self.edges.append((a, b, relation))

    def add_surface(self, name, nodes):
        self.surfaces.append((name, nodes))
