import { Employee, CreateEmployeeDTO, UpdateLocationDTO } from '../entities/Employee';

export interface IEmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  findByLoginCode(rawCode: string): Promise<Employee | null>;
  findAll(): Promise<Employee[]>;
  findActive(): Promise<Employee[]>;
  create(dto: CreateEmployeeDTO): Promise<Employee>;
  updateLocation(dto: UpdateLocationDTO): Promise<void>;
  incrementPoints(id: string, points: number): Promise<void>;
  deactivate(id: string): Promise<void>;
}
