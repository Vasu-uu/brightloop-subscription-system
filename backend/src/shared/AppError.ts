export class AppError extends Error {
  httpStatus: number;
  code: string;
  fields?: Record<string, string>;

  constructor(httpStatus: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.httpStatus = httpStatus;
    this.code = code;
    this.fields = fields;
  }
}
