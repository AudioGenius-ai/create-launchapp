export interface EnvVariable {
  name: string;
  default?: string;
  description: string;
}

export const ENV_VARIABLES: EnvVariable[] = [
  {
    name: 'DATABASE_URL',
    default: '',
    description: 'Database connection string'
  },
  {
    name: 'PORT',
    default: '3000',
    description: 'Port the application will run on'
  }
];
