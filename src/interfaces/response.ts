// 1. Esta es la plantilla universal que configuramos en Apps Script
export interface ApiResponse<T> {
    success: boolean;
    status: number;
    result: T | null;
    error: string | null;
}

// 2. Esta es la respuesta específica de tu test
export interface TestResponse {
    mensaje: string;
    timestamp: string;
    servidor: string;
}