export function successResponse(data: any = {}) {
  return {
    success: true,
    data,
    error: null,
  };
}

export function errorResponse(code: string, message: string) {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
    },
  };
}
