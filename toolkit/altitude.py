import numpy as np

class NarrativeField:
    def __init__(self, manifold, constellation):
        self.M = manifold
        self.C = constellation

    def adjacency(self, a, b):
        return any(e[0] == a and e[1] == b for e in self.C.edges)

    def curvature(self, p):
        return np.linalg.norm(p) / self.M.dim

    def trauma_stability(self, p):
        return 1.0 / (1.0 + self.curvature(p))
