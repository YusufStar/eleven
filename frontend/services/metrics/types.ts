export interface MetricsOverview {
  byStatus: Record<string, number>;
  openTasks: number;
  blocked: number;
  overdue: number;
  doneThisWeek: number;
  donePrevWeek: number;
  completionRate30d: number | null;
  avgCycleDays: number | null;
}

export interface TasksThroughput {
  completedPerWeek: { week: string; count: number }[];
  workload: {
    memberId: string;
    name: string;
    todo: number;
    inProgress: number;
    inReview: number;
    blocked: number;
    done: number;
  }[];
}

export interface SprintVelocity {
  data: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
    committedPoints: number;
    completedPoints: number;
    taskCount: number;
    doneCount: number;
  }[];
}

export interface CycleTime {
  data: { week: string; days: number }[];
}
