import numpy as np

class NeutralManifold:
    def __init__(self, dim=50):
        self.dim = dim
        self.metric = np.eye(dim)

    def embed(self, vector):
        v = np.array(vector)
        if v.shape[0] != self.dim:
            raise ValueError("Vector dimension mismatch")
        return v

    def distance(self, p, q):
        diff = p - q
        return np.sqrt(diff.T @ self.metric @ diff)
