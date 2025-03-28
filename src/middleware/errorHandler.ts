import { Request, Response, NextFunction } from 'express';

const errorHandler = (
  err: Error & { status?: number }, // Extend Error to include status
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err.stack); // Log the error details

  // Send the error response
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    // Include stack trace only in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
