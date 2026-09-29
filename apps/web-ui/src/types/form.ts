/** 业务校验统一返回错误数组；空数组表示通过。 */
export interface FormValidationIssue {
  fieldName: string;
  message: string;
}
