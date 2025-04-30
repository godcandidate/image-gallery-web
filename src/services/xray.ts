import * as AWSXRay from 'aws-xray-sdk';

// Define types for X-Ray segments and subsegments
export interface XRaySegment {
  addNewSubsegment(name: string): XRaySubsegment;
  addAnnotation(key: string, value: string | number | boolean): void;
  addError(error: Error | string): void;
  close(): void;
  subsegments: XRaySubsegment[];
}

// Extend XRaySegment to create the subsegment interface
export interface XRaySubsegment extends XRaySegment {
  // Additional subsegment-specific properties can be added here if needed
  namespace?: string;
}

// Define AWS SDK client type
export interface AWSClient {
  config: unknown;
  middlewareStack: {
    remove: unknown;
    use: unknown;
  };
}

// Check if running in Lambda environment
const isLambda = typeof process !== 'undefined' && !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// Configure X-Ray
const xrayConfig = {
  serviceName: 'image-gallery-web',
  samplingRules: {
    version: 2,
    default: {
      fixed_target: 1,
      rate: 0.1,
    },
    rules: [
      {
        description: 'S3 operations',
        host: '*',
        http_method: '*',
        url_path: '*',
        fixed_target: 1,
        rate: 1.0,
      },
    ],
  },
};

// Initialize X-Ray only if not in Lambda (Lambda has its own initialization)
if (!isLambda) {
  AWSXRay.setContextMissingStrategy('LOG_ERROR');
  try {
    AWSXRay.middleware.setSamplingRules(xrayConfig.samplingRules);
  } catch (error) {
    console.warn('Failed to set X-Ray sampling rules', error);
  }
}

// Create a segment for the current request, or use Lambda's segment if available
export const createSegment = (name: string): XRaySegment => {
  try {
    // In Lambda, use the existing segment that Lambda created
    const segment = AWSXRay.getSegment();
    if (segment) {
      return segment as unknown as XRaySegment;
    }
    
    // For non-Lambda environments or if no segment exists
    return AWSXRay.captureAsyncFunc(name, (subsegment) => {
      return subsegment as unknown as XRaySegment;
    });
  } catch (error) {
    console.warn('Failed to create X-Ray segment', error);
    // Return a dummy segment that won't break the application if X-Ray fails
    return createDummySegment();
  }
};

// Create a subsegment for a specific operation
export const createSubsegment = <T>(parentSegment: XRaySegment, name: string, callback: (subsegment: XRaySegment) => Promise<T>): Promise<T> => {
  try {
    const subsegment = parentSegment.addNewSubsegment(name);
    
    return callback(subsegment)
      .then((result) => {
        try { 
          subsegment.close(); 
        } catch {
          // Silently handle errors during close
        }
        return result;
      })
      .catch((error) => {
        try { 
          subsegment.addError(error);
          subsegment.close();
        } catch {
          // Silently handle errors during error handling
        }
        throw error;
      });
  } catch (error) {
    console.warn('Failed to create X-Ray subsegment', error);
    // If X-Ray fails, just run the callback without tracing
    return callback(createDummySegment());
  }
};

// Capture AWS SDK clients - works in both Lambda and non-Lambda environments
export const captureAWSClient = <T extends AWSClient>(client: T): T => {
  try {
    // Try to use the v3 client capture method first (for Lambda)
    if (typeof AWSXRay.captureAWSv3Client === 'function') {
      // Use type casting to handle AWS SDK type incompatibilities
      return AWSXRay.captureAWSv3Client(client as unknown as AWSClient) as T;
    }
    // Fall back to the standard client capture method
    return AWSXRay.captureAWSClient(client as unknown as AWSClient) as T;
  } catch (error) {
    console.warn('Failed to capture AWS client with X-Ray', error);
    return client; // Return the original client if capture fails
  }
};

// Create a dummy segment that won't break the application if X-Ray fails
function createDummySegment(): XRaySegment {
  return {
    addNewSubsegment: () => createDummySegment() as XRaySubsegment,
    addAnnotation: () => {},
    addError: () => {},
    close: () => {},
    subsegments: []
  };
}

export default AWSXRay;
