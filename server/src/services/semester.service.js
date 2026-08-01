import { SemesterRepository } from '../repositories/semester.repository.js';

export class SemesterService {
  constructor() {
    this.semesterRepository = new SemesterRepository();
  }

  async getSemesterById(id) {
    return this.semesterRepository.findById(id);
  }

  async getUserSemesters(userId) {
    return this.semesterRepository.findAllByUserId(userId);
  }

  async createSemester(data) {
    return this.semesterRepository.create(data);
  }

  async updateSemester(id, data) {
    return this.semesterRepository.update(id, data);
  }

  async deleteSemester(id) {
    return this.semesterRepository.delete(id);
  }
}
