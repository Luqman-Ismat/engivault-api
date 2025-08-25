/**
 * Calculate Reynolds number for pipe flow
 * Re = ρVD/μ
 * @param rho - Fluid density (kg/m³)
 * @param v - Flow velocity (m/s)
 * @param D - Pipe diameter (m)
 * @param mu - Dynamic viscosity (Pa·s)
 * @returns Reynolds number (dimensionless)
 */
export function reynolds(
  rho: number,
  v: number,
  D: number,
  mu: number
): number {
  return (rho * v * D) / mu;
}

/**
 * Calculate friction factor using Churchill correlation
 * Valid for all Reynolds numbers and relative roughness
 * @param Re - Reynolds number
 * @param epsOverD - Relative roughness (ε/D)
 * @returns Darcy friction factor
 */
export function churchillF(Re: number, epsOverD: number): number {
  // Avoid division by zero
  if (Re === 0) {
    throw new Error('Reynolds number cannot be zero');
  }

  // Calculate A and B terms for Churchill correlation
  const A = Math.pow(
    2.457 * Math.log(Math.pow(1 / (7 / Re), 0.9) + 0.27 * epsOverD),
    16
  );
  const B = Math.pow(37530 / Re, 16);

  // Churchill friction factor
  const f =
    8 * Math.pow(Math.pow(8 / Re, 12) + 1 / Math.pow(A + B, 1.5), 1 / 12);

  return f;
}

/**
 * Calculate pressure drop using Darcy-Weisbach equation
 * ΔP = f * (L/D) * (ρV²/2)
 * @param rho - Fluid density (kg/m³)
 * @param v - Flow velocity (m/s)
 * @param L - Pipe length (m)
 * @param D - Pipe diameter (m)
 * @param f - Darcy friction factor
 * @returns Pressure drop (Pa)
 */
export function darcyWeisbachDP(
  rho: number,
  v: number,
  L: number,
  D: number,
  f: number
): number {
  return (f * (L / D) * (rho * v * v)) / 2;
}

/**
 * Calculate pressure drop with automatic friction factor calculation
 * @param rho - Fluid density (kg/m³)
 * @param v - Flow velocity (m/s)
 * @param L - Pipe length (m)
 * @param D - Pipe diameter (m)
 * @param mu - Dynamic viscosity (Pa·s)
 * @param epsOverD - Relative roughness (ε/D)
 * @returns Pressure drop (Pa)
 */
export function pressureDrop(
  rho: number,
  v: number,
  L: number,
  D: number,
  mu: number,
  epsOverD: number
): number {
  const Re = reynolds(rho, v, D, mu);
  const f = churchillF(Re, epsOverD);
  return darcyWeisbachDP(rho, v, L, D, f);
}

/**
 * Calculate friction factor using Colebrook-White equation (iterative)
 * More accurate than Churchill but requires iteration
 * @param Re - Reynolds number
 * @param epsOverD - Relative roughness (ε/D)
 * @param tolerance - Convergence tolerance (default: 1e-6)
 * @param maxIterations - Maximum iterations (default: 100)
 * @returns Darcy friction factor
 */
export function colebrookWhiteF(
  Re: number,
  epsOverD: number,
  tolerance: number = 1e-6,
  maxIterations: number = 100
): number {
  if (Re === 0) {
    throw new Error('Reynolds number cannot be zero');
  }

  // Initial guess using Swamee-Jain approximation
  let f =
    0.25 / Math.pow(Math.log10(epsOverD / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);

  // Iterative solution of Colebrook-White equation
  for (let i = 0; i < maxIterations; i++) {
    const fOld = f;
    const term1 = epsOverD / 3.7;
    const term2 = 2.51 / (Re * Math.sqrt(f));
    f = 1 / Math.pow(2 * Math.log10(term1 + term2), 2);

    if (Math.abs(f - fOld) < tolerance) {
      return f;
    }
  }

  throw new Error('Colebrook-White iteration did not converge');
}

/**
 * Calculate friction factor using Swamee-Jain approximation
 * Explicit equation, good for Re > 4000
 * @param Re - Reynolds number
 * @param epsOverD - Relative roughness (ε/D)
 * @returns Darcy friction factor
 */
export function swameeJainF(Re: number, epsOverD: number): number {
  if (Re === 0) {
    throw new Error('Reynolds number cannot be zero');
  }

  return (
    0.25 / Math.pow(Math.log10(epsOverD / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2)
  );
}

/**
 * Calculate friction factor using Haaland approximation
 * Explicit equation, good for Re > 4000
 * @param Re - Reynolds number
 * @param epsOverD - Relative roughness (ε/D)
 * @returns Darcy friction factor
 */
export function haalandF(Re: number, epsOverD: number): number {
  if (Re === 0) {
    throw new Error('Reynolds number cannot be zero');
  }

  return (
    1 /
    Math.pow(-1.8 * Math.log10(Math.pow(epsOverD / 3.7, 1.11) + 6.9 / Re), 2)
  );
}

/**
 * Determine flow regime based on Reynolds number
 * @param Re - Reynolds number
 * @returns Flow regime description
 */
export function flowRegime(Re: number): string {
  if (Re < 2300) {
    return 'laminar';
  } else if (Re < 4000) {
    return 'transition';
  } else {
    return 'turbulent';
  }
}

/**
 * Calculate laminar flow friction factor (f = 64/Re)
 * @param Re - Reynolds number
 * @returns Darcy friction factor
 */
export function laminarF(Re: number): number {
  if (Re === 0) {
    throw new Error('Reynolds number cannot be zero');
  }
  return 64 / Re;
}

/**
 * Calculate pressure drop for laminar flow (Hagen-Poiseuille)
 * ΔP = 32μVL/D²
 * @param mu - Dynamic viscosity (Pa·s)
 * @param v - Flow velocity (m/s)
 * @param L - Pipe length (m)
 * @param D - Pipe diameter (m)
 * @returns Pressure drop (Pa)
 */
export function laminarPressureDrop(
  mu: number,
  v: number,
  L: number,
  D: number
): number {
  return (32 * mu * v * L) / (D * D);
}
