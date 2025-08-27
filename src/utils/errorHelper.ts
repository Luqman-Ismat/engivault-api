import { FastifyReply } from 'fastify';

export interface ValidationError {
  field: string;
  value: any;
  constraint: string;
  message: string;
}

export interface ErrorHint {
  type:
    | 'endpoint_suggestion'
    | 'parameter_fix'
    | 'assumption_violation'
    | 'unit_conversion'
    | 'range_guidance';
  message: string;
  suggestedEndpoint?: string;
  suggestedValue?: any;
  validRange?: { min: number; max: number };
  unit?: string;
}

export interface EnhancedError {
  error: string;
  code: string;
  details?: any;
  hints?: ErrorHint[];
  validationErrors?: ValidationError[];
}

export class ErrorHelper {
  /**
   * Creates an enhanced error response with helpful hints
   */
  static createError(
    error: string,
    code: string,
    details?: any,
    hints?: ErrorHint[]
  ): EnhancedError {
    return {
      error,
      code,
      details,
      hints,
    };
  }

  /**
   * Adds Mach number violation hint for gas flow calculations
   */
  static addMachViolationHint(
    mach: number,
    hints: ErrorHint[] = []
  ): ErrorHint[] {
    if (mach > 0.3) {
      hints.push({
        type: 'assumption_violation',
        message: `Mach number (${mach.toFixed(3)}) exceeds 0.3. Compressible flow effects are significant.`,
        suggestedEndpoint: '/api/v1/gas/pressure-drop',
        validRange: { min: 0, max: 0.3 },
      });
    }
    return hints;
  }

  /**
   * Adds Reynolds number violation hint for flow regime
   */
  static addReynoldsViolationHint(
    reynolds: number,
    hints: ErrorHint[] = []
  ): ErrorHint[] {
    if (reynolds < 2300) {
      hints.push({
        type: 'assumption_violation',
        message: `Reynolds number (${reynolds.toFixed(0)}) indicates laminar flow. Darcy-Weisbach equation assumes turbulent flow.`,
        validRange: { min: 4000, max: 100000000 },
      });
    } else if (reynolds < 4000) {
      hints.push({
        type: 'assumption_violation',
        message: `Reynolds number (${reynolds.toFixed(0)}) is in transition region. Results may be unreliable.`,
        validRange: { min: 4000, max: 100000000 },
      });
    }
    return hints;
  }

  /**
   * Adds relative roughness violation hint
   */
  static addRoughnessViolationHint(
    relativeRoughness: number,
    hints: ErrorHint[] = []
  ): ErrorHint[] {
    if (relativeRoughness > 0.05) {
      hints.push({
        type: 'assumption_violation',
        message: `Relative roughness (${relativeRoughness.toFixed(6)}) exceeds 0.05. Results may be unreliable.`,
        validRange: { min: 0, max: 0.05 },
      });
    }
    return hints;
  }

  /**
   * Adds pipe diameter range violation hint
   */
  static addDiameterViolationHint(
    diameter: number,
    hints: ErrorHint[] = []
  ): ErrorHint[] {
    if (diameter < 0.01) {
      hints.push({
        type: 'assumption_violation',
        message: `Pipe diameter (${diameter} m) is very small. Consider microfluidics correlations.`,
        validRange: { min: 0.01, max: 2.0 },
      });
    } else if (diameter > 2.0) {
      hints.push({
        type: 'assumption_violation',
        message: `Pipe diameter (${diameter} m) is very large. Consider open channel flow.`,
        validRange: { min: 0.01, max: 2.0 },
      });
    }
    return hints;
  }

  /**
   * Adds velocity range violation hint
   */
  static addVelocityViolationHint(
    velocity: number,
    hints: ErrorHint[] = []
  ): ErrorHint[] {
    if (velocity < 0.1) {
      hints.push({
        type: 'assumption_violation',
        message: `Flow velocity (${velocity} m/s) is very low. Consider creeping flow.`,
        validRange: { min: 0.1, max: 50 },
      });
    } else if (velocity > 50) {
      hints.push({
        type: 'assumption_violation',
        message: `Flow velocity (${velocity} m/s) is very high. Consider compressible flow.`,
        suggestedEndpoint: '/api/v1/gas/pressure-drop',
        validRange: { min: 0.1, max: 50 },
      });
    }
    return hints;
  }

  /**
   * Adds NPSH violation hint
   */
  static addNPSHViolationHint(
    npsha: number,
    npshr: number,
    hints: ErrorHint[] = []
  ): ErrorHint[] {
    if (npsha < npshr) {
      hints.push({
        type: 'assumption_violation',
        message: `NPSHa (${npsha.toFixed(2)} m) is less than NPSHr (${npshr.toFixed(2)} m). Cavitation risk is high.`,
        suggestedValue: npshr + 1.0, // Suggest 1m safety margin
      });
    } else if (npsha < npshr + 1.0) {
      hints.push({
        type: 'assumption_violation',
        message: `NPSHa (${npsha.toFixed(2)} m) is close to NPSHr (${npshr.toFixed(2)} m). Consider increasing safety margin.`,
        suggestedValue: npshr + 1.0,
      });
    }
    return hints;
  }

  /**
   * Adds BEP distance violation hint
   */
  static addBEPViolationHint(
    bepDistance: number,
    hints: ErrorHint[] = []
  ): ErrorHint[] {
    if (bepDistance > 0.2) {
      hints.push({
        type: 'assumption_violation',
        message: `Operating point is far from BEP (distance: ${bepDistance.toFixed(3)}). Efficiency may be poor.`,
        validRange: { min: 0, max: 0.2 },
      });
    }
    return hints;
  }

  /**
   * Adds curve fitting violation hints
   */
  static addCurveFittingViolationHint(
    nPoints: number,
    model: string,
    rSquared: number,
    hints: ErrorHint[] = []
  ): ErrorHint[] {
    if (model === 'quadratic' && nPoints < 3) {
      hints.push({
        type: 'assumption_violation',
        message: `Quadratic fitting requires at least 3 points, but only ${nPoints} provided.`,
        suggestedValue: 3,
      });
    } else if (model === 'cubic' && nPoints < 4) {
      hints.push({
        type: 'assumption_violation',
        message: `Cubic fitting requires at least 4 points, but only ${nPoints} provided.`,
        suggestedValue: 4,
      });
    }

    if (rSquared < 0.9) {
      hints.push({
        type: 'assumption_violation',
        message: `R-squared (${rSquared.toFixed(3)}) indicates poor fit. Consider different model or more data points.`,
        validRange: { min: 0.9, max: 1.0 },
      });
    }

    return hints;
  }

  /**
   * Adds unit conversion hints
   */
  static addUnitConversionHint(
    fromUnit: string,
    toUnit: string,
    quantity: string,
    hints: ErrorHint[] = []
  ): ErrorHint[] {
    hints.push({
      type: 'unit_conversion',
      message: `Consider using /api/v1/utilities/convert for ${quantity} conversion from ${fromUnit} to ${toUnit}.`,
      suggestedEndpoint: '/api/v1/utilities/convert',
    });
    return hints;
  }

  /**
   * Adds parameter fix hints
   */
  static addParameterFixHint(
    field: string,
    currentValue: any,
    suggestedValue: any,
    reason: string,
    hints: ErrorHint[] = []
  ): ErrorHint[] {
    hints.push({
      type: 'parameter_fix',
      message: `${field} (${currentValue}): ${reason}`,
      suggestedValue,
    });
    return hints;
  }

  /**
   * Sends an enhanced error response
   */
  static sendError(
    reply: FastifyReply,
    statusCode: number,
    error: string,
    code: string,
    details?: any,
    hints?: ErrorHint[]
  ): void {
    const enhancedError = this.createError(error, code, details, hints);
    reply.status(statusCode).send(enhancedError);
  }

  /**
   * Creates a validation error with hints
   */
  static createValidationError(
    field: string,
    value: any,
    constraint: string,
    message: string,
    hints?: ErrorHint[]
  ): EnhancedError {
    return {
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      validationErrors: [{ field, value, constraint, message }],
      hints,
    };
  }

  /**
   * Adds common engineering calculation hints
   */
  static addEngineeringHints(
    calculationType: string,
    parameters: Record<string, any>,
    hints: ErrorHint[] = []
  ): ErrorHint[] {
    switch (calculationType) {
      case 'pressure_drop':
        if (parameters.reynolds) {
          this.addReynoldsViolationHint(parameters.reynolds, hints);
        }
        if (parameters.relativeRoughness) {
          this.addRoughnessViolationHint(parameters.relativeRoughness, hints);
        }
        if (parameters.diameter) {
          this.addDiameterViolationHint(parameters.diameter, hints);
        }
        if (parameters.velocity) {
          this.addVelocityViolationHint(parameters.velocity, hints);
        }
        break;

      case 'gas_flow':
        if (parameters.mach) {
          this.addMachViolationHint(parameters.mach, hints);
        }
        break;

      case 'npsh':
        if (parameters.npsha && parameters.npshr) {
          this.addNPSHViolationHint(parameters.npsha, parameters.npshr, hints);
        }
        break;

      case 'bep_check':
        if (parameters.bepDistance) {
          this.addBEPViolationHint(parameters.bepDistance, hints);
        }
        break;

      case 'curve_fit':
        if (parameters.nPoints && parameters.model && parameters.rSquared) {
          this.addCurveFittingViolationHint(
            parameters.nPoints,
            parameters.model,
            parameters.rSquared,
            hints
          );
        }
        break;
    }

    return hints;
  }
}
