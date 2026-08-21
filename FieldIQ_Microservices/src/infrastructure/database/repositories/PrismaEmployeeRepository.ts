import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { IEmployeeRepository } from '../../../domain/repositories/IEmployeeRepository';
import { Employee, CreateEmployeeDTO, UpdateLocationDTO } from '../../../domain/entities/Employee';

const BCRYPT_ROUNDS = 12;

function mapPrismaToEntity(p: any): Employee {
  return {
    id: p.id,
    name: p.name,
    loginCode: p.loginCode,
    role: p.role as Employee['role'],
    points: p.points,
    isActive: p.isActive,
    avatarUrl: p.avatarUrl,
    lastLat: p.lastLat,
    lastLng: p.lastLng,
    lastSeenAt: p.lastSeenAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export class PrismaEmployeeRepository implements IEmployeeRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Employee | null> {
    const record = await this.db.employee.findUnique({ where: { id } });
    return record ? mapPrismaToEntity(record) : null;
  }

  async findByLoginCode(_rawCode: string): Promise<Employee | null> {
    // Not directly queryable (bcrypt) — use findActive + compare
    throw new Error('Use AuthenticateEmployeeUseCase for code-based lookup');
  }

  async findAll(): Promise<Employee[]> {
    const records = await this.db.employee.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return records.map(mapPrismaToEntity);
  }

  async findActive(): Promise<Employee[]> {
    // Do NOT filter by role here — both ADMIN and EMPLOYEE accounts use the same
    // login-code flow. Role is encoded in the JWT after successful auth; filtering
    // on 'EMPLOYEE' would silently block admin logins.
    const records = await this.db.employee.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return records.map(mapPrismaToEntity);
  }

  async create(dto: CreateEmployeeDTO): Promise<Employee> {
    if (!/^\d{10}$/.test(dto.rawLoginCode)) {
      throw new Error('Login code must be exactly 10 digits');
    }

    const hashedCode = await bcrypt.hash(dto.rawLoginCode, BCRYPT_ROUNDS);
    const record = await this.db.employee.create({
      data: {
        name: dto.name,
        loginCode: hashedCode,
        role: dto.role ?? 'EMPLOYEE',
      },
    });
    return mapPrismaToEntity(record);
  }

  async updateLocation(dto: UpdateLocationDTO): Promise<void> {
    await this.db.employee.update({
      where: { id: dto.id },
      data: {
        lastLat: dto.lat,
        lastLng: dto.lng,
        lastSeenAt: new Date(),
      },
    });
  }

  async incrementPoints(id: string, points: number): Promise<void> {
    await this.db.employee.update({
      where: { id },
      data: { points: { increment: points } },
    });
  }

  async deactivate(id: string): Promise<void> {
    await this.db.employee.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
