import { HolidayRepository } from '../repositories/holiday.repository.js';

export class HolidayService {
  constructor() {
    this.holidayRepository = new HolidayRepository();
  }

  async getHolidayById(id) {
    return this.holidayRepository.findById(id);
  }

  async getSemesterHolidays(semesterId) {
    return this.holidayRepository.findAllBySemesterId(semesterId);
  }

  async createHoliday(data) {
    return this.holidayRepository.create(data);
  }

  async updateHoliday(id, data) {
    return this.holidayRepository.update(id, data);
  }

  async deleteHoliday(id) {
    return this.holidayRepository.delete(id);
  }
}
