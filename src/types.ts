export enum ServiceType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  MARKETING = 'MARKETING',
  CONSULTANCY = 'CONSULTANCY',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL'
}

export interface Freelancer {
  id: string;
  name: string;
  role: string;
}

export interface ProjectShare {
  freelancerId: string;
  amount: number;
}

export interface ExternalProject {
  id: string;
  contractNumber: string;
  title: string;
  client: string;
  totalValue: number;
  leadId: string;
  shares: ProjectShare[];
  serviceType: ServiceType;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  hubContributionPercent: number;
}

export interface AppSettings {
  lastImportUrl?: string;
}

export interface InternalTransaction {
  id: string;
  contractNumber?: string;
  fromId: string; // Who pays
  toId: string;   // Who receives
  amount: number;
  description: string;
  type: 'SUBCONTRACT' | 'EQUIPMENT' | 'STUDIO_RENTAL';
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
}

export interface FixedCost {
  id: string;
  contractNumber?: string;
  name: string;
  amount: number;
  category: 'RENT' | 'UTILITIES' | 'OTHER';
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
}

export interface MonthlySettlement {
  month: string;
  totalIncome: number;
  totalHubContributions: number;
  totalFixedCosts: number;
  balance: number; // hubContributions - fixedCosts
  freelancerBalances: Record<string, number>; // Net position for each freelancer
}
