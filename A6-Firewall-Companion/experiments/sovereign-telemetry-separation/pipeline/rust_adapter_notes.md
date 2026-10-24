# 📘 rustadapternotes.md — Rust FFI Behavior and Technical Notes

1. Overview

This document explains the behavior of the Rust adapters used in the Sovereign Telemetry Separation pipeline. Two adapters are involved:

- PureQuantumProxyAdapter (Lane 2)  
  Normalizes conceptual density matrices independently.

- FusedManifold80DAdapter (Lane 1)  
  Normalizes and embeds the fused conceptual matrix into an 80D soft Riemannian manifold.

Both adapters expose Python bindings via PyO3, enabling the Python pipeline to perform Hermitian symmetrization, trace normalization, and manifold embedding.

---

2. PureQuantumProxyAdapter (Lane 2)

Purpose

This adapter processes each conceptual sector (TRIT −1, TRIT 0, TRIT +1) independently.  
It ensures that each matrix becomes:

- Hermitian  
- trace-class 1  
- positive semi-definite  
- ready for block-diagonal fusion  

Key Method: normalizedensitymatrix()

Step 1 — Parse Python matrix

Python provides matrices as:

`
[[ (re, im), (re, im), ... ], ...]
`

Rust converts these into:

`
DMatrix<Complex64>
`

Step 2 — Hermitian symmetrization

The adapter computes:

\[
\rho \leftarrow \frac{1}{2}(\rho + \rho^\dagger)
\]

This ensures:

- real eigenvalues  
- stable manifold embedding  
- compatibility with CPTP-style normalization  

Step 3 — Trace normalization

The trace is computed:

\[
t = \sumi \rho{ii}
\]

Then:

\[
\rho \leftarrow \frac{\rho}{t}
\]

This guarantees:

- scale invariance  
- conceptual comparability  
- manifold compatibility  

Output

The normalized matrix is returned to Python in the same (re, im) tuple format.

---

3. FusedManifold80DAdapter (Lane 1)

Purpose

This adapter processes the fused conceptual matrix, created by block-diagonal concatenation of:

\[
\tilde{\rho}{-1},\ \tilde{\rho}{0},\ \tilde{\rho}_{+1}
\]

It performs:

- Hermitian symmetrization  
- trace normalization  
- drift-tolerant manifold embedding  

Key Method: normalizedensity80d()

The method mirrors Lane 2’s normalization steps but is applied to the fused matrix.

Drift Tolerance

The adapter includes:

`
drift_tolerance: f64
`

This parameter controls numerical stability during:

- Hermitian symmetrization  
- trace normalization  
- manifold embedding  

It prevents:

- eigenvalue drift  
- trace collapse  
- coordinate instability  

---

4. Block-Diagonal Fusion (Python → Rust)

The Python pipeline constructs:

\[
\rho_{\text{fused}} =
\tilde{\rho}{-1} \oplus \tilde{\rho}{0} \oplus \tilde{\rho}_{+1}
\]

This fused matrix is passed to Lane 1.

Rust treats the fused matrix exactly like any other density matrix:

- parses it  
- symmetrizes it  
- normalizes it  
- returns it  

The fused matrix remains:

- Hermitian  
- positive semi-definite  
- trace-class 1  

This ensures compatibility with the 80D manifold embedding.

---

5. Error Conditions

Lane 2

- “Non-positive trace mass.”  
  Occurs if the diagonal sum is ≤ 0.

Lane 1

- “80D trace mass evaporated.”  
  Occurs if fused matrix trace collapses.

Both errors indicate malformed conceptual matrices or numerical instability.

---

6. Summary of Rust FFI Behavior

| Adapter | Purpose | Operations | Output |
|--------|---------|------------|--------|
| PureQuantumProxyAdapter | Normalize each TRIT sector | Hermitian symmetrization, trace normalization | Normalized conceptual matrix |
| FusedManifold80DAdapter | Normalize fused conceptual matrix | Hermitian symmetrization, trace normalization, drift-tolerant embedding | 80D conceptual manifold |

---

7. Integration Notes

- Python → Rust → Python round-trip is stable.  
- All matrices must be square and real-symmetric.  
- JSON → Python → Rust conversion preserves structure.  
- The fused matrix must be block-diagonal to avoid conceptual contamination.  
- Drift tolerance should remain at 1e-7 unless performing stress tests.

---

