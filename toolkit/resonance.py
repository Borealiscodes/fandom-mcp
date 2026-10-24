import numpy as np

class ResonanceField:
    def __init__(self, manifold):
        self.M = manifold

    def resonance(self, p):
        f = np.linalg.norm(p)
        A = np.mean(p)
        phi = np.sum(p) % np.pi
        return np.array([f, A, phi])

    def stability(self, p, prev):
        return np.linalg.norm(self.resonance(p) - self.resonance(prev))
