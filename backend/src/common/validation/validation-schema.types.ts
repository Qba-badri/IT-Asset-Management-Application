import { RequiredWhenCondition } from './required-when.decorator';

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'file'
  | 'unknown';

export interface FieldRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  email?: boolean;
  options?: string[];
}

export interface FieldSchema {
  name: string;
  type: FieldType;
  /** Unconditionally required. */
  required: boolean;
  /** Required only when these conditions hold. */
  requiredWhen?: RequiredWhenCondition[];
  rules: FieldRules;
}

export interface FormSchema {
  formKey: string;
  /**
   * Identifies the deploy this schema came from. The client refetches when its
   * cached buildId no longer matches — schemas are static per deploy, so this
   * is the only invalidation signal needed.
   */
  buildId: string;
  fields: FieldSchema[];
}
