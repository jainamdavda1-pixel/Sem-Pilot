import { SubjectRepository } from '../repositories/subject.repository.js';

export class SubjectService {
  constructor() {
    this.subjectRepository = new SubjectRepository();
  }

  async getSubjectById(id) {
    return this.subjectRepository.findById(id);
  }

  async getSemesterSubjects(semesterId) {
    return this.subjectRepository.findAllBySemesterId(semesterId);
  }

  async createSubject(data) {
    return this.subjectRepository.create(data);
  }

  async updateSubject(id, data) {
    return this.subjectRepository.update(id, data);
  }

  async deleteSubject(id) {
    return this.subjectRepository.delete(id);
  }
}
