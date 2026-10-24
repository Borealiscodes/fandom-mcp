use nalgebra::{DMatrix, Complex, ComplexField};
use pyo3::prelude::*;
use pyo3::exceptions::PyValueError;

// ------------------------------------------------------------
// Utility: Convert Python (re, im) tuples → DMatrix<Complex<f64>>
// ------------------------------------------------------------
fn py_to_matrix(py_mat: Vec<Vec<(f64, f64)>>) -> DMatrix<Complex<f64>> {
    let rows = py_mat.len();
    let cols = py_mat[0].len();
    let mut m = DMatrix::<Complex<f64>>::zeros(rows, cols);

    for i in 0..rows {
        for j in 0..cols {
            let (re, im) = py_mat[i][j];
            m[(i, j)] = Complex::new(re, im);
        }
    }
    m
}

// ------------------------------------------------------------
// Utility: Convert DMatrix<Complex<f64>> → Python tuples
// ------------------------------------------------------------
fn matrix_to_py(m: &DMatrix<Complex<f64>>) -> Vec<Vec<(f64, f64)>> {
    let rows = m.nrows();
    let cols = m.ncols();
    let mut out = vec![vec![(0.0, 0.0); cols]; rows];

    for i in 0..rows {
        for j in 0..cols {
            let c = m[(i, j)];
            out[i][j] = (c.re, c.im);
        }
    }
    out
}

// ------------------------------------------------------------
// Hermitian symmetrization
// ------------------------------------------------------------
fn hermitian_symmetrize(m: &DMatrix<Complex<f64>>) -> DMatrix<Complex<f64>> {
    let dagger = m.adjoint();
    (m + dagger) * Complex::new(0.5, 0.0)
}

// ------------------------------------------------------------
// Trace normalization
// ------------------------------------------------------------
fn normalize_trace(m: &DMatrix<Complex<f64>>) -> Result<DMatrix<Complex<f64>>, String> {
    let trace = m.trace().re;

    if trace <= 0.0 {
        return Err("Non-positive trace mass".into());
    }

    Ok(m.map(|c| c / trace))
}

// ------------------------------------------------------------
// Block-diagonal fusion
// ------------------------------------------------------------
fn fuse_block_diagonal(
    a: &DMatrix<Complex<f64>>,
    b: &DMatrix<Complex<f64>>,
    c: &DMatrix<Complex<f64>>,
) -> DMatrix<Complex<f64>> {
    let ra = a.nrows();
    let rb = b.nrows();
    let rc = c.nrows();

    let total = ra + rb + rc;
    let mut fused = DMatrix::<Complex<f64>>::zeros(total, total);

    // Block A
    fused.slice_mut((0, 0), (ra, ra)).copy_from(a);

    // Block B
    fused.slice_mut((ra, ra), (rb, rb)).copy_from(b);

    // Block C
    fused.slice_mut((ra + rb, ra + rb), (rc, rc)).copy_from(c);

    fused
}

// ------------------------------------------------------------
// Lane 2: Normalize conceptual matrices
// ------------------------------------------------------------
#[pyclass]
pub struct PureQuantumProxyAdapter {
    altitude_threshold: f64,
}

#[pymethods]
impl PureQuantumProxyAdapter {
    #[new]
    fn new(altitude_threshold: f64) -> Self {
        Self { altitude_threshold }
    }

    fn normalize_density_matrix(
        &self,
        py_mat: Vec<Vec<(f64, f64)>>
    ) -> PyResult<Vec<Vec<(f64, f64)>>> {

        let m = py_to_matrix(py_mat);
        let herm = hermitian_symmetrize(&m);

        let norm = normalize_trace(&herm)
            .map_err(|e| PyValueError::new_err(e))?;

        Ok(matrix_to_py(&norm))
    }
}

// ------------------------------------------------------------
// Lane 1: Normalize fused matrix + embed into 80D manifold
// ------------------------------------------------------------
#[pyclass]
pub struct FusedManifold80DAdapter {
    drift_tolerance: f64,
}

#[pymethods]
impl FusedManifold80DAdapter {
    #[new]
    fn new(drift_tolerance: f64) -> Self {
        Self { drift_tolerance }
    }

    fn normalize_density_80d(
        &self,
        py_mat: Vec<Vec<(f64, f64)>>
    ) -> PyResult<Vec<Vec<(f64, f64)>>> {

        let m = py_to_matrix(py_mat);
        let herm = hermitian_symmetrize(&m);

        let norm = normalize_trace(&herm)
            .map_err(|e| PyValueError::new_err(e))?;

        // Drift tolerance check
        let trace = norm.trace().re;
        if (trace - 1.0).abs() > self.drift_tolerance {
            return Err(PyValueError::new_err("80D trace mass evaporated"));
        }

        Ok(matrix_to_py(&norm))
    }
}

// ------------------------------------------------------------
// Python-exposed fused constructor
// ------------------------------------------------------------
#[pyfunction]
pub fn fuse_three_matrices(
    a: Vec<Vec<(f64, f64)>>,
    b: Vec<Vec<(f64, f64)>>,
    c: Vec<Vec<(f64, f64)>>
) -> PyResult<Vec<Vec<(f64, f64)>>> {

    let ma = py_to_matrix(a);
    let mb = py_to_matrix(b);
    let mc = py_to_matrix(c);

    let fused = fuse_block_diagonal(&ma, &mb, &mc);
    Ok(matrix_to_py(&fused))
}

// ------------------------------------------------------------
// Module definition
// ------------------------------------------------------------
#[pymodule]
fn conceptual_manifold(_py: Python, m: &PyModule) -> PyResult<()> {
    m.add_class::<PureQuantumProxyAdapter>()?;
    m.add_class::<FusedManifold80DAdapter>()?;
    m.add_function(wrap_pyfunction!(fuse_three_matrices, m)?)?;
    Ok(())
}
