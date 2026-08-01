import { prisma } from '../lib/prisma.js';

export class SubjectRepository {
  async findById(id) {
    return prisma.subject.findUnique({
      where: { id },
      include: {
        lectures: true,
        attendanceRecords: true
      }
    });
  }

  async findAllBySemesterId(semesterId) {
    return prisma.subject.findMany({
      where: { semesterId },
      include: {
        lectures: true,
        attendanceRecords: true
      }
    });
  }

  async create(data) {
    return prisma.subject.create({
      data
    });
  }

  async update(id, data) {
    return prisma.subject.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.subject.delete({
      where: { id }
    });
  }
}
export default SubjectRepository;
