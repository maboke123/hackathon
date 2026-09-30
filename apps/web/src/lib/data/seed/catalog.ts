import type { ContractType, Statute } from "../types";

export type Position = {
  jobTitle: string;
  statute: Statute;
  salary: readonly [number, number];
  count: number;
  lead?: boolean;
  companyCar?: boolean;
  homeWork?: boolean;
  contractType?: Extract<ContractType, "student" | "flexi_job">;
};

export type DepartmentDefinition = {
  id: string;
  name: string;
  costCenter: string;
  positions: readonly Position[];
};

export const JOINT_COMMITTEES: Record<Statute, string> = {
  bediende: "PC 226",
  arbeider: "PC 140.03",
};

export const departmentDefinitions: readonly DepartmentDefinition[] = [
  {
    id: "dep-directie",
    name: "Directie",
    costCenter: "CC100",
    positions: [
      {
        jobTitle: "Algemeen directeur",
        statute: "bediende",
        salary: [8600, 9200],
        count: 1,
        lead: true,
        companyCar: true,
        homeWork: true,
      },
      {
        jobTitle: "Operations director",
        statute: "bediende",
        salary: [6800, 7400],
        count: 1,
        companyCar: true,
        homeWork: true,
      },
    ],
  },
  {
    id: "dep-magazijn",
    name: "Magazijn",
    costCenter: "CC200",
    positions: [
      {
        jobTitle: "Warehouse manager",
        statute: "bediende",
        salary: [4600, 5200],
        count: 1,
        lead: true,
        companyCar: true,
      },
      {
        jobTitle: "Teamleider magazijn",
        statute: "bediende",
        salary: [3300, 3700],
        count: 2,
      },
      {
        jobTitle: "Magazijnier",
        statute: "arbeider",
        salary: [2450, 2900],
        count: 7,
      },
      {
        jobTitle: "Heftruckchauffeur",
        statute: "arbeider",
        salary: [2550, 3000],
        count: 4,
      },
      {
        jobTitle: "Orderpicker",
        statute: "arbeider",
        salary: [2350, 2700],
        count: 4,
      },
      {
        jobTitle: "Orderpicker",
        statute: "arbeider",
        salary: [2300, 2400],
        count: 3,
        contractType: "student",
      },
      {
        jobTitle: "Magazijnier",
        statute: "arbeider",
        salary: [2400, 2500],
        count: 2,
        contractType: "flexi_job",
      },
    ],
  },
  {
    id: "dep-transport",
    name: "Transport",
    costCenter: "CC300",
    positions: [
      {
        jobTitle: "Transportplanner",
        statute: "bediende",
        salary: [3400, 4000],
        count: 1,
        lead: true,
        homeWork: true,
      },
      {
        jobTitle: "Dispatcher",
        statute: "bediende",
        salary: [2950, 3500],
        count: 2,
      },
      {
        jobTitle: "Vrachtwagenchauffeur CE",
        statute: "arbeider",
        salary: [2800, 3300],
        count: 6,
      },
    ],
  },
  {
    id: "dep-customer-service",
    name: "Customer service",
    costCenter: "CC400",
    positions: [
      {
        jobTitle: "Customer service lead",
        statute: "bediende",
        salary: [3700, 4200],
        count: 1,
        lead: true,
        homeWork: true,
      },
      {
        jobTitle: "Customer service medewerker",
        statute: "bediende",
        salary: [2750, 3300],
        count: 4,
        homeWork: true,
      },
    ],
  },
  {
    id: "dep-sales",
    name: "Sales",
    costCenter: "CC500",
    positions: [
      {
        jobTitle: "Sales manager",
        statute: "bediende",
        salary: [5400, 6100],
        count: 1,
        lead: true,
        companyCar: true,
        homeWork: true,
      },
      {
        jobTitle: "Account manager",
        statute: "bediende",
        salary: [3900, 5000],
        count: 3,
        companyCar: true,
        homeWork: true,
      },
      {
        jobTitle: "Sales support medewerker",
        statute: "bediende",
        salary: [2850, 3400],
        count: 1,
        homeWork: true,
      },
    ],
  },
  {
    id: "dep-finance",
    name: "Finance",
    costCenter: "CC600",
    positions: [
      {
        jobTitle: "Finance manager",
        statute: "bediende",
        salary: [5600, 6300],
        count: 1,
        lead: true,
        companyCar: true,
        homeWork: true,
      },
      {
        jobTitle: "Boekhouder",
        statute: "bediende",
        salary: [3300, 4200],
        count: 2,
        homeWork: true,
      },
    ],
  },
  {
    id: "dep-hr",
    name: "HR",
    costCenter: "CC700",
    positions: [
      {
        jobTitle: "HR manager",
        statute: "bediende",
        salary: [5200, 5900],
        count: 1,
        lead: true,
        companyCar: true,
        homeWork: true,
      },
      {
        jobTitle: "Payroll officer",
        statute: "bediende",
        salary: [3200, 3900],
        count: 1,
        homeWork: true,
      },
      {
        jobTitle: "HR business partner",
        statute: "bediende",
        salary: [3800, 4600],
        count: 1,
        homeWork: true,
      },
    ],
  },
  {
    id: "dep-it",
    name: "IT",
    costCenter: "CC800",
    positions: [
      {
        jobTitle: "IT manager",
        statute: "bediende",
        salary: [5300, 6000],
        count: 1,
        lead: true,
        companyCar: true,
        homeWork: true,
      },
      {
        jobTitle: "Software developer",
        statute: "bediende",
        salary: [3700, 4900],
        count: 2,
        homeWork: true,
      },
      {
        jobTitle: "Systeembeheerder",
        statute: "bediende",
        salary: [3500, 4300],
        count: 1,
        homeWork: true,
      },
    ],
  },
];

export type NameGroup = {
  language: "nl" | "fr";
  weight: number;
  firstNames: readonly string[];
  lastNames: readonly string[];
};

export const nameGroups: readonly NameGroup[] = [
  {
    language: "nl",
    weight: 60,
    firstNames: [
      "Emma",
      "Lotte",
      "Sofie",
      "Hanne",
      "Julie",
      "Elise",
      "Charlotte",
      "An",
      "Katrien",
      "Inge",
      "Lucas",
      "Thomas",
      "Jonas",
      "Wout",
      "Bram",
      "Stijn",
      "Pieter",
      "Koen",
      "Bart",
      "Dirk",
      "Tom",
      "Senne",
      "Jef",
      "Kevin",
      "Glenn",
    ],
    lastNames: [
      "Peeters",
      "Janssens",
      "Maes",
      "Jacobs",
      "Mertens",
      "Willems",
      "Claes",
      "Goossens",
      "Wouters",
      "De Smet",
      "Van den Broeck",
      "Vermeulen",
      "De Clercq",
      "Hermans",
      "Aerts",
      "Michiels",
      "Van Damme",
      "Verhoeven",
      "Smets",
      "Van Hoof",
      "De Backer",
      "Segers",
      "Cools",
    ],
  },
  {
    language: "fr",
    weight: 12,
    firstNames: [
      "Camille",
      "Amélie",
      "Chloé",
      "Nathalie",
      "Maxime",
      "Antoine",
      "Julien",
      "Olivier",
    ],
    lastNames: ["Dubois", "Lambert", "Dupont", "Leroy", "Lemaire", "Renard"],
  },
  {
    language: "nl",
    weight: 12,
    firstNames: [
      "Fatima",
      "Yasmine",
      "Nora",
      "Mohamed",
      "Youssef",
      "Rachid",
      "Bilal",
    ],
    lastNames: ["El Amrani", "Benali", "Bouzid", "Amrani", "El Idrissi"],
  },
  {
    language: "nl",
    weight: 8,
    firstNames: ["Elif", "Zeynep", "Mehmet", "Emre", "Murat"],
    lastNames: ["Yilmaz", "Kaya", "Demir", "Aydin"],
  },
  {
    language: "nl",
    weight: 8,
    firstNames: ["Agnieszka", "Ioana", "Piotr", "Andrei", "Marek"],
    lastNames: ["Kowalski", "Nowak", "Popescu", "Ionescu"],
  },
];

export const cities = [
  "Antwerpen",
  "Merksem",
  "Ekeren",
  "Brasschaat",
  "Kapellen",
  "Schoten",
  "Beveren",
  "Sint-Niklaas",
  "Mechelen",
  "Lier",
  "Kontich",
  "Boom",
  "Gent",
  "Brussel",
  "Turnhout",
] as const;

export const companyCars = [
  { model: "Volvo EX30", fuel: "electric", monthlyBenefitInKind: 138 },
  { model: "BMW iX1", fuel: "electric", monthlyBenefitInKind: 171 },
  { model: "Tesla Model 3", fuel: "electric", monthlyBenefitInKind: 152 },
  { model: "Škoda Enyaq", fuel: "electric", monthlyBenefitInKind: 159 },
  { model: "Volkswagen ID.4", fuel: "electric", monthlyBenefitInKind: 156 },
  { model: "Audi A3 TFSI e", fuel: "hybrid", monthlyBenefitInKind: 187 },
] as const;
