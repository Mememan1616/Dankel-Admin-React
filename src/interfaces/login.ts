export interface User {
    id_user: string | number;
    nombre: string;
    apellidoM: string; // El ? indica que es opcional
    apellidoP: string;
    email: string;
    rol: string;
    estatus: boolean;
    clave_trabajador?: number | string;
}

export interface LoginResponse {
    response: string;
    status: number;
    message: string;
    user?: User; 
    result?: {   // Lo añado porque en tu entorno local mockeado usas "result.user"
        user: User;
    }
}

export interface TestResponse {
    response: string;
    status: number;
}