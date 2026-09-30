import type {
  ContractType,
  EmploymentStatus,
  LeaveStatus,
  LeaveType,
  Statute,
} from "./types";

export const statuteLabels: Record<Statute, string> = {
  bediende: "Bediende",
  arbeider: "Arbeider",
};

export const contractTypeLabels: Record<ContractType, string> = {
  onbepaalde_duur: "Onbepaalde duur",
  bepaalde_duur: "Bepaalde duur",
  student: "Studentenovereenkomst",
  flexi_job: "Flexi-job",
};

export const leaveTypeLabels: Record<LeaveType, string> = {
  wettelijke_vakantie: "Wettelijke vakantie",
  adv: "ADV-dag",
  ziekte: "Ziekte",
  klein_verlet: "Klein verlet",
  ouderschapsverlof: "Ouderschapsverlof",
  tijdskrediet: "Tijdskrediet",
  educatief_verlof: "Vlaams opleidingsverlof",
};

export const leaveStatusLabels: Record<LeaveStatus, string> = {
  pending: "In behandeling",
  approved: "Goedgekeurd",
  rejected: "Geweigerd",
  cancelled: "Geannuleerd",
};

export const employmentStatusLabels: Record<EmploymentStatus, string> = {
  active: "In dienst",
  on_leave: "Langdurig afwezig",
  left: "Uit dienst",
};
