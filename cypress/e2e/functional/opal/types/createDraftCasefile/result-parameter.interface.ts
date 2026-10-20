export interface IResultParameter {
  name: string;
  prompt: string;
  type: string;
  mandatory: boolean;
  min?: number | string;
  max?: number | string;
  options?: string[];
}
