export interface Usuario{
    id_user: string;
    apellidoM: string;
    apellidoP: string;
    clave_trabajador?: number | string;
    email: string;
    estatus: boolean;
    nombre: string;
    rol: string;
    contrasena?: string;
    
}