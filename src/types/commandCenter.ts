export type ActionSeverity = 'critical' | 'high' | 'medium' | 'admin';

export type ActionKind =
  | 'call'
  | 'sms'
  | 'email'
  | 'docs'
  | 'assignment'
  | 'appointment'
  | 'status_update';

export interface CommandAction {
  id: string;
  leadId?: string;
  title: string;
  subtitle: string;
  reason: string;
  severity: ActionSeverity;
  actionKind: ActionKind;
  actionLabel: string;
  dueLabel: string;
  impactScore: number;
  expectedValue?: number;
}

export interface CommandMetric {
  id: 'appointments_7d' | 'deals_at_risk' | 'gross_month';
  label: string;
  value: string;
  helper: string;
}

export interface MorningBrief {
  headline: string;
  bullets: string[];
  primaryActionId?: string;
  footer: string;
}

export interface RevenueForecast {
  next7Days: number;
  thisMonth: number;
  nextMonth: number;
}
