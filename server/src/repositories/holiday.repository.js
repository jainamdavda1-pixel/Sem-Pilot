import { prisma } from '../lib/prisma.js';

export class HolidayRepository {
  async findById(id) {
    return prisma.holiday.findUnique({
      where: { id },
      include: {
        semester: true
      }
    });
  }

  async findAllBySemesterId(semesterId) {
    return prisma.holiday.findMany({
      where: { semesterId },
      orderBy: {
        date: 'asc'
      }
    });
  }

  async create(data) {
    return prisma.holiday.create({
      data
    });
  }

  async update(id, data) {
    return prisma.holiday.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.holiday.delete({
      where: { id }
    });
  }
}
export default HolidayRepository;
