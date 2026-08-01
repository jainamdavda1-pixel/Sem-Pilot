import { AttendanceRepository } from '../repositories/attendance.repository.js';

export class AttendanceService {
  constructor() {
    this.attendanceRepository = new AttendanceRepository();
  }

  async getAttendanceById(id) {
    return this.attendanceRepository.findById(id);
  }

  async getSubjectAttendance(subjectId) {
    return this.attendanceRepository.findAllBySubjectId(subjectId);
  }

  async recordAttendance(data) {
    return this.attendanceRepository.create(data);
  }

  async updateAttendance(id, data) {
    return this.attendanceRepository.update(id, data);
  }

  async deleteAttendance(id) {
    return this.attendanceRepository.delete(id);
  }
}
