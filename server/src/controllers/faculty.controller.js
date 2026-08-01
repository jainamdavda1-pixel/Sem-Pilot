import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';

export const createFaculty = asyncHandler(async (req, res) => {
  const { name, department, email, cabin, designation, semesterId } = req.body;
  if (!name || !department || !semesterId) {
    throw new ApiError(400, 'Name, department, and semesterId are required');
  }

  const faculty = await prisma.faculty.create({
    data: {
      name,
      department,
      email: email || null,
      cabin: cabin || null,
      designation: designation || null,
      semesterId
    }
  });

  return res.status(201).json(new ApiResponse(201, faculty, 'Faculty created successfully'));
});

export const getFaculties = asyncHandler(async (req, res) => {
  const { semesterId } = req.query;
  if (!semesterId) {
    throw new ApiError(400, 'semesterId is required');
  }

  const faculties = await prisma.faculty.findMany({
    where: { semesterId }
  });

  return res.status(200).json(new ApiResponse(200, faculties, 'Faculties fetched successfully'));
});
