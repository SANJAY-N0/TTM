import { EnvironmentService } from './EnvironmentService';

export class LoggerService {
  private static instance: LoggerService;
  
  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public info(message: string, context?: any) {
    if (!EnvironmentService.getInstance().isProduction()) {
      console.log(`[INFO] ${message}`, context || '');
    }
  }

  public error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error || '');
  }

  public warn(message: string, context?: any) {
    console.warn(`[WARN] ${message}`, context || '');
  }
}
