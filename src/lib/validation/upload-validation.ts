// lib/validation/upload-validation.ts
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import db from "@/lib/db/db";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const MAX_REQUESTS_PER_WEEK = 2;
const MAX_REQUESTS_PER_WEEK_BETA = 31;
const MAX_PAGES_PER_UPLOAD = 30;
const MAX_SPACES_REGULAR = 1;
const MAX_SPACES_BETA = 3;
const EXPIRATION_TIME = 24 * 60 * 60 * 7;

export interface ValidationResult {
  isValid: boolean;
  error?: NextResponse;
}

export interface ValidationOptions {
  userId: string;
  userEmail: string;
  docsLength?: number; // For PDF validation
  skipRateLimit?: boolean;
  skipSpaceLimit?: boolean;
  skipPageLimit?: boolean;
}

export class UploadValidator {
  private async getBetaTesterStatus(email: string) {
    return await db.betatesters.findFirst({
      where: { email },
    });
  }

  private async getCurrentRequestCount(userId: string): Promise<number> {
    return (await redis.get<number>(`upsert_rate_limit:${userId}`)) || 0;
  }

  /*private async getCurrentSpaceCounts(userId: string) {
    const uploads = await db.upload.findMany({
      where: { userId, private: true, isDeleted: false },
      orderBy: { timeStarted: "desc" },
    });

    const shares = await db.upload.findMany({
      where: { userId, private: false, isDeleted: false },
      orderBy: { timeStarted: "desc" },
    });

    return { uploads: uploads.length, shares: shares.length };
  } */
  private async getCurrentSpaceCounts(userId: string) {
    const [uploadsCount, sharesCount] = await Promise.all([
      db.upload.count({
        where: { userId, private: true, isDeleted: false },
      }),
      db.upload.count({
        where: { userId, private: false, isDeleted: false },
      }),
    ]);

    return { uploads: uploadsCount, shares: sharesCount };
  }
  async validateRateLimit(
    options: ValidationOptions
  ): Promise<ValidationResult> {
    if (options.skipRateLimit) {
      return { isValid: true };
    }

    const betaTester = await this.getBetaTesterStatus(options.userEmail);
    const requestCount = await this.getCurrentRequestCount(options.userId);

    const maxRequests = betaTester
      ? MAX_REQUESTS_PER_WEEK_BETA
      : MAX_REQUESTS_PER_WEEK;
    const limitLabel = betaTester ? "30" : MAX_REQUESTS_PER_WEEK.toString();

    if (requestCount >= maxRequests) {
      return {
        isValid: false,
        error: NextResponse.json(
          {
            error: `You have exceeded the number of documents you can upload in a Week. Weekly limit ${limitLabel}`,
          },
          { status: 429 }
        ),
      };
    }

    return { isValid: true };
  }

  async validatePageLimit(
    options: ValidationOptions
  ): Promise<ValidationResult> {
    if (options.skipPageLimit || !options.docsLength) {
      return { isValid: true };
    }

    if (options.docsLength >= MAX_PAGES_PER_UPLOAD + 1) {
      return {
        isValid: false,
        error: NextResponse.json(
          {
            error: `You can only upload ${MAX_PAGES_PER_UPLOAD} pages at a time!`,
          },
          { status: 419 }
        ),
      };
    }

    return { isValid: true };
  }

  async validateSpaceLimit(
    options: ValidationOptions
  ): Promise<ValidationResult> {
    if (options.skipSpaceLimit) {
      return { isValid: true };
    }

    const betaTester = await this.getBetaTesterStatus(options.userEmail);
    const { uploads, shares } = await this.getCurrentSpaceCounts(
      options.userId
    );

    const maxSpaces = betaTester ? MAX_SPACES_BETA : MAX_SPACES_REGULAR;

    if (uploads >= maxSpaces || shares >= maxSpaces) {
      return {
        isValid: false,
        error: NextResponse.json(
          {
            error: `You have exceeded the number of spaces you can create`,
          },
          { status: 429 }
        ),
      };
    }

    return { isValid: true };
  }

  async validateUserExists(userId: string): Promise<ValidationResult> {
    const userExists = await db.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return {
        isValid: false,
        error: NextResponse.json({ error: "User not found" }, { status: 404 }),
      };
    }

    return { isValid: true };
  }

  async validateAll(options: ValidationOptions): Promise<ValidationResult> {
    // Check user exists
    const userValidation = await this.validateUserExists(options.userId);
    if (!userValidation.isValid) {
      return userValidation;
    }

    // Check rate limit
    const rateLimitValidation = await this.validateRateLimit(options);
    if (!rateLimitValidation.isValid) {
      return rateLimitValidation;
    }

    // Check page limit (for PDFs)
    const pageLimitValidation = await this.validatePageLimit(options);
    if (!pageLimitValidation.isValid) {
      return pageLimitValidation;
    }

    // Check space limit
    const spaceLimitValidation = await this.validateSpaceLimit(options);
    if (!spaceLimitValidation.isValid) {
      return spaceLimitValidation;
    }

    return { isValid: true };
  }

  async incrementRequestCount(userId: string): Promise<void> {
    const currentCount = await this.getCurrentRequestCount(userId);
    await redis.set(`upsert_rate_limit:${userId}`, currentCount + 1, {
      ex: EXPIRATION_TIME,
    });
  }
}

// Export a singleton instance
export const uploadValidator = new UploadValidator();
