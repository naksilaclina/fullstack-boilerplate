export default interface IInternalServerErrorResponse {
  message: string;
  // Only in development mode!!!
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}
