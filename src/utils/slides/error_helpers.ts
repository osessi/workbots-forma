// Custom API Error class
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export function wrap_errors(func: () => unknown) {
  try {
    return func();
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new ApiError(`Internal server error: ${message}`);
  }
}
