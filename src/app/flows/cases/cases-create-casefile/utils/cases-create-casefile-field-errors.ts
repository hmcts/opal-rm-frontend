export const createCasesCreateCasefileError = (message: string, priority: number) => ({ message, priority });

export const createCasesCreateCasefileMaxLengthError = (label: string, length: number, priority: number) => ({
  maxlength: createCasesCreateCasefileError(`${label} must be ${length} characters or fewer`, priority),
});
