// Domain Entity — Employee
// Pure business object; no Prisma dependency

export type EmployeeRole = 'ADMIN' | 'EMPLOYEE';

export interface Employee {
  id: string;
  name: string;
  loginCode: string;   // Stored as bcrypt hash
  role: EmployeeRole;
  points: number;
  isActive: boolean;
  avatarUrl: string | null;
  lastLat: number | null;
  lastLng: number | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeDTO {
  name: string;
  rawLoginCode: string;   // Plain 10-digit code — will be hashed in repo
  role?: EmployeeRole;
}

export interface UpdateLocationDTO {
  id: string;
  lat: number;
  lng: number;
}
