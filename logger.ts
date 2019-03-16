import * as winston from 'winston';
import { format, Format } from 'logform';

const { combine, label, timestamp, printf, colorize } = format;

const LOGLEVEL = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  VERBOSE: 'verbose',
  DEBUG: 'debug',
  SILLY: 'silly',
  SILENT: 'silent',
};

/**
 * Global logger.
 */
class Logger {
  private readonly loglevel: string;

  constructor() {
    this.loglevel = process.env.LOGLEVEL || LOGLEVEL.INFO;
    this.config();
    winston.loggers.loggers.forEach((value: winston.Logger) => {
      value.transports[0].silent = process.env.LOGLEVEL === LOGLEVEL.SILENT;
    });
  }

  /**
   * Returns the formatter for a logger.
   * @param name The name of the logger.
   */
  private static getFormatter(name: string): Format {
    return combine(
      label({ label: name }),
      timestamp(),
      colorize(),
      printf(info => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`),
    );
  }

  /**
   * Returns the logger given by the name.
   * @param name The name of the logger to return.
   */
  public getLogger(name: string): winston.Logger {
    return winston.loggers.get(name);
  }

  /**
   * Configures all available loggers.
   */
  private config(): void {
    this.addLogger('auth');
  }

  /**
   * Adds a new logger.
   * @param name The name of the new logger.
   */
  private addLogger(name: string): void {
    winston.loggers.add(name, {
      level: this.loglevel,
      format: Logger.getFormatter(name),
      transports: [
        new winston.transports.Console(),
      ],
    });
  }
}

export default new Logger();
