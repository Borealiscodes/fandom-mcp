import numpy as np

def holonomy_curve(manifold, timeline_embeddings):
    curve = np.array(timeline_embeddings)
    return np.sum(np.linalg.norm(np.diff(curve, axis=0), axis=1))
