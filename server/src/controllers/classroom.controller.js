import { google } from "googleapis";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../lib/prisma.js";

// Helper to check if Google credentials are configured
const isGoogleConfigured = () => {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
};

// Instantiate real oauth client if credentials exist
const getOAuth2Client = (req) => {
  if (!isGoogleConfigured()) return null;
  
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (req) {
    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
    if (origin) {
      redirectUri = `${origin.replace(/\/$/, "")}/google-callback`;
    }
  }

  if (process.env.NODE_ENV === "production" && !redirectUri) {
    throw new ApiError(400, "GOOGLE_REDIRECT_URI is not configured in production settings.");
  }
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || "http://localhost:5173/google-callback"
  );
};

/**
 * Get Google OAuth Login URL
 */
export const getAuthUrl = asyncHandler(async (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new ApiError(400, "Google OAuth client credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are missing on the production server.");
    }
  }

  if (!isGoogleConfigured()) {
    // If not configured, redirect client to the mock callback immediately
    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : "http://localhost:5173");
    const mockCallbackUrl = `${origin.replace(/\/$/, "")}/google-callback?code=mock_code_sandbox_999`;
    return res.status(200).json(
      new ApiResponse(200, { url: mockCallbackUrl, isMock: true }, "Mock login flow initiated")
    );
  }

  const oauth2 = getOAuth2Client(req);
  const scopes = [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
    "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ];

  const url = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent"
  });

  return res.status(200).json(
    new ApiResponse(200, { url, isMock: false }, "Google authorization URL generated")
  );
});

/**
 * Exchange Authorization Code for Access & Refresh Tokens
 */
export const handleCallback = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const userId = req.query.userId || "default-user";

  if (!code) {
    throw new ApiError(400, "Authorization code is required");
  }

  // Ensure default user exists in Neon database before updating credentials
  let user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        name: "Default Student"
      }
    });
  }

  if (code === "mock_code_sandbox_999" || !isGoogleConfigured()) {
    // Sandbox / Mock fallback login details
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: "mock_sandbox_access_token",
        googleRefreshToken: "mock_sandbox_refresh_token",
        googleTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
        googleEmail: "classroom.student@gmail.com",
        googleClassroomUserId: "mock_classroom_user_id_101"
      }
    });

    return res.status(200).json(
      new ApiResponse(200, { success: true, email: "classroom.student@gmail.com" }, "Mock Classroom authorization successful")
    );
  }

  // Real Google OAuth Flow
  const oauth2 = getOAuth2Client(req);
  const { tokens } = await oauth2.getToken(code);
  oauth2.setCredentials(tokens);

  // Retrieve user profiles
  const oauth2Api = google.oauth2({ version: "v2", auth: oauth2 });
  const userInfoResponse = await oauth2Api.userinfo.get();
  const googleEmail = userInfoResponse.data.email;
  const googleClassroomUserId = userInfoResponse.data.id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token || undefined, // refresh token only returned on first consent
      googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      googleEmail,
      googleClassroomUserId
    }
  });

  return res.status(200).json(
    new ApiResponse(200, { success: true, email: googleEmail }, "Google Classroom authorization successful")
  );
});

/**
 * Get Connection Status
 */
export const getConnectionStatus = asyncHandler(async (req, res) => {
  const userId = req.query.userId || "default-user";

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  const isConnected = !!(user && user.googleAccessToken);
  return res.status(200).json(
    new ApiResponse(200, { isConnected, email: user?.googleEmail || null }, "Connection status fetched")
  );
});

/**
 * Disconnect Google Classroom
 */
export const disconnectClassroom = asyncHandler(async (req, res) => {
  const userId = req.query.userId || "default-user";

  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      googleEmail: null,
      googleClassroomUserId: null
    }
  });

  return res.status(200).json(
    new ApiResponse(200, { success: true }, "Google Classroom disconnected successfully")
  );
});

/**
 * Fetch Google Classroom Courses
 */
export const getCourses = asyncHandler(async (req, res) => {
  const userId = req.query.userId || "default-user";

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || !user.googleAccessToken) {
    throw new ApiError(401, "Google Classroom not connected");
  }

  // Check if mock
  if (user.googleAccessToken === "mock_sandbox_access_token") {
    const mockCourses = [
      { id: "c1", name: "Calculus I", section: "SEC-A", teacher: "Prof. Alan Turing", state: "ACTIVE" },
      { id: "c2", name: "Modern Physics", section: "SEC-B", teacher: "Prof. Albert Einstein", state: "ACTIVE" },
      { id: "c3", name: "Data Structures & Algorithms", section: "SEC-A", teacher: "Prof. Grace Hopper", state: "ACTIVE" },
      { id: "c4", name: "Literary Studies", section: "SEC-C", teacher: "Prof. Jane Austen", state: "ACTIVE" }
    ];
    return res.status(200).json(
      new ApiResponse(200, mockCourses, "Courses fetched successfully (Sandbox Mode)")
    );
  }

  // Real API Fetch
  const oauth2 = getOAuth2Client(req);
  oauth2.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry?.getTime()
  });

  // Refresh token check
  const tokenExpiryTime = user.googleTokenExpiry ? new Date(user.googleTokenExpiry).getTime() : 0;
  const isExpiring = tokenExpiryTime - Date.now() < 5 * 60 * 1000;
  if (isExpiring) {
    const refreshed = await oauth2.refreshAccessToken();
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: refreshed.credentials.access_token,
        googleTokenExpiry: refreshed.credentials.expiry_date ? new Date(refreshed.credentials.expiry_date) : null
      }
    });
  }

  const classroom = google.classroom({ version: "v1", auth: oauth2 });
  const response = await classroom.courses.list({ courseStates: ["ACTIVE"] });
  const courses = (response.data.courses || []).map((c) => ({
    id: c.id,
    name: c.name,
    section: c.section || "",
    teacher: c.ownerId || "",
    state: c.courseState || ""
  }));

  return res.status(200).json(
    new ApiResponse(200, courses, "Google Classroom courses fetched successfully")
  );
});

/**
 * Save Google Course ↓ Subject Mappings
 */
export const saveMappings = asyncHandler(async (req, res) => {
  const { mappings } = req.body; // Array: [{ googleCourseId, subjectId, courseName }]
  const userId = req.query.userId || "default-user";

  if (!Array.isArray(mappings)) {
    throw new ApiError(400, "Mappings must be an array of mappings");
  }

  // Save each mapping in transaction
  const saved = await prisma.$transaction(
    mappings.map((m) =>
      prisma.googleCourseMapping.upsert({
        where: { googleCourseId: m.googleCourseId },
        update: { subjectId: m.subjectId, courseName: m.courseName },
        create: {
          googleCourseId: m.googleCourseId,
          courseName: m.courseName,
          subjectId: m.subjectId,
          userId
        }
      })
    )
  );

  return res.status(200).json(
    new ApiResponse(200, saved, "Course mappings saved successfully")
  );
});

/**
 * Get Saved Mappings
 */
export const getMappings = asyncHandler(async (req, res) => {
  const userId = req.query.userId || "default-user";

  const mappings = await prisma.googleCourseMapping.findMany({
    where: { userId }
  });

  return res.status(200).json(
    new ApiResponse(200, mappings, "Saved course mappings fetched successfully")
  );
});
