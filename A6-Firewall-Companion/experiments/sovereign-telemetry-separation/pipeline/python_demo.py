import json
from pathlib import Path

# Rust adapters (Lane 1 and Lane 2)
from invariant_logic_adapter import (
    PureQuantumProxyAdapter,
    FusedManifold80DAdapter
)

# ---------------------------------------------------------------------------
# Load JSON matrices
# ---------------------------------------------------------------------------

def load_matrix(path):
    with open(path, "r") as f:
        data = json.load(f)
    # Convert real numbers into (re, im) tuples for Rust adapter
    return [[(float(x), 0.0) for x in row] for row in data["matrix"]]

base = Path(__file__).resolve().parent.parent / "matrices"

rho_minus1 = load_matrix(base / "trit_minus1.json")
rho_0      = load_matrix(base / "trit_0.json")
rho_plus1  = load_matrix(base / "trit_plus1.json")

# ---------------------------------------------------------------------------
# Lane 2: Normalize each conceptual sector independently
# ---------------------------------------------------------------------------

lane2 = PureQuantumProxyAdapter(altitude_threshold=1.0)

norm_minus1 = lane2.normalize_density_matrix(rho_minus1)
norm_0      = lane2.normalize_density_matrix(rho_0)
norm_plus1  = lane2.normalize_density_matrix(rho_plus1)

print("\n=== Normalized TRIT -1 ===")
print(norm_minus1)

print("\n=== Normalized TRIT 0 ===")
print(norm_0)

print("\n=== Normalized TRIT +1 ===")
print(norm_plus1)

# ---------------------------------------------------------------------------
# Block-diagonal fusion
# ---------------------------------------------------------------------------

def fuse_three(a, b, c):
    """Fuse three matrices into a block-diagonal conceptual manifold sector."""
    size_a = len(a)
    size_b = len(b)
    size_c = len(c)

    fused = []

    # Block A
    for row in a:
        fused.append(row + [(0.0, 0.0)] * size_b + [(0.0, 0.0)] * size_c)

    # Block B
    for row in b:
        fused.append([(0.0, 0.0)] * size_a + row + [(0.0, 0.0)] * size_c)

    # Block C
    for row in c:
        fused.append([(0.0, 0.0)] * size_a + [(0.0, 0.0)] * size_b + row)

    return fused

rho_fused = fuse_three(norm_minus1, norm_0, norm_plus1)

print("\n=== Fused Conceptual Matrix (Pre-80D Embedding) ===")
print(rho_fused)

# ---------------------------------------------------------------------------
# Lane 1: Embed fused matrix into 80D soft Riemannian manifold
# ---------------------------------------------------------------------------

lane1 = FusedManifold80DAdapter(drift_tolerance=1e-7)
rho_80d = lane1.normalize_density_80d(rho_fused)

print("\n=== Final 80D Conceptual Manifold ===")
print(rho_80d)
