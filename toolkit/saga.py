import numpy as np

def embed_character(manifold, character):
    vec = np.random.randn(manifold.dim)
    return manifold.embed(vec)

def embed_form(manifold, form):
    vec = np.random.randn(manifold.dim)
    return manifold.embed(vec)
