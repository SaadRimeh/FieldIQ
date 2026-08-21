// Domain Entity — Task

export type TaskStatus = 'PENDING' | 'CHECKED_IN' | 'COMPLETED' | 'SKIPPED';

export interface Task {
  id: string;
  routeId: string;
  employeeId: string;
  label: string;
  latitude: number;
  longitude: number;
  sequence: number;
  status: TaskStatus;
  checkedInAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDTO {
  routeId: string;
  employeeId: string;
  label: string;
  latitude: number;
  longitude: number;
  sequence: number;
}

export interface CheckInTaskDTO {
  taskId: string;
  employeeId: string;
  currentLat: number;
  currentLng: number;
}
