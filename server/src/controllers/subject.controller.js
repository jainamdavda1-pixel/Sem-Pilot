import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { SubjectService } from '../services/subject.service.js';

const subjectService = new SubjectService();

export const getSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const subject = await subjectService.getSubjectById(id);
  if (!subject) {
    throw new ApiError(404, 'Subject not found');
  }
  return res.status(200).json(new ApiResponse(200, subject, 'Subject fetched successfully'));
});

export const getSemesterSubjects = asyncHandler(async (req, res) => {
  const { semesterId } = req.query;
  if (!semesterId) {
    throw new ApiError(400, 'semesterId query parameter is required');
  }
  const subjects = await subjectService.getSemesterSubjects(semesterId);
  return res.status(200).json(new ApiResponse(200, subjects, 'Subjects fetched successfully'));
});

export const createSubject = asyncHandler(async (req, res) => {
  const { 
    code, 
    name, 
    type, 
    credits, 
    facultyName, 
    facultyRating, 
    facultyStrictness, 
    subjectPriority, 
    semesterId 
  } = req.body;

  if (!code || !name || !type || !semesterId) {
    throw new ApiError(400, 'Code, name, type (THEORY/LAB/TUTORIAL), and semesterId are required');
  }

  const resolvedType = (type?.toUpperCase() === 'LAB' || type?.toUpperCase() === 'PRACTICAL') ? 'LAB' : type?.toUpperCase() === 'TUTORIAL' ? 'TUTORIAL' : 'THEORY';

  const subject = await subjectService.createSubject({
    code,
    name,
    type: resolvedType,
    semesterId,
    credits: credits ? parseInt(credits, 10) : undefined,
    facultyName,
    facultyRating: facultyRating ? parseInt(facultyRating, 10) : undefined,
    facultyStrictness: facultyStrictness ? parseInt(facultyStrictness, 10) : undefined,
    subjectPriority: subjectPriority ? parseInt(subjectPriority, 10) : undefined
  });

  return res.status(201).json(new ApiResponse(201, subject, 'Subject created successfully'));
});

export const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    code, 
    name, 
    type, 
    credits, 
    facultyName, 
    facultyRating, 
    facultyStrictness, 
    subjectPriority 
  } = req.body;

  const updateData = {};
  if (code) updateData.code = code;
  if (name) updateData.name = name;
  if (type) updateData.type = type;
  if (credits !== undefined) updateData.credits = parseInt(credits, 10);
  if (facultyName !== undefined) updateData.facultyName = facultyName;
  if (facultyRating !== undefined) updateData.facultyRating = parseInt(facultyRating, 10);
  if (facultyStrictness !== undefined) updateData.facultyStrictness = parseInt(facultyStrictness, 10);
  if (subjectPriority !== undefined) updateData.subjectPriority = parseInt(subjectPriority, 10);

  const subject = await subjectService.updateSubject(id, updateData);
  return res.status(200).json(new ApiResponse(200, subject, 'Subject updated successfully'));
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await subjectService.deleteSubject(id);
  return res.status(200).json(new ApiResponse(200, null, 'Subject deleted successfully'));
});
