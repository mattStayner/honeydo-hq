const WEEKLY_GOAL_KEY = 'honeydo.weeklyGoal'

export const DEFAULT_WEEKLY_GOAL = 5
export const MIN_WEEKLY_GOAL = 1
export const MAX_WEEKLY_GOAL = 99

export function clampWeeklyGoal(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_WEEKLY_GOAL
  return Math.min(MAX_WEEKLY_GOAL, Math.max(MIN_WEEKLY_GOAL, Math.round(value)))
}

export function getWeeklyGoal(): number {
  const raw = localStorage.getItem(WEEKLY_GOAL_KEY)
  if (raw == null || raw === '') return DEFAULT_WEEKLY_GOAL
  return clampWeeklyGoal(Number.parseInt(raw, 10))
}

export function setWeeklyGoal(goal: number): void {
  localStorage.setItem(WEEKLY_GOAL_KEY, String(clampWeeklyGoal(goal)))
}
