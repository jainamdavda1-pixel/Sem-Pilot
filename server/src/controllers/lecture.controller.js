import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { LectureService } from '../services/lecture.service.js';

const lectureService = new LectureService();

export const getLecture = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lecture = await lectureService.getLectureById(id);
  if (!lecture) {
    throw new ApiError(404, 'Lecture not found');
  }
  return res.status(200).json(new ApiResponse(200, lecture, 'Lecture fetched successfully'));
});

export const getSubjectLectures = asyncHandler(async (req, res) => {
  const { subjectId } = req.query;
  if (!subjectId) {
    throw new ApiError(400, 'subjectId query parameter is required');
  }
  const lectures = await lectureService.getSubjectLectures(subjectId);
  return res.status(200).json(new ApiResponse(200, lectures, 'Lectures fetched successfully'));
});

export const createLecture = asyncHandler(async (req, res) => {
  const { 
    dayOfWeek, 
    startTime, 
    endTime, 
    lectureType, 
    room, 
    repeatWeekly, 
    subjectId 
  } = req.body;

  if (!dayOfWeek || !startTime || !endTime || !lectureType || !subjectId) {
    throw new ApiError(400, 'dayOfWeek, startTime, endTime, lectureType, and subjectId are required');
  }

  const lecture = await lectureService.createLecture({
    dayOfWeek,
    startTime,
    endTime,
    lectureType,
    subjectId,
    room,
    repeatWeekly: repeatWeekly !== undefined ? Boolean(repeatWeekly) : true
  });

  return res.status(201).json(new ApiResponse(201, lecture, 'Lecture created successfully'));
});

export const updateLecture = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { 
    dayOfWeek, 
    startTime, 
    endTime, 
    lectureType, 
    room, 
    repeatWeekly 
  } = req.body;

  const updateData = {};
  if (dayOfWeek) updateData.dayOfWeek = dayOfWeek;
  if (startTime) updateData.startTime = startTime;
  if (endTime) updateData.endTime = endTime;
  if (lectureType) updateData.lectureType = lectureType;
  if (room !== undefined) updateData.room = room;
  if (repeatWeekly !== undefined) updateData.repeatWeekly = Boolean(repeatWeekly);

  const lecture = await lectureService.updateLecture(id, updateData);
  return res.status(200).json(new ApiResponse(200, lecture, 'Lecture updated successfully'));
});

export const deleteLecture = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await lectureService.deleteLecture(id);
  return res.status(200).json(new ApiResponse(200, null, 'Lecture deleted successfully'));
});
