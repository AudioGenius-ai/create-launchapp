declare module 'inquirer' {
  export interface Question {
    type?: string;
    name: string;
    message?: string;
    choices?: any;
    when?: (answers: any) => boolean;
  }

  export function prompt<T = any>(questions: Question[]): Promise<T>;

  const _default: { prompt: typeof prompt };
  export default _default;
}
