import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';

// In-memory store for desk sessions (use Redis in production)
interface DeskSession {
  deskId: string;
  signature: string;
  createdAt: number;
  expiresAt: number;
}

const deskSessions = new Map<string, DeskSession>();

// Session expiry time (30 minutes)
const SESSION_EXPIRY = 30 * 60 * 1000;

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [deskId, session] of deskSessions.entries()) {
    if (session.expiresAt < now) {
      deskSessions.delete(deskId);
    }
  }
}, 60000); // Clean every minute

// Create a new desk session
export const createDeskSession = async (req: Request, res: Response) => {
  try {
    logger.info('Creating new desk session', {
      particular: 'create_desk_session'
    });

    // Generate unique desk ID
    const deskId = crypto.randomBytes(16).toString('hex');
    
    // Generate signature for validation
    const signature = crypto.randomBytes(32).toString('hex');
    
    const now = Date.now();
    const session: DeskSession = {
      deskId,
      signature,
      createdAt: now,
      expiresAt: now + SESSION_EXPIRY
    };
    
    // Store session
    deskSessions.set(deskId, session);
    
    logger.info('Desk session created successfully', {
      particular: 'create_desk_session_success',
      deskId,
      expiresIn: SESSION_EXPIRY
    });
    
    res.status(200).json({
      success: true,
      data: {
        deskId,
        signature,
        expiresIn: SESSION_EXPIRY
      }
    });
  } catch (error: any) {
    logger.error('Error creating desk session', {
      particular: 'create_desk_session_error',
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error creating desk session',
      error: error.message
    });
  }
};

// Validate desk session
export const validateDeskSession = (deskId: string, signature: string): boolean => {
  const session = deskSessions.get(deskId);
  
  if (!session) {
    logger.warn('Desk session validation failed - session not found', {
      particular: 'validate_desk_session_not_found',
      deskId
    });
    return false;
  }
  
  // Check if session expired
  if (session.expiresAt < Date.now()) {
    deskSessions.delete(deskId);
    logger.warn('Desk session validation failed - session expired', {
      particular: 'validate_desk_session_expired',
      deskId
    });
    return false;
  }
  
  // Validate signature
  const isValid = session.signature === signature;
  
  if (!isValid) {
    logger.warn('Desk session validation failed - invalid signature', {
      particular: 'validate_desk_session_invalid_signature',
      deskId
    });
  } else {
    logger.info('Desk session validated successfully', {
      particular: 'validate_desk_session_success',
      deskId
    });
  }
  
  return isValid;
};

// Refresh desk session (extend expiry)
export const refreshDeskSession = async (req: Request, res: Response) => {
  try {
    const { deskId, signature } = req.body;
    
    logger.info('Attempting to refresh desk session', {
      particular: 'refresh_desk_session',
      deskId
    });
    
    if (!validateDeskSession(deskId, signature)) {
      logger.warn('Refresh desk session failed - invalid or expired session', {
        particular: 'refresh_desk_session_invalid',
        deskId
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired desk session'
      });
    }
    
    const session = deskSessions.get(deskId);
    if (session) {
      session.expiresAt = Date.now() + SESSION_EXPIRY;
      deskSessions.set(deskId, session);
    }
    
    logger.info('Desk session refreshed successfully', {
      particular: 'refresh_desk_session_success',
      deskId,
      expiresIn: SESSION_EXPIRY
    });
    
    res.status(200).json({
      success: true,
      message: 'Session refreshed',
      data: {
        expiresIn: SESSION_EXPIRY
      }
    });
  } catch (error: any) {
    logger.error('Error refreshing desk session', {
      particular: 'refresh_desk_session_error',
      deskId: req.body.deskId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error refreshing desk session',
      error: error.message
    });
  }
};
