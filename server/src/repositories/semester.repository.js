import { prisma } from '../lib/prisma.js';

export class SemesterRepository {
  async findById(id) {
    return prisma.semester.findUnique({
      where: { id },
      include: {
        subjects: true,
        holidays: true
      }
    });
  }

  async findAllByUserId(userId) {
    return prisma.semester.findMany({
      where: { userId },
      include: {
        subjects: true,
        holidays: true
      },
      orderBy: {
        startDate: 'asc'
      }
    });
  }

  async create(data) {
    const semesterData = {
      userId: 'default-user',
      ...data
    };
    return prisma.semester.create({
      data: semesterData
    });
  }

  async update(id, data) {
    return prisma.semester.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    // Delete subjects, lectures, holidays, and attendance records associated first or use cascade delete
    // SQLite with Prisma will automatically handle relation deletes if configured, but let's delete safely
    return prisma.semester.delete({
      where: { id }
    });
  }
}
export default SemesterRepository;
