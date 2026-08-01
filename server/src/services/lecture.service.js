import { LectureRepository } from '../repositories/lecture.repository.js';

export class LectureService {
  constructor() {
    this.lectureRepository = new LectureRepository();
  }

  async getLectureById(id) {
    return this.lectureRepository.findById(id);
  }

  async getSubjectLectures(subjectId) {
    return this.lectureRepository.findAllBySubjectId(subjectId);
  }

  async createLecture(data) {
    return this.lectureRepository.create(data);
  }

  async updateLecture(id, data) {
    return this.lectureRepository.update(id, data);
  }

  async deleteLecture(id) {
    return this.lectureRepository.delete(id);
  }
}
