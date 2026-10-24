# 🧩 Developer Note — Pipeline Run for JSON Generation (Sovereign Telemetry Separation)

Execution Requirements for Producing Canonical Numerical Artifacts — v1.0

---

1. Purpose of This Developer Note

This Developer Note defines the required pipeline run that produces the actual populated JSON files used throughout the Sovereign Telemetry Separation experiment.  
These JSONs are the authoritative numerical artifacts consumed by:

- technical_analysis.tex  
- TikZ diagrams  
- the public-facing explainer  
- the experiment README  
- reproducibility and verification workflows  
- the A6 Firewall Companion preprint  

This note ensures contributors understand how the JSONs are generated, why they must come from the Rust engine, and what invariants must be preserved.

---

2. Why a Pipeline Run Is Required

The JSONs cannot be fabricated or manually created.  
They must be produced by the actual execution pipeline because:

- the matrices represent conceptual density operators  
- normalization requires Hermitian symmetrization + trace-class scaling  
- fusion requires block-diagonal operator construction  
- the 80D manifold embedding is geometric and nontrivial  
- diagnostics depend on real eigenvalues, drift metrics, and curvature proxies  

These values must be computed, not invented.

The Rust engine is the authoritative numerical source.  
The Python layer is responsible for serialization only.

---

3. Required Output Artifacts

A full pipeline run must generate the following JSON files:

`
analysis_outputs/
    tritminusone_normalized.json
    tritzeronormalized.json
    tritplusone_normalized.json

    fused_matrix.json

    eigenvaluesminusone.json
    eigenvalues_zero.json
    eigenvaluesplusone.json
    eigenvalues_fused.json

    manifold_80d.json

    diagnostics.json
`

These files form the numerical backbone of the experiment.

---

4. How to Run the Pipeline

4.1 Ensure the save utilities are present

The Python demo must include the savealloutputs() function defined in the JSON Output Layer Developer Note.

4.2 Run the pipeline

From the experiment root:

`
python pipeline/python_demo.py
`

This will:

1. Load the conceptual matrices  
2. Call the Rust engine  
3. Normalize each TRIT sector  
4. Fuse the sectors block-diagonally  
5. Embed the fused matrix into the 80D manifold  
6. Compute eigenvalues and diagnostics  
7. Serialize all numerical artifacts into JSON  

4.3 Verify output directory

After the run, the directory:

`
analysis_outputs/
`

must contain all required JSONs.

---

5. Invariants and Requirements

5.1 Rust engine is the source of truth
All numerical values must originate from the Rust pipeline.

5.2 JSONs must be regenerated after any operator change
If normalization, fusion, or embedding logic changes, the JSONs must be regenerated.

5.3 JSONs must not be manually edited
Manual edits break reproducibility and invalidate the analysis.

5.4 JSONs must be present before .py cleanup
The .py cleanup pass depends on the structure and content of the JSONs.

---

6. Developer Rationale

This Developer Note exists to:

- prevent accidental drift between conceptual, execution, and documentation layers  
- ensure numerical artifacts remain stable and reproducible  
- anchor the technical analysis to real computed values  
- provide clear instructions for contributors running the pipeline  
- maintain consistency across diagrams, analysis, and public-facing documentation  

The JSONs are a pipeline invariant and must be treated as such.

---

7. Status

Pipeline Run Requirement — COMPLETE  
Next step: Python demo cleanup + structured logging pass

---

