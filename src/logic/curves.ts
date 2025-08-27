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
export function fitPumpCurve(points: CurvePoint[], model: 'quadratic' | 'cubic'): CurveFitResult {
  if (model === 'quadratic' && points.length < 3) {
    throw new Error('At least 3 points are required for quadratic fitting');
  }

  if (model === 'cubic' && points.length < 4) {
    throw new Error('At least 4 points are required for cubic fitting');
  }

  // Extract flow rates (q) and head values (h)
  const qValues = points.map(p => p.q);
  const hValues = points.map(p => p.h);

  // Normalize flow rates to improve numerical stability
  const qMean = qValues.reduce((sum, q) => sum + q, 0) / qValues.length;
  const qStd = Math.sqrt(qValues.reduce((sum, q) => sum + Math.pow(q - qMean, 2), 0) / qValues.length);
  const normalizedQ = qValues.map(q => (q - qMean) / qStd);

  // Create design matrix
  const degree = model === 'quadratic' ? 2 : 3;
  const designMatrix = normalizedQ.map(q => {
    const row = [1]; // Constant term
    for (let i = 1; i <= degree; i++) {
      row.push(Math.pow(q, i));
    }
    return row;
  });

  // Solve normal equations: (X^T * X) * beta = X^T * y
  const coefficients = solveNormalEquations(designMatrix, hValues);

  // Calculate predicted values
  const predictedValues = designMatrix.map(row => {
    return row.reduce((sum, val, i) => sum + val * coefficients[i], 0);
  });

  // Calculate residuals
  const residuals = hValues.map((actual, i) => actual - predictedValues[i]);

  // Calculate R-squared
  const ssRes = residuals.reduce((sum, residual) => sum + residual * residual, 0);
  const hMean = hValues.reduce((sum, h) => sum + h, 0) / hValues.length;
  const ssTot = hValues.reduce((sum, h) => sum + Math.pow(h - hMean, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);

  // Calculate standard error
  const n = points.length;
  const p = degree + 1; // Number of parameters
  const degreesOfFreedom = n - p;
  const standardError = degreesOfFreedom > 0 ? Math.sqrt(ssRes / degreesOfFreedom) : 0;

  // Calculate residual statistics
  const maxResidual = Math.max(...residuals.map(r => Math.abs(r)));
  const meanResidual = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / residuals.length;

  // Convert coefficients back to original scale
  const originalCoefficients = convertToOriginalScale(coefficients, qMean, qStd, degree);

  // Generate human-readable equation
  const equation = generateEquation(originalCoefficients, model);

  return {
    coefficients: originalCoefficients,
    rSquared,
    residuals,
    model,
    equation,
    predictedValues,
    standardError,
    maxResidual,
    meanResidual
  };
}

/**
 * Solve normal equations using Gaussian elimination
 */
function solveNormalEquations(X: number[][], y: number[]): number[] {
  const n = X.length;
  const p = X[0].length;

  // Create augmented matrix [X^T * X | X^T * y]
  const augmentedMatrix: number[][] = [];
  
  for (let i = 0; i < p; i++) {
    const row: number[] = [];
    for (let j = 0; j < p; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * X[k][j];
      }
      row.push(sum);
    }
    
    // Add X^T * y component
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += X[k][i] * y[k];
    }
    row.push(sum);
    
    augmentedMatrix.push(row);
  }

  // Gaussian elimination with partial pivoting
  for (let i = 0; i < p; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < p; k++) {
      if (Math.abs(augmentedMatrix[k][i]) > Math.abs(augmentedMatrix[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    if (maxRow !== i) {
      [augmentedMatrix[i], augmentedMatrix[maxRow]] = [augmentedMatrix[maxRow], augmentedMatrix[i]];
    }

    // Eliminate column
    for (let k = i + 1; k < p; k++) {
      const factor = augmentedMatrix[k][i] / augmentedMatrix[i][i];
      for (let j = i; j <= p; j++) {
        augmentedMatrix[k][j] -= factor * augmentedMatrix[i][j];
      }
    }
  }

  // Back substitution
  const coefficients = new Array(p).fill(0);
  for (let i = p - 1; i >= 0; i--) {
    let sum = 0;
    for (let j = i + 1; j < p; j++) {
      sum += augmentedMatrix[i][j] * coefficients[j];
    }
    coefficients[i] = (augmentedMatrix[i][p] - sum) / augmentedMatrix[i][i];
  }

  return coefficients;
}

/**
 * Convert normalized coefficients back to original scale
 */
function convertToOriginalScale(
  normalizedCoefficients: number[], 
  qMean: number, 
  qStd: number, 
  degree: number
): number[] {
  // For a polynomial h = a + b*q + c*q² + d*q³ (if cubic)
  // After normalization: h = a' + b'*q' + c'*q'² + d'*q'³ where q' = (q - qMean)/qStd
  // We need to expand this back to the original form
  
  const originalCoefficients = new Array(degree + 1).fill(0);
  
  // Expand the normalized polynomial
  for (let i = 0; i <= degree; i++) {
    const normalizedCoef = normalizedCoefficients[i];
    if (normalizedCoef === 0) continue;
    
    // Expand (q - qMean)^i / qStd^i
    for (let j = 0; j <= i; j++) {
      const binomialCoef = binomialCoefficient(i, j);
      const power = i - j;
      const term = normalizedCoef * binomialCoef * Math.pow(-qMean, j) / Math.pow(qStd, i);
      originalCoefficients[power] += term;
    }
  }
  
  return originalCoefficients;
}

/**
 * Calculate binomial coefficient C(n, k)
 */
function binomialCoefficient(n: number, k: number): number {
  if (k > n - k) k = n - k;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= (n - i) / (i + 1);
  }
  return result;
}

/**
 * Generate human-readable equation string
 */
function generateEquation(coefficients: number[], model: 'quadratic' | 'cubic'): string {
  const terms: string[] = [];
  
  // Constant term
  if (Math.abs(coefficients[0]) > 1e-10) {
    terms.push(coefficients[0].toFixed(4));
  }
  
  // Linear term
  if (Math.abs(coefficients[1]) > 1e-10) {
    const sign = coefficients[1] >= 0 ? '+' : '';
    terms.push(`${sign}${coefficients[1].toFixed(4)}q`);
  }
  
  // Quadratic term
  if (coefficients[2] !== undefined && Math.abs(coefficients[2]) > 1e-10) {
    const sign = coefficients[2] >= 0 ? '+' : '';
    terms.push(`${sign}${coefficients[2].toFixed(4)}q²`);
  }
  
  // Cubic term (if applicable)
  if (model === 'cubic' && coefficients[3] !== undefined && Math.abs(coefficients[3]) > 1e-10) {
    const sign = coefficients[3] >= 0 ? '+' : '';
    terms.push(`${sign}${coefficients[3].toFixed(4)}q³`);
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
  return coefficients.reduce((sum, coef, i) => sum + coef * Math.pow(q, i), 0);
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
    upper: predicted + margin
  };
}
