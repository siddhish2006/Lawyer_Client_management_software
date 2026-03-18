/**
 * Logger Utility
 * ==============
 * Centralized logging with color support
 */

enum LogLevel {
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

const colorCodes = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

class Logger {
  private isDev = process.env.NODE_ENV !== "production";

  private colorize(text: string, color: string): string {
    if (process.env.NODE_ENV === "production") {
      return text; // No colors in production
    }
    return `${color}${text}${colorCodes.reset}`;
  }

  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const timestamp = this.getTimestamp();
    let coloredLevel: string = level;
    let logFn = console.log;

    switch (level) {
      case LogLevel.SUCCESS:
        coloredLevel = this.colorize("✓ SUCCESS", colorCodes.green);
        break;
      case LogLevel.INFO:
        coloredLevel = this.colorize("ℹ INFO", colorCodes.blue);
        break;
      case LogLevel.WARN:
        coloredLevel = this.colorize("⚠ WARN", colorCodes.yellow);
        logFn = console.warn;
        break;
      case LogLevel.ERROR:
        coloredLevel = this.colorize("✗ ERROR", colorCodes.red);
        logFn = console.error;
        break;
      case LogLevel.DEBUG:
        if (!this.isDev) return;
        coloredLevel = this.colorize("🐛 DEBUG", colorCodes.cyan);
        break;
    }

    const prefix = this.colorize(`[${timestamp}]`, colorCodes.dim);
    const output = `${prefix} ${coloredLevel}: ${message}`;

    if (data) {
      logFn(output);
      logFn(data);
    } else {
      logFn(output);
    }
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  success(message: string, data?: any): void {
    this.log(LogLevel.SUCCESS, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogLevel.ERROR, message, data);
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }
}

export const logger = new Logger();
