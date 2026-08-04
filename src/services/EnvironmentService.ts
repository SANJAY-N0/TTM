export class EnvironmentService {
  private static instance: EnvironmentService;
  
  private constructor() {}

  public static getInstance(): EnvironmentService {
    if (!EnvironmentService.instance) {
      EnvironmentService.instance = new EnvironmentService();
    }
    return EnvironmentService.instance;
  }

  public getAppEnv(): 'development' | 'production' | 'test' {
    return (process.env.APP_ENV as 'development' | 'production' | 'test') || 
           (process.env.NODE_ENV as 'development' | 'production' | 'test') || 
           'development';
  }

  public isDevelopment(): boolean {
    return this.getAppEnv() === 'development';
  }

  public isProduction(): boolean {
    return this.getAppEnv() === 'production';
  }

  public isDatabaseWritesEnabled(): boolean {
    // If explicitly disabled via ENV, respect it
    if (process.env.DATABASE_WRITES_ENABLED === 'false') {
      return false;
    }
    // By default, allow full CRUD in dev db, unless specified
    return true; 
  }
}
