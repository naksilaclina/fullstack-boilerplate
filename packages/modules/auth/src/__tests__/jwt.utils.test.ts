
import { verifyRefreshToken, initJwtSecrets } from '../utils/jwt.utils';
import { SessionModel } from '@naksilaclina/mongodb';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@naksilaclina/mongodb', () => ({
  SessionModel: {
    findOne: jest.fn(),
    updateOne: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  verify: jest.fn(),
}));

describe('JWT Utils - verifyRefreshToken Retry Logic', () => {
  const mockUserId = 'user123';
  const mockJti = 'session123';
  const mockSecret = 'test-refresh-secret-32-chars-long!!';
  
  beforeAll(() => {
    initJwtSecrets('test-jwt-secret-32-chars-long!!', mockSecret);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for jwt.verify to return a valid payload
    (jwt.verify as jest.Mock).mockReturnValue({
      userId: mockUserId,
      jti: mockJti,
    });
  });

  it('should return payload immediately if session exists', async () => {
    // Setup SessionModel.findOne to return session immediately
    (SessionModel.findOne as jest.Mock).mockResolvedValue({
      refreshTokenId: mockJti,
      userId: mockUserId,
    });

    const result = await verifyRefreshToken('valid-token');

    expect(result).toEqual({
      userId: mockUserId,
      jti: mockJti,
    });
    expect(SessionModel.findOne).toHaveBeenCalledTimes(1);
  });

  it('should retry and succeed if session is found on subsequent attempts', async () => {
    // Setup SessionModel.findOne to return null twice, then a session
    (SessionModel.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        refreshTokenId: mockJti,
        userId: mockUserId,
      });

    const result = await verifyRefreshToken('valid-token');

    expect(result).toEqual({
      userId: mockUserId,
      jti: mockJti,
    });
    // Should be called 3 times (initial + 2 retries)
    expect(SessionModel.findOne).toHaveBeenCalledTimes(3);
  });

  it('should return null if session is never found after retries', async () => {
    // Setup SessionModel.findOne to always return null
    (SessionModel.findOne as jest.Mock).mockResolvedValue(null);

    const result = await verifyRefreshToken('valid-token');

    expect(result).toBeNull();
    // Should be called 4 times (initial + 3 retries)
    expect(SessionModel.findOne).toHaveBeenCalledTimes(4);
  });

  it('should return null if session is found but invalidated', async () => {
    // Setup SessionModel.findOne to return invalidated session
    (SessionModel.findOne as jest.Mock).mockResolvedValue({
      refreshTokenId: mockJti,
      userId: mockUserId,
      invalidatedAt: new Date(),
    });

    const result = await verifyRefreshToken('valid-token');

    expect(result).toBeNull();
    expect(SessionModel.findOne).toHaveBeenCalledTimes(1);
  });
});
