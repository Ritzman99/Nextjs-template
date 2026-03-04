/**
 * Shape of project.config.json — template configuration persisted after clone.
 */

export type OrganizationMode = 'full' | 'teams-only';

export type TemplateSectionsConfig = {
  authentication: boolean;
  calendar: boolean;
  contacts: boolean;
  inbox: boolean;
  profile: boolean;
  docs: boolean;
  admin: boolean;
};

export interface ProjectConfig {
  organization: OrganizationMode;
  sections: TemplateSectionsConfig;
  appliedAt?: string; // ISO date when apply script was last run
}

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  organization: 'full',
  sections: {
    authentication: true,
    calendar: true,
    contacts: true,
    inbox: true,
    profile: true,
    docs: true,
    admin: true,
  },
};
