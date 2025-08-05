export const isValidComponentSize = (val: string): boolean => {
  return ['', 'large', 'default', 'small'].includes(val);
};
