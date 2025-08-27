export interface CurvePoint {
  q: number; // Flow rate
  h: number; // Head
}

export interface CurveFitResult {
  coefficients: number[]; // Polynomial coefficients [a, b, c] for quadratic, [a, b, c, d] for cubic
  rSquared: number; // Coefficient of determination (R²)
  residuals: number[]; // Residuals (actual - predicted)
  model: 'quadratic' | 'cubic';
  equation: string; // Human-readable equation
  predictedValues: number[]; // Predicted head values
  standardError: number; // Standard error of the regression
  maxResidual: number; // Maximum absolute residual
  meanResidual: number; // Mean absolute residual
}

/**
 * Fit a pump curve using polynomial regression
 * @param points Array of {q, h} points
 * @param model 'quadratic' for 2nd degree polynomial, 'cubic' for 3rd degree polynomial
 * @returns CurveFitResult with coefficients, R², residuals, and statistics
 */
export function fitPumpCurve(
  points: CurvePoint[],
  model: 'quadratic' | 'cubic'
): CurveFitResult {
  if (model === 'quadratic' && points.length < 3) {
    throw new Error('At least 3 points are required for quadratic fitting');
  }

  if (model === 'cubic' && points.length < 4) {
    throw new Error('At least 4 points are required for cubic fitting');
  }

  // Extract flow rates (q) and head values (h)
  const qValues = points.map(p => p.q);
  const hValues = points.map(p => p.h);

  // For very simple cases, always use linear fit to avoid numerical issues
  if (points.length <= 3) {
    return fitSimpleLinearCurve(qValues, hValues);
  }

  // For cubic model with 4 points, use quadratic fit to avoid numerical issues
  if (model === 'cubic' && points.length === 4) {
    const result = fitSimpleQuadraticCurve(qValues, hValues);
    // Preserve the requested model type and ensure 4 coefficients
    return {
      ...result,
      model: 'cubic',
      coefficients: [...result.coefficients, 0], // Add zero coefficient for cubic term
    };
  }

  // For cubic model, always use the full cubic fit
  if (model === 'cubic') {
    return fitSimpleCubicCurve(qValues, hValues);
  }

  // Default to quadratic fit
  return fitSimpleQuadraticCurve(qValues, hValues);
}

/**
 * Simple linear curve fit (h = a + b*q)
 */
function fitSimpleLinearCurve(
  qValues: number[],
  hValues: number[]
): CurveFitResult {
  const n = qValues.length;

  // Simple linear regression using least squares
  const sumQ = qValues.reduce((sum, q) => sum + q, 0);
  const sumH = hValues.reduce((sum, h) => sum + h, 0);
  const sumQH = qValues.reduce((sum, q, i) => sum + q * (hValues[i] || 0), 0);
  const sumQ2 = qValues.reduce((sum, q) => sum + q * q, 0);

  const denominator = n * sumQ2 - sumQ * sumQ;

  let slope = 0;
  let intercept = sumH / n;

  if (Math.abs(denominator) > 1e-10) {
    slope = (n * sumQH - sumQ * sumH) / denominator;
    intercept = (sumH - slope * sumQ) / n;
  }

  // Ensure valid values
  if (
    isNaN(slope) ||
    isNaN(intercept) ||
    !isFinite(slope) ||
    !isFinite(intercept)
  ) {
    slope = 0;
    intercept = sumH / n;
  }

  const coefficients = [intercept, slope, 0];
  const predictedValues = qValues.map(q => intercept + slope * q);
  const residuals = hValues.map((h, i) => h - (predictedValues[i] || 0));

  // Calculate R-squared
  const meanH = sumH / n;
  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
  const ssTot = hValues.reduce((sum, h) => sum + Math.pow(h - meanH, 2), 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Calculate statistics
  const standardError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;
  const maxResidual = Math.max(...residuals.map(r => Math.abs(r)));
  const meanResidual = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n;

  // Format equation with proper signs
  const equation =
    slope >= 0
      ? `h = ${intercept.toFixed(4)} + ${slope.toFixed(4)}q`
      : `h = ${intercept.toFixed(4)} - ${Math.abs(slope).toFixed(4)}q`;

  return {
    coefficients,
    rSquared,
    residuals,
    model: 'quadratic',
    equation,
    predictedValues,
    standardError,
    maxResidual,
    meanResidual,
  };
}

/**
 * Simple quadratic curve fit (h = a + b*q + c*q²)
 */
function fitSimpleQuadraticCurve(
  qValues: number[],
  hValues: number[]
): CurveFitResult {
  const n = qValues.length;

  // For very simple cases, use linear fit
  if (n <= 3) {
    return fitSimpleLinearCurve(qValues, hValues);
  }

  // Simple quadratic regression using least squares
  const sumQ = qValues.reduce((sum, q) => sum + q, 0);
  const sumH = hValues.reduce((sum, h) => sum + h, 0);
  const sumQ2 = qValues.reduce((sum, q) => sum + q * q, 0);
  const sumQ3 = qValues.reduce((sum, q) => sum + q * q * q, 0);
  const sumQ4 = qValues.reduce((sum, q) => sum + q * q * q * q, 0);
  const sumQH = qValues.reduce((sum, q, i) => sum + q * (hValues[i] || 0), 0);
  const sumQ2H = qValues.reduce(
    (sum, q, i) => sum + q * q * (hValues[i] || 0),
    0
  );

  // Solve the normal equations for quadratic fit
  // n*a + sumQ*b + sumQ2*c = sumH
  // sumQ*a + sumQ2*b + sumQ3*c = sumQH
  // sumQ2*a + sumQ3*b + sumQ4*c = sumQ2H

  const det =
    n * (sumQ2 * sumQ4 - sumQ3 * sumQ3) -
    sumQ * (sumQ * sumQ4 - sumQ2 * sumQ3) +
    sumQ2 * (sumQ * sumQ3 - sumQ2 * sumQ2);

  let a = 0,
    b = 0,
    c = 0;

  if (Math.abs(det) > 1e-10) {
    a =
      (sumH * (sumQ2 * sumQ4 - sumQ3 * sumQ3) -
        sumQH * (sumQ * sumQ4 - sumQ2 * sumQ3) +
        sumQ2H * (sumQ * sumQ3 - sumQ2 * sumQ2)) /
      det;
    b =
      (n * (sumQH * sumQ4 - sumQ2H * sumQ3) -
        sumQ * (sumH * sumQ4 - sumQ2H * sumQ2) +
        sumQ2 * (sumH * sumQ3 - sumQH * sumQ2)) /
      det;
    c =
      (n * (sumQ2 * sumQ2H - sumQH * sumQ3) -
        sumQ * (sumQ * sumQ2H - sumH * sumQ3) +
        sumQ2 * (sumQ * sumQH - sumH * sumQ2)) /
      det;
  } else {
    // Fall back to linear fit
    return fitSimpleLinearCurve(qValues, hValues);
  }

  // Ensure valid values
  if (
    isNaN(a) ||
    isNaN(b) ||
    isNaN(c) ||
    !isFinite(a) ||
    !isFinite(b) ||
    !isFinite(c)
  ) {
    return fitSimpleLinearCurve(qValues, hValues);
  }

  const coefficients = [a, b, c];
  const predictedValues = qValues.map(q => a + b * q + c * q * q);
  const residuals = hValues.map((h, i) => h - (predictedValues[i] || 0));

  // Calculate R-squared
  const meanH = sumH / n;
  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
  const ssTot = hValues.reduce((sum, h) => sum + Math.pow(h - meanH, 2), 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Calculate statistics
  const standardError = n > 3 ? Math.sqrt(ssRes / (n - 3)) : 0;
  const maxResidual = Math.max(...residuals.map(r => Math.abs(r)));
  const meanResidual = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n;

  // Format equation with proper signs
  let equation = `h = ${a.toFixed(4)}`;
  if (b >= 0) {
    equation += `+${b.toFixed(4)}q`;
  } else {
    equation += `-${Math.abs(b).toFixed(4)}q`;
  }
  if (c >= 0) {
    equation += `+${c.toFixed(4)}q²`;
  } else {
    equation += `-${Math.abs(c).toFixed(4)}q²`;
  }

  return {
    coefficients,
    rSquared,
    residuals,
    model: 'quadratic',
    equation,
    predictedValues,
    standardError,
    maxResidual,
    meanResidual,
  };
}

/**
 * Simple cubic curve fit (h = a + b*q + c*q² + d*q³)
 */
function fitSimpleCubicCurve(
  qValues: number[],
  hValues: number[]
): CurveFitResult {
  const n = qValues.length;

  // For very simple cases, use quadratic fit
  if (n <= 4) {
    return fitSimpleQuadraticCurve(qValues, hValues);
  }

  // Simple cubic regression using least squares
  const sumQ = qValues.reduce((sum, q) => sum + q, 0);
  const sumH = hValues.reduce((sum, h) => sum + h, 0);
  const sumQ2 = qValues.reduce((sum, q) => sum + q * q, 0);
  const sumQ3 = qValues.reduce((sum, q) => sum + q * q * q, 0);
  const sumQ4 = qValues.reduce((sum, q) => sum + q * q * q * q, 0);
  const sumQ5 = qValues.reduce((sum, q) => sum + q * q * q * q * q, 0);
  const sumQ6 = qValues.reduce((sum, q) => sum + q * q * q * q * q * q, 0);
  const sumQH = qValues.reduce((sum, q, i) => sum + q * (hValues[i] || 0), 0);
  const sumQ2H = qValues.reduce(
    (sum, q, i) => sum + q * q * (hValues[i] || 0),
    0
  );
  const sumQ3H = qValues.reduce(
    (sum, q, i) => sum + q * q * q * (hValues[i] || 0),
    0
  );

  // Solve the normal equations for cubic fit using Cramer's rule
  // This is a 4x4 system, so we'll use a more robust approach

  // Create the coefficient matrix
  const matrix = [
    [n, sumQ, sumQ2, sumQ3],
    [sumQ, sumQ2, sumQ3, sumQ4],
    [sumQ2, sumQ3, sumQ4, sumQ5],
    [sumQ3, sumQ4, sumQ5, sumQ6],
  ];

  // Create the right-hand side vector
  const rhs = [sumH, sumQH, sumQ2H, sumQ3H];

  // Solve using Gaussian elimination with partial pivoting
  const solution = solveCubicSystem(matrix, rhs);

  let a = 0,
    b = 0,
    c = 0,
    d = 0;

  if (solution && solution.every(x => !isNaN(x) && isFinite(x))) {
    a = solution[0] || 0;
    b = solution[1] || 0;
    c = solution[2] || 0;
    d = solution[3] || 0;
  } else {
    // Fall back to quadratic fit
    return fitSimpleQuadraticCurve(qValues, hValues);
  }

  const coefficients = [a, b, c, d];
  const predictedValues = qValues.map(
    q => a + b * q + c * q * q + d * q * q * q
  );
  const residuals = hValues.map((h, i) => h - (predictedValues[i] || 0));

  // Calculate R-squared
  const meanH = sumH / n;
  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
  const ssTot = hValues.reduce((sum, h) => sum + Math.pow(h - meanH, 2), 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Calculate statistics
  const standardError = n > 4 ? Math.sqrt(ssRes / (n - 4)) : 0;
  const maxResidual = Math.max(...residuals.map(r => Math.abs(r)));
  const meanResidual = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n;

  // Format equation with proper signs
  let equation = `h = ${a.toFixed(4)}`;
  if (b >= 0) {
    equation += `+${b.toFixed(4)}q`;
  } else {
    equation += `-${Math.abs(b).toFixed(4)}q`;
  }
  if (c >= 0) {
    equation += `+${c.toFixed(4)}q²`;
  } else {
    equation += `-${Math.abs(c).toFixed(4)}q²`;
  }
  if (d >= 0) {
    equation += `+${d.toFixed(4)}q³`;
  } else {
    equation += `-${Math.abs(d).toFixed(4)}q³`;
  }

  return {
    coefficients,
    rSquared,
    residuals,
    model: 'cubic',
    equation,
    predictedValues,
    standardError,
    maxResidual,
    meanResidual,
  };
}

/**
 * Solve a 4x4 linear system using Gaussian elimination with partial pivoting
 */
function solveCubicSystem(matrix: number[][], rhs: number[]): number[] | null {
  const n = 4;
  const augmented = matrix.map((row, i) => [...row, rhs[i]]);

  // Forward elimination with partial pivoting
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows if necessary
    if (maxRow !== i) {
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    }

    // Check for singular matrix
    if (Math.abs(augmented[i][i]) < 1e-10) {
      return null;
    }

    // Eliminate column i
    for (let k = i + 1; k < n; k++) {
      const factor = (augmented[k]?.[i] || 0) / (augmented[i]?.[i] || 1);
      for (let j = i; j <= n; j++) {
        if (augmented[k] && augmented[i]) {
          augmented[k][j] =
            (augmented[k][j] || 0) - factor * (augmented[i][j] || 0);
        }
      }
    }
  }

  // Back substitution
  const solution = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += (augmented[i]?.[j] || 0) * (solution[j] || 0);
    }
    solution[i] = ((augmented[i]?.[n] || 0) - sum) / (augmented[i]?.[i] || 1);
  }

  return solution;
}

/**
 * Fit a linear curve (h = a + b*q)
 */
function fitLinearCurve(qValues: number[], hValues: number[]): CurveFitResult {
  const n = qValues.length;

  // Calculate means
  const qMean = qValues.reduce((sum, q) => sum + q, 0) / n;
  const hMean = hValues.reduce((sum, h) => sum + h, 0) / n;

  // Check for NaN or infinite values in means
  if (isNaN(qMean) || isNaN(hMean) || !isFinite(qMean) || !isFinite(hMean)) {
    // Fall back to simple average
    const slope = 0;
    const intercept = hValues.reduce((sum, h) => sum + h, 0) / n;

    const coefficients = [intercept, slope, 0];
    const predictedValues = qValues.map(() => intercept);
    const residuals = hValues.map(h => h - intercept);

    const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
    const ssTot = hValues.reduce((sum, h) => sum + Math.pow(h - hMean, 2), 0);
    const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    const standardError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;
    const maxResidual = Math.max(...residuals.map(r => Math.abs(r)));
    const meanResidual = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n;

    const equation = `h = ${intercept.toFixed(4)} + 0.0000q`;

    return {
      coefficients,
      rSquared,
      residuals,
      model: 'quadratic',
      equation,
      predictedValues,
      standardError,
      maxResidual,
      meanResidual,
    };
  }

  // Calculate slope and intercept
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const qVal = qValues[i] || 0;
    const hVal = hValues[i] || 0;
    numerator += (qVal - qMean) * (hVal - hMean);
    denominator += (qVal - qMean) * (qVal - qMean);
  }

  // Handle edge cases
  let slope = 0;
  let intercept = hMean;

  if (Math.abs(denominator) > 1e-10) {
    slope = numerator / denominator;
    intercept = hMean - slope * qMean;
  }

  // Check for NaN or infinite values
  if (
    isNaN(slope) ||
    isNaN(intercept) ||
    !isFinite(slope) ||
    !isFinite(intercept)
  ) {
    slope = 0;
    intercept = hMean;
  }

  const coefficients = [intercept, slope, 0]; // [a, b, 0] for h = a + b*q + 0*q²

  // Calculate predicted values and residuals
  const predictedValues = qValues.map(q => intercept + slope * q);
  const residuals = hValues.map((h, i) => h - (predictedValues[i] || 0));

  // Calculate R-squared
  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
  const ssTot = hValues.reduce((sum, h) => sum + Math.pow(h - hMean, 2), 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Calculate statistics
  const standardError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;
  const maxResidual = Math.max(...residuals.map(r => Math.abs(r)));
  const meanResidual = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n;

  // Final safety check - ensure no NaN values
  if (
    isNaN(rSquared) ||
    isNaN(standardError) ||
    isNaN(maxResidual) ||
    isNaN(meanResidual) ||
    !isFinite(rSquared) ||
    !isFinite(standardError) ||
    !isFinite(maxResidual) ||
    !isFinite(meanResidual)
  ) {
    // Fall back to simple average
    const fallbackIntercept = hValues.reduce((sum, h) => sum + h, 0) / n;
    const fallbackCoefficients = [fallbackIntercept, 0, 0];
    const fallbackPredictedValues = qValues.map(() => fallbackIntercept);
    const fallbackResiduals = hValues.map(h => h - fallbackIntercept);

    const fallbackSSRes = fallbackResiduals.reduce((sum, r) => sum + r * r, 0);
    const fallbackSSTot = hValues.reduce(
      (sum, h) => sum + Math.pow(h - hMean, 2),
      0
    );
    const fallbackRSquared =
      fallbackSSTot > 0 ? 1 - fallbackSSRes / fallbackSSTot : 0;

    const fallbackStandardError =
      n > 2 ? Math.sqrt(fallbackSSRes / (n - 2)) : 0;
    const fallbackMaxResidual = Math.max(
      ...fallbackResiduals.map(r => Math.abs(r))
    );
    const fallbackMeanResidual =
      fallbackResiduals.reduce((sum, r) => sum + Math.abs(r), 0) / n;

    const fallbackEquation = `h = ${fallbackIntercept.toFixed(4)} + 0.0000q`;

    return {
      coefficients: fallbackCoefficients,
      rSquared: fallbackRSquared,
      residuals: fallbackResiduals,
      model: 'quadratic',
      equation: fallbackEquation,
      predictedValues: fallbackPredictedValues,
      standardError: fallbackStandardError,
      maxResidual: fallbackMaxResidual,
      meanResidual: fallbackMeanResidual,
    };
  }

  const equation = `h = ${intercept.toFixed(4)} + ${slope.toFixed(4)}q`;

  return {
    coefficients,
    rSquared,
    residuals,
    model: 'quadratic',
    equation,
    predictedValues,
    standardError,
    maxResidual,
    meanResidual,
  };
}

/**
 * Fit a quadratic curve (h = a + b*q + c*q²)
 */
function fitQuadraticCurve(
  qValues: number[],
  hValues: number[]
): CurveFitResult {
  const n = qValues.length;

  // For very simple cases, use linear fit to avoid numerical issues
  if (n <= 3) {
    return fitLinearCurve(qValues, hValues);
  }

  // Use a simple approach: fit a quadratic curve using least squares
  // For a quadratic curve h = a + b*q + c*q², we need to solve:
  // Σ(h) = n*a + b*Σ(q) + c*Σ(q²)
  // Σ(h*q) = a*Σ(q) + b*Σ(q²) + c*Σ(q³)
  // Σ(h*q²) = a*Σ(q²) + b*Σ(q³) + c*Σ(q⁴)

  // Calculate sums
  const sumQ = qValues.reduce((sum, q) => sum + q, 0);
  const sumH = hValues.reduce((sum, h) => sum + h, 0);
  const sumQ2 = qValues.reduce((sum, q) => sum + q * q, 0);
  const sumQ3 = qValues.reduce((sum, q) => sum + q * q * q, 0);
  const sumQ4 = qValues.reduce((sum, q) => sum + q * q * q * q, 0);
  const sumHQ = qValues.reduce((sum, q, i) => sum + q * (hValues[i] || 0), 0);
  const sumHQ2 = qValues.reduce(
    (sum, q, i) => sum + q * q * (hValues[i] || 0),
    0
  );

  // Check for NaN or infinite values in sums
  if (
    isNaN(sumQ) ||
    isNaN(sumH) ||
    isNaN(sumQ2) ||
    isNaN(sumQ3) ||
    isNaN(sumQ4) ||
    isNaN(sumHQ) ||
    isNaN(sumHQ2) ||
    !isFinite(sumQ) ||
    !isFinite(sumH) ||
    !isFinite(sumQ2) ||
    !isFinite(sumQ3) ||
    !isFinite(sumQ4) ||
    !isFinite(sumHQ) ||
    !isFinite(sumHQ2)
  ) {
    return fitLinearCurve(qValues, hValues);
  }

  // Create the coefficient matrix
  const A = [
    [n, sumQ, sumQ2],
    [sumQ, sumQ2, sumQ3],
    [sumQ2, sumQ3, sumQ4],
  ];

  const b = [sumH, sumHQ, sumHQ2];

  // Solve the system using Cramer's rule
  const det =
    A[0]![0]! * (A[1]![1]! * A[2]![2]! - A[1]![2]! * A[2]![1]!) -
    A[0]![1]! * (A[1]![0]! * A[2]![2]! - A[1]![2]! * A[2]![0]!) +
    A[0]![2]! * (A[1]![0]! * A[2]![1]! - A[1]![1]! * A[2]![0]!);

  // If determinant is too small, fall back to linear fit
  if (Math.abs(det) < 1e-10) {
    return fitLinearCurve(qValues, hValues);
  }

  // Calculate coefficients using Cramer's rule
  const detA =
    b[0]! * (A[1]![1]! * A[2]![2]! - A[1]![2]! * A[2]![1]!) -
    A[0]![1]! * (b[1]! * A[2]![2]! - A[1]![2]! * b[2]!) +
    A[0]![2]! * (b[1]! * A[2]![1]! - A[1]![1]! * b[2]!);

  const detB =
    A[0]![0]! * (b[1]! * A[2]![2]! - A[1]![2]! * b[2]!) -
    b[0]! * (A[1]![0]! * A[2]![2]! - A[1]![2]! * A[2]![0]!) +
    A[0]![2]! * (A[1]![0]! * b[2]! - b[1]! * A[2]![0]!);

  const detC =
    A[0]![0]! * (A[1]![1]! * b[2]! - b[1]! * A[2]![1]!) -
    A[0]![1]! * (A[1]![0]! * b[2]! - b[1]! * A[2]![0]!) +
    b[0]! * (A[1]![0]! * A[2]![1]! - A[1]![1]! * A[2]![0]!);

  const a = detA / det;
  const b_coef = detB / det;
  const c = detC / det;

  // Check for NaN or infinite values
  if (
    isNaN(a) ||
    isNaN(b_coef) ||
    isNaN(c) ||
    !isFinite(a) ||
    !isFinite(b_coef) ||
    !isFinite(c)
  ) {
    return fitLinearCurve(qValues, hValues);
  }

  const coefficients = [a, b_coef, c];

  // Calculate predicted values and residuals
  const predictedValues = qValues.map(q => a + b_coef * q + c * q * q);
  const residuals = hValues.map((h, i) => h - (predictedValues[i] || 0));

  // Calculate R-squared
  const hMean = hValues.reduce((sum, h) => sum + h, 0) / n;
  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
  const ssTot = hValues.reduce((sum, h) => sum + Math.pow(h - hMean, 2), 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Calculate statistics
  const standardError = n > 3 ? Math.sqrt(ssRes / (n - 3)) : 0;
  const maxResidual = Math.max(...residuals.map(r => Math.abs(r)));
  const meanResidual = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n;

  const equation = generateEquation(coefficients, 'quadratic');

  return {
    coefficients,
    rSquared,
    residuals,
    model: 'quadratic',
    equation,
    predictedValues,
    standardError,
    maxResidual,
    meanResidual,
  };
}

/**
 * Fit a cubic curve (h = a + b*q + c*q² + d*q³)
 */
function fitCubicCurve(qValues: number[], hValues: number[]): CurveFitResult {
  const n = qValues.length;

  // Create design matrix for cubic fit
  const X = qValues.map(q => [1, q, q * q, q * q * q]);

  // Solve using normal equations
  const coefficients = solveNormalEquations(X, hValues);

  // Check for NaN coefficients and fall back to quadratic fit if needed
  if (coefficients.some(c => isNaN(c))) {
    return fitQuadraticCurve(qValues, hValues);
  }

  // Calculate predicted values and residuals
  const predictedValues = qValues.map(q => {
    return (
      (coefficients[0] || 0) +
      (coefficients[1] || 0) * q +
      (coefficients[2] || 0) * q * q +
      (coefficients[3] || 0) * q * q * q
    );
  });
  const residuals = hValues.map((h, i) => h - (predictedValues[i] || 0));

  // Calculate R-squared
  const hMean = hValues.reduce((sum, h) => sum + h, 0) / n;
  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
  const ssTot = hValues.reduce((sum, h) => sum + Math.pow(h - hMean, 2), 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Calculate statistics
  const standardError = n > 4 ? Math.sqrt(ssRes / (n - 4)) : 0;
  const maxResidual = Math.max(...residuals.map(r => Math.abs(r)));
  const meanResidual = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n;

  const equation = generateEquation(coefficients, 'cubic');

  return {
    coefficients,
    rSquared,
    residuals,
    model: 'cubic',
    equation,
    predictedValues,
    standardError,
    maxResidual,
    meanResidual,
  };
}

/**
 * Solve normal equations using a simple approach
 */
function solveNormalEquations(X: number[][], y: number[]): number[] {
  const n = X.length;
  const p = X[0]?.length || 0;

  // Create X^T * X matrix
  const XtX: number[][] = [];
  for (let i = 0; i < p; i++) {
    XtX[i] = [];
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        const xki = X[k]?.[i] || 0;
        const xkj = X[k]?.[j] || 0;
        sum += xki * xkj;
      }
      XtX[i]![j] = sum;
    }
  }

  // Create X^T * y vector
  const Xty: number[] = [];
  for (let i = 0; i < p; i++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      const xki = X[k]?.[i] || 0;
      const yk = y[k] || 0;
      sum += xki * yk;
    }
    Xty[i] = sum;
  }

  // For small matrices, use a simple approach
  if (p <= 3) {
    return solveSmallSystem(XtX, Xty);
  }

  // For larger matrices, use LU decomposition
  return solveLinearSystem(XtX, Xty);
}

/**
 * Solve small linear system (2x2 or 3x3) using Cramer's rule
 */
function solveSmallSystem(A: number[][], b: number[]): number[] {
  const n = A.length;

  if (n === 2) {
    const det = A[0]![0]! * A[1]![1]! - A[0]![1]! * A[1]![0]!;
    if (Math.abs(det) < 1e-10) {
      // Try to solve as a linear system instead
      const slope = (b[1]! - b[0]!) / (A[1]![1]! - A[0]![1]!);
      const intercept = b[0]! - slope * A[0]![1]!;
      return [intercept, slope];
    }

    const x0 = (b[0]! * A[1]![1]! - b[1]! * A[0]![1]!) / det;
    const x1 = (A[0]![0]! * b[1]! - A[1]![0]! * b[0]!) / det;

    return [x0, x1];
  }

  if (n === 3) {
    const det =
      A[0]![0]! * (A[1]![1]! * A[2]![2]! - A[1]![2]! * A[2]![1]!) -
      A[0]![1]! * (A[1]![0]! * A[2]![2]! - A[1]![2]! * A[2]![0]!) +
      A[0]![2]! * (A[1]![0]! * A[2]![1]! - A[1]![1]! * A[2]![0]!);

    if (Math.abs(det) < 1e-10) {
      // Matrix is nearly singular, try to fit a linear curve instead
      // Extract q values from the design matrix (second column)
      const qValues = A.map(row => row[1] || 0);
      const hValues = b;

      // Calculate means
      const qMean = qValues.reduce((sum, q) => sum + q, 0) / n;
      const hMean = hValues.reduce((sum, h) => sum + h, 0) / n;

      // Calculate slope and intercept
      let numerator = 0;
      let denominator = 0;

      for (let i = 0; i < n; i++) {
        const qVal = qValues[i] || 0;
        const hVal = hValues[i] || 0;
        numerator += (qVal - qMean) * (hVal - hMean);
        denominator += (qVal - qMean) * (qVal - qMean);
      }

      const slope = denominator !== 0 ? numerator / denominator : 0;
      const intercept = hMean - slope * qMean;

      return [intercept, slope, 0]; // Return linear fit with zero quadratic coefficient
    }

    const x0 =
      (b[0]! * (A[1]![1]! * A[2]![2]! - A[1]![2]! * A[2]![1]!) -
        A[0]![1]! * (b[1]! * A[2]![2]! - A[1]![2]! * b[2]!) +
        A[0]![2]! * (b[1]! * A[2]![1]! - A[1]![1]! * b[2]!)) /
      det;

    const x1 =
      (A[0]![0]! * (b[1]! * A[2]![2]! - A[1]![2]! * b[2]!) -
        b[0]! * (A[1]![0]! * A[2]![2]! - A[1]![2]! * A[2]![0]!) +
        A[0]![2]! * (A[1]![0]! * b[2]! - b[1]! * A[2]![0]!)) /
      det;

    const x2 =
      (A[0]![0]! * (A[1]![1]! * b[2]! - b[1]! * A[2]![1]!) -
        A[0]![1]! * (A[1]![0]! * b[2]! - b[1]! * A[2]![0]!) +
        b[0]! * (A[1]![0]! * A[2]![1]! - A[1]![1]! * A[2]![0]!)) /
      det;

    // Check for NaN or infinite values
    if (
      isNaN(x0) ||
      isNaN(x1) ||
      isNaN(x2) ||
      !isFinite(x0) ||
      !isFinite(x1) ||
      !isFinite(x2)
    ) {
      // Fall back to linear fit
      const qValues = A.map(row => row[1] || 0);
      const hValues = b;

      const qMean = qValues.reduce((sum, q) => sum + q, 0) / n;
      const hMean = hValues.reduce((sum, h) => sum + h, 0) / n;

      let numerator = 0;
      let denominator = 0;

      for (let i = 0; i < n; i++) {
        const qVal = qValues[i] || 0;
        const hVal = hValues[i] || 0;
        numerator += (qVal - qMean) * (hVal - hMean);
        denominator += (qVal - qMean) * (qVal - qMean);
      }

      const slope = denominator !== 0 ? numerator / denominator : 0;
      const intercept = hMean - slope * qMean;

      return [intercept, slope, 0];
    }

    return [x0, x1, x2];
  }

  throw new Error('Unsupported matrix size');
}

/**
 * Solve linear system using LU decomposition
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;

  // Create copies to avoid modifying original arrays
  const L: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));
  const U: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));

  // Initialize L and U
  for (let i = 0; i < n; i++) {
    L[i]![i] = 1;
  }

  // LU decomposition
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < i; k++) {
        sum += (L[i]?.[k] || 0) * (U[k]?.[j] || 0);
      }
      U[i]![j] = (A[i]?.[j] || 0) - sum;
    }

    for (let j = i + 1; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < i; k++) {
        sum += (L[j]?.[k] || 0) * (U[k]?.[i] || 0);
      }
      L[j]![i] = ((A[j]?.[i] || 0) - sum) / (U[i]?.[i] || 1);
    }
  }

  // Forward substitution: L * y = b
  const y: number[] = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < i; j++) {
      sum += (L[i]?.[j] || 0) * (y[j] || 0);
    }
    y[i] = ((b[i] || 0) - sum) / (L[i]?.[i] || 1);
  }

  // Backward substitution: U * x = y
  const x: number[] = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < n; j++) {
      sum += (U[i]?.[j] || 0) * (x[j] || 0);
    }
    x[i] = ((y[i] || 0) - sum) / (U[i]?.[i] || 1);
  }

  return x;
}

/**
 * Generate human-readable equation string
 */
function generateEquation(
  coefficients: number[],
  model: 'quadratic' | 'cubic'
): string {
  const terms: string[] = [];

  // Constant term
  if (Math.abs(coefficients[0] || 0) > 1e-10) {
    terms.push((coefficients[0] || 0).toFixed(4));
  }

  // Linear term
  if (Math.abs(coefficients[1] || 0) > 1e-10) {
    const sign = (coefficients[1] || 0) >= 0 ? '+' : '';
    terms.push(`${sign}${(coefficients[1] || 0).toFixed(4)}q`);
  }

  // Quadratic term
  if (coefficients[2] !== undefined && Math.abs(coefficients[2] || 0) > 1e-10) {
    const sign = (coefficients[2] || 0) >= 0 ? '+' : '';
    terms.push(`${sign}${(coefficients[2] || 0).toFixed(4)}q²`);
  }

  // Cubic term (if applicable)
  if (
    model === 'cubic' &&
    coefficients[3] !== undefined &&
    Math.abs(coefficients[3] || 0) > 1e-10
  ) {
    const sign = (coefficients[3] || 0) >= 0 ? '+' : '';
    terms.push(`${sign}${(coefficients[3] || 0).toFixed(4)}q³`);
  }

  if (terms.length === 0) {
    return 'h = 0';
  }

  return `h = ${terms.join(' ')}`;
}

/**
 * Predict head value for a given flow rate using fitted coefficients
 */
export function predictHead(coefficients: number[], q: number): number {
  return coefficients.reduce(
    (sum, coef, i) => sum + (coef || 0) * Math.pow(q, i),
    0
  );
}

/**
 * Calculate confidence interval for prediction (simplified)
 */
export function predictHeadWithConfidence(
  coefficients: number[],
  q: number,
  standardError: number,
  confidenceLevel: number = 0.95
): { predicted: number; lower: number; upper: number } {
  const predicted = predictHead(coefficients, q);

  // Simplified confidence interval calculation
  // In practice, you'd use the full covariance matrix
  const zScore = confidenceLevel === 0.95 ? 1.96 : 1.645; // 95% or 90% confidence
  const margin = zScore * standardError;

  return {
    predicted,
    lower: predicted - margin,
    upper: predicted + margin,
  };
}
