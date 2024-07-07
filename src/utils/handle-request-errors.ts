type ErrorProperty = {
  path: string;
  message: string;
  value: string;
};

export type RequestError = {
  message: string;
  errors: {
    [key: string]: {
      properties: ErrorProperty;
    };
  };
  code: number;
};

export const handleAuthRequestErrors = (error: RequestError) => {
  const errors: Record<string, string> = {};

  if (error.code === 11000) {
    errors["email"] = "That email is already registered";
    return errors;
  }

  if (error.message.includes("user validation failed")) {
    Object.values(error.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};
