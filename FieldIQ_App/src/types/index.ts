export interface Employee {
  id: string;
  name: string;
  loginCode?: string;
  points: number;
  createdAt?: string;
}

export interface TaskLocation {
  id: string;
  address?: string;
  latitude: number;
  longitude: number;
  sequenceOrder: number;
  isCompleted: boolean;
  checkedInAt?: string;
}

export interface DailyRoute {
  id: string;
  employeeId: string;
  date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  tasks: TaskLocation[];
}

export interface Invoice {
  id: string;
  taskId: string;
  amount: number;
  imageUrl: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'FLAGGED';
  syncedOffline?: boolean;
  createdAt: string;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  timestamp?: number;
}
