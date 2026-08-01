import { prisma } from '../lib/prisma.js';

export class LectureRepository {
  async findById(id) {
    return prisma.lecture.findUnique({
      where: { id },
      include: {
        subject: true,
        attendance: true
      }
    });
  }

  async findAllBySubjectId(subjectId) {
    return prisma.lecture.findMany({
      where: { subjectId },
      include: {
        attendance: true
      }
    });
  }

  async create(data) {
    return prisma.lecture.create({
      data
    });
  }

  async update(id, data) {
    return prisma.lecture.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.lecture.delete({
      where: { id }
    });
  }
}
export default LectureRepository;
