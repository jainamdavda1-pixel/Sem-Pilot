import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { HolidayService } from '../services/holiday.service.js';

const holidayService = new HolidayService();

export const getHoliday = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const holiday = await holidayService.getHolidayById(id);
  if (!holiday) {
    throw new ApiError(404, 'Holiday not found');
  }
  return res.status(200).json(new ApiResponse(200, holiday, 'Holiday fetched successfully'));
});

export const getSemesterHolidays = asyncHandler(async (req, res) => {
  const { semesterId } = req.query;
  if (!semesterId) {
    throw new ApiError(400, 'semesterId query parameter is required');
  }
  const holidays = await holidayService.getSemesterHolidays(semesterId);
  return res.status(200).json(new ApiResponse(200, holidays, 'Holidays fetched successfully'));
});

export const createHoliday = asyncHandler(async (req, res) => {
  const { title, date, description, semesterId } = req.body;

  if (!title || !date || !semesterId) {
    throw new ApiError(400, 'Title, date, and semesterId are required');
  }

  const holiday = await holidayService.createHoliday({
    title,
    date: new Date(date),
    semesterId,
    description
  });

  return res.status(201).json(new ApiResponse(201, holiday, 'Holiday created successfully'));
});

export const updateHoliday = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, date, description } = req.body;

  const updateData = {};
  if (title) updateData.title = title;
  if (date) updateData.date = new Date(date);
  if (description !== undefined) updateData.description = description;

  const holiday = await holidayService.updateHoliday(id, updateData);
  return res.status(200).json(new ApiResponse(200, holiday, 'Holiday updated successfully'));
});

export const deleteHoliday = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await holidayService.deleteHoliday(id);
  return res.status(200).json(new ApiResponse(200, null, 'Holiday deleted successfully'));
});
