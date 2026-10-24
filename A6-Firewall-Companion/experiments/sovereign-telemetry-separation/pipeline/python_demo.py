import json
import numpy as np
import os
from pathlib import Path

# ============================================================
# 0. Setup
# ============================================================

BASE = Path(__file__).resolve().parent
MATRIX_DIR = BASE.parent / "matrices"
OUTPUT_DIR = BASE.parent / "analysis_outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

COLOR_TILES = {
    "minus": "🟥 TRIT −1",
    "zero":  "🟦 TRIT 0",
    "plus":  "🟩 TRIT +1"
}

# ============================================================
# 1. Utility: Structured Logging
# ============================================================

def section(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)

def log_matrix(name, M, verbose):
    if verbose:
        print(f"\n{name}:")
        print(np.array(M))

def log_vector(name, v, verbose):
    if verbose:
        print(f"\n{name}: {v}")

# ============================================================
# 2. Utility: JSON Serialization
# ============================================================

def save_json(path, obj):
    with open(path, "w") as f:
        json.dump(obj, f, indent=2)

def matrix_to_json(mat):
    return [
        [
            {"re": float(c.real), "im": float(c.imag)}
            for c in row
        ]
        for row in mat
    ]

# ============================================================
# 3. Load Conceptual Input Matrices
# ============================================================

def load_matrix(name):
    with open(MATRIX_DIR / name, "r") as f:
        data = json.load(f)
    return np.array(data["matrix"], dtype=np.complex128)

def load_inputs():
    return {
        "minus": load_matrix("trit_minus1.json"),
        "zero":  load_matrix("trit_0.json"),
        "plus":  load_matrix("trit_plus1.json")
    }

# ============================================================
# 4. Rust Engine Hook (placeholder call)
# ============================================================

def rust_pipeline(rho_minus, rho_zero, rho_plus):
    """
    This function represents the Rust-backed pipeline call.
    Replace this stub with your actual FFI binding.
    """

    # --- Normalization (placeholder) ---
    rho_minus_norm = rho_minus / np.trace(rho_minus)
    rho_zero_norm  = rho_zero  / np.trace(rho_zero)
    rho_plus_norm  = rho_plus  / np.trace(rho_plus)

    # --- Fusion (block diagonal) ---
    fused = np.block([
        [rho_minus_norm, np.zeros_like(rho_minus_norm), np.zeros_like(rho_minus_norm)],
        [np.zeros_like(rho_zero_norm), rho_zero_norm, np.zeros_like(rho_zero_norm)],
        [np.zeros_like(rho_plus_norm), np.zeros_like(rho_plus_norm), rho_plus_norm]
    ])

    # --- Eigenvalues ---
    eig_minus = np.linalg.eigvals(rho_minus_norm)
    eig_zero  = np.linalg.eigvals(rho_zero_norm)
    eig_plus  = np.linalg.eigvals(rho_plus_norm)
    eig_fused = np.linalg.eigvals(fused)

    # --- 80D manifold (placeholder) ---
    manifold = np.random.rand(80).tolist()

    # --- Diagnostics (placeholder) ---
    diagnostics = {
        "hermitian_deviation": float(np.linalg.norm(rho_minus - rho_minus.T.conj())),
        "trace_stability": float(np.trace(fused)),
        "drift_tolerance": 1e-8,
        "curvature_proxy": 0.0042,
        "holonomy_drift": 1.7e-6
    }

    return (
        rho_minus_norm, rho_zero_norm, rho_plus_norm,
        fused,
        eig_minus, eig_zero, eig_plus, eig_fused,
        manifold,
        diagnostics
    )

# ============================================================
# 5. Save All Outputs
# ============================================================

def save_all_outputs(
    rho_minus, rho_zero, rho_plus,
    fused, manifold,
    eig_minus, eig_zero, eig_plus, eig_fused,
    diagnostics
):
    save_json(OUTPUT_DIR / "trit_minus_one_normalized.json", matrix_to_json(rho_minus))
    save_json(OUTPUT_DIR / "trit_zero_normalized.json", matrix_to_json(rho_zero))
    save_json(OUTPUT_DIR / "trit_plus_one_normalized.json", matrix_to_json(rho_plus))

    save_json(OUTPUT_DIR / "fused_matrix.json", matrix_to_json(fused))
    save_json(OUTPUT_DIR / "manifold_80d.json", manifold)

    save_json(OUTPUT_DIR / "eigenvalues_minus_one.json", eig_minus.tolist())
    save_json(OUTPUT_DIR / "eigenvalues_zero.json", eig_zero.tolist())
    save_json(OUTPUT_DIR / "eigenvalues_plus_one.json", eig_plus.tolist())
    save_json(OUTPUT_DIR / "eigenvalues_fused.json", eig_fused.tolist())

    save_json(OUTPUT_DIR / "diagnostics.json", diagnostics)

# ============================================================
# 6. Main Pipeline
# ============================================================

def run_all(verbose=False):
    section("Loading Conceptual Input Matrices")
    inputs = load_inputs()

    for key, M in inputs.items():
        log_matrix(f"{COLOR_TILES[key]} — Input Matrix", M, verbose)

    section("Running Rust Pipeline")
    (
        rho_minus_norm, rho_zero_norm, rho_plus_norm,
        fused,
        eig_minus, eig_zero, eig_plus, eig_fused,
        manifold,
        diagnostics
    ) = rust_pipeline(
        inputs["minus"],
        inputs["zero"],
        inputs["plus"]
    )

    # Logging
    section("Normalized Matrices")
    log_matrix("🟥 TRIT −1 — Normalized", rho_minus_norm, verbose)
    log_matrix("🟦 TRIT 0 — Normalized", rho_zero_norm, verbose)
    log_matrix("🟩 TRIT +1 — Normalized", rho_plus_norm, verbose)

    section("Fused Matrix")
    log_matrix("Fused Block-Diagonal Matrix", fused, verbose)

    section("Eigenvalues")
    log_vector("TRIT −1 Eigenvalues", eig_minus, verbose)
    log_vector("TRIT 0 Eigenvalues", eig_zero, verbose)
    log_vector("TRIT +1 Eigenvalues", eig_plus, verbose)
    log_vector("Fused Eigenvalues", eig_fused, verbose)

    section("Diagnostics")
    if verbose:
        print(json.dumps(diagnostics, indent=2))

    section("Saving JSON Outputs")
    save_all_outputs(
        rho_minus_norm, rho_zero_norm, rho_plus_norm,
        fused, manifold,
        eig_minus, eig_zero, eig_plus, eig_fused,
        diagnostics
    )

    print("\n✔️ Pipeline complete — JSON outputs written to analysis_outputs/\n")

# ============================================================
# 7. Entrypoint
# ============================================================

if __name__ == "__main__":
    run_all(verbose=True)
