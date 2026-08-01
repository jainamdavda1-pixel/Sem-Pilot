import { prisma } from '../lib/prisma.js';

export class AttendanceRepository {
  async findById(id) {
    return prisma.attendance.findUnique({
      where: { id },
      include: {
        lecture: true,
        subject: true
      }
    });
  }

  async findAllBySubjectId(subjectId) {
    return prisma.attendance.findMany({
      where: { subjectId },
      orderBy: {
        lectureDate: 'desc'
      }
    });
  }

  async create(data) {
    return prisma.attendance.create({
      data
    });
  }

  async update(id, data) {
    return prisma.attendance.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.attendance.delete({
      where: { id }
    });
  }
}
export default AttendanceRepository;
