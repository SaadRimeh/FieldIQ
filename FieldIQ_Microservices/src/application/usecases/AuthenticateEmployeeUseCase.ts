import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository';
import { Employee } from '../../domain/entities/Employee';
import { env } from '../../config/env';

export interface AuthenticateInput {
  loginCode: string; // Raw 10-digit code from mobile
}

export interface AuthenticateOutput {
  token: string;
  employee: Omit<Employee, 'loginCode'>;
}

export class AuthenticateEmployeeUseCase {
  constructor(private readonly employeeRepo: IEmployeeRepository) {}

  async execute(input: AuthenticateInput): Promise<AuthenticateOutput> {
    // Validate format: exactly 10 digits
    if (!/^\d{10}$/.test(input.loginCode)) {
      throw new Error('INVALID_CODE_FORMAT');
    }

    // Find employee by iterating active employees and comparing bcrypt hash
    // (login codes are short so brute-force over the small set is fine)
    const employees = await this.employeeRepo.findActive();

    let matchedEmployee: Employee | null = null;
    for (const emp of employees) {
      const match = await bcrypt.compare(input.loginCode, emp.loginCode);
      if (match) {
        matchedEmployee = emp;
        break;
      }
    }

    if (!matchedEmployee) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Newer @types/jsonwebtoken uses a branded StringValue type for expiresIn.
    // Casting through SignOptions['expiresIn'] bridges the plain string → branded
    // type without resorting to `as any`.
    const signOptions: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };

    const token = jwt.sign(
      {
        sub: matchedEmployee.id,
        role: matchedEmployee.role,
        name: matchedEmployee.name,
      },
      env.JWT_SECRET,
      signOptions,
    );

    const { loginCode: _omitted, ...safeEmployee } = matchedEmployee;

    return { token, employee: safeEmployee };
  }
}
