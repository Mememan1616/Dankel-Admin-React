// src/services/ApiService.ts
//import type { LoginResponse } from '../interfaces/login';
import type { TestResponse, ApiResponse } from '../interfaces/response';
import type { Paro } from '../interfaces/paros';
import type { Turno } from '../interfaces/turnos';
import type { LineaProduccion } from '../interfaces/lineas_produccion';
import type { Maquina } from '../interfaces/maquinas';
import type { Lote } from '../interfaces/lotes';
import type { Producto } from '../interfaces/productos';
import type { User } from '../interfaces/login';
import type { Usuario } from '../interfaces/usuarios';
import type { FormaTrabajo } from '../interfaces/forma_trabajo';
import type { Semana } from '../interfaces/semanas';
//import type { Usuario } from '../interfaces/usuarios';


// Declaramos google para que TS no marque error en el entorno local
declare const google: any;

// Añadimos <T> para que la promesa devuelva la interface que le pidamos
const runGoogle = <T>(serverFunction: string, params: any): Promise<T> => {
    return new Promise((resolve, reject) => {
        console.log(`Llamando a ${serverFunction} con params:`, params);

        // 1. Detección de entorno local
        if (typeof google === 'undefined' || !google.script) {
            console.warn(`[DEV] Llamada simulada a backend: ${serverFunction}`);

            if (params.action === 'testAppscript') {
                return resolve({
                    success: true,
                    status: 200,
                    result: {
                        mensaje: "¡Conexión exitosa desde local!",
                        timestamp: new Date().toISOString(),
                        servidor: "Localhost DEV"
                    },
                    error: null
                } as unknown as T);
            }

            if (params.action === 'login') {
                const clave = params.clave;
                if (clave === '123456789') {
                    return resolve({
                        success: true,
                        status: 200,
                        message: 'Código QR correcto',
                        result: {
                            user: {
                                id_usuario: 1,
                                nombre: 'Martin Alejandro',
                                apellidoP: 'Gonzalez',
                                apellidoM: 'Dankel',
                                email: 'alex@dankel.com',
                                rol: 'operador'
                            }
                        }
                    } as unknown as T);
                } else {
                    return resolve({
                        succes: false,
                        status: 401,
                        message: 'Código QR incorrecto'
                    } as unknown as T);
                }
            }
            if (params.action === 'getAllParos') {
                return resolve({
                    success: true,
                    status: 200,
                    result: [
                        {
                            id: "paro1",
                            clave: "AMPOLLETALIST",
                            descripcion: "Limpieza y sanitizacion del equipo",
                            estatus: true,
                            icon: "Droplet",
                            id_maquina: "maquina1",
                            maquina: "productora",
                            nombre: "Ampolleta Lista",
                            programado: false
                        },
                        {
                            id_paro: "paro2",
                            clave: "PruebaParo",
                            descripcion: "Es una data de prueba",
                            estatus: true,
                            icon: "Droplet",
                            id_maquina: "maquina1",
                            maquina: "productora",
                            nombre: "Ampolleta Lista",
                            programado: false
                        },
                        {
                            id_paro: "paro3",
                            clave: "AMPOLLETALIST",
                            descripcion: "Limpieza y sanitizacion del equipo",
                            estatus: true,
                            icon: "Droplet",
                            id_maquina: "maquina1",
                            maquina: "productora",
                            nombre: "Ampolleta Lista",
                            programado: false
                        },
                        // Agregamos un segundo dato simulado para ver contraste en la tabla
                        {
                            id_paro: "paro4",
                            clave: "MANTENIMIENTO_PREV",
                            descripcion: "Mantenimiento preventivo mensual",
                            estatus: false,
                            icon: "Wrench",
                            id_maquina: "maquina2",
                            maquina: "empacadora",
                            nombre: "Mantenimiento Rutina",
                            programado: true
                        }
                    ] as Paro[],
                    error: null
                } as unknown as T);
            }
            if (params.action === 'getAllTurnos') {
                return resolve({
                    success: true,
                    status: 200,
                    result: [
                        {
                            id_turno: "turno1",
                            estatus: true,
                            hora_inicio: "8:00",
                            hora_termino: "16:00",
                            turno: "Matutino"
                        },
                        {
                            id_turno: "turno2",
                            estatus: true,
                            hora_inicio: "16:00",
                            hora_termino: "00:00",
                            turno: "Vespertino"
                        },
                        {
                            id_turno: "turno3",
                            estatus: true,
                            hora_inicio: "00:00",
                            hora_termino: "7:00",
                            turno: "Nocturno"
                        }
                    ] as Turno[],
                    error: null
                } as unknown as T);
            }
            if (params.action === 'getAllineasProduccion') {
                return resolve({
                    success: true,
                    status: 200,
                    result: [
                        {
                            id_linea_trabajo: "linea1",
                            estatus: true,
                            linea: "1",
                            descripcion: "Linea 1"
                        },
                        {
                            id_linea_trabajo: "linea2",
                            estatus: true,
                            linea: "2",
                            descripcion: "Linea 2"
                        }
                    ] as LineaProduccion[],
                    error: null
                } as unknown as T);
            }
            if (params.action === 'getAllMaquinas') {
                return resolve({
                    success: true,
                    status: 200,
                    result: [
                        {
                            id_maquina: "maquina1",
                            estatus: true,
                            maquina: "Embaladora",
                            id_linea: "linea1",
                            linea: "Linea de Embalaje",
                            descripcion: "Maquina 1"
                        },
                        {
                            id_maquina: "maquina2",
                            estatus: true,
                            maquina: "Empacadora",
                            id_linea: "linea2",
                            linea: "Linea 2",
                            descripcion: "Maquina 2"
                        }
                    ] as Maquina[],
                    error: null
                } as unknown as T);
            }
            if (params.action === 'getAllUsers') {
                return resolve({
                    success: true,
                    status: 200,
                    result: [
                        {
                            id_user: "USR-001",
                            nombre: "Ana",
                            apellidoP: "García",
                            apellidoM: "López",
                            email: "ana.garcia@empresa.com",
                            rol: "Administrador",
                            clave_trabajador: 1045,
                            estatus: true
                        },
                        {
                            id_user: "test",
                            nombre: "Carlos",
                            apellidoP: "Martínez",
                            apellidoM: "Ruiz",
                            email: "carlos.martinez@empresa.com",
                            rol: "Operador",
                            estatus: true
                        },
                        {
                            id_user: "USR-003",
                            nombre: "Sofía",
                            apellidoP: "Hernández",
                            apellidoM: "Díaz",
                            email: "sofia.hernandez@empresa.com",
                            rol: "Supervisor",
                            clave_trabajador: "EMP-9921",
                            estatus: true
                        },
                        {
                            id_user: "USR-004",
                            nombre: "Luis",
                            apellidoP: "Ramírez",
                            apellidoM: "Gómez",
                            email: "luis.ramirez@empresa.com",
                            rol: "Mantenimiento",
                            clave_trabajador: 2033,
                            estatus: false
                        }
                    ] as User[],
                    error: null
                } as unknown as T);
            }
            if (params.action === 'getAllLotes') {
                return resolve({
                    success: true,
                    status: 200,
                    result: [
                        {
                            id: "LOT-001",
                            lote: "Lote Ensamblaje A",
                            descripcion: "Producción continua del turno matutino",
                            estatus: true,
                            id_forma_trabajo: "FT-100",
                            forma_trabajo: "Continua",
                            maquinas: [
                                {
                                    id_linea: "LIN-01",
                                    id_maquina: "MAQ-101",
                                    maquina: "Ensambladora Principal"
                                },
                                {
                                    id_linea: "LIN-01",
                                    id_maquina: "MAQ-102",
                                    maquina: "Banda Transportadora Rápida"
                                }
                            ]
                        },
                        {
                            id_lote: "LOT-002",
                            lote: "Lote Empaquetado B",
                            descripcion: "Cierre y sellado de cajas para exportación",
                            estatus: true,
                            id_forma_trabajo: "FT-200",
                            forma_trabajo: "Por lotes (Batch)",
                            maquinas: [
                                {
                                    id_linea: "LIN-02",
                                    id_maquina: "MAQ-201",
                                    maquina: "Empaquetadora Automática"
                                },
                                {
                                    id_linea: "LIN-02",
                                    id_maquina: "MAQ-202",
                                    maquina: "Selladora Térmica"
                                },
                                {
                                    id_linea: "LIN-02",
                                    id_maquina: "MAQ-203",
                                    maquina: "Báscula Calibradora"
                                }
                            ]
                        },
                        {
                            id_lote: "LOT-003",
                            lote: "Lote Pruebas Calidad",
                            descripcion: "Lote de inspección post-mantenimiento preventivo",
                            estatus: false,
                            id_forma_trabajo: "FT-300",
                            forma_trabajo: "Intermitente",
                            maquinas: [
                                {
                                    id_linea: "LIN-03",
                                    id_maquina: "MAQ-301",
                                    maquina: "Inyectora de Plástico"
                                },
                                {
                                    id_linea: "LIN-03",
                                    id_maquina: "MAQ-302",
                                    maquina: "Brazo Robótico Articulado"
                                }
                            ]
                        }

                    ] as Lote[],
                    error: null
                } as unknown as T);

            }
            if (params.action === 'getAllProductos') {
                return resolve({
                    success: true,
                    status: 200,
                    result: [
                        {
                            id_producto: "PROD-101",
                            producto: "Tornillo de Titanio",
                            descripcion: "Tornillo de cabeza hexagonal de 2 pulgadas",
                            estatus: true,
                            unidad_medida: "piezas"
                        },
                        {
                            id_producto: "PROD-102",
                            producto: "Aceite Lubricante Sintético",
                            descripcion: "Galón de aceite para mantenimiento preventivo",
                            estatus: true,
                            unidad_medida: "litros"
                        },
                        {
                            id_producto: "PROD-103",
                            producto: "Banda Transportadora",
                            descripcion: "Repuesto de banda de 5 metros para Línea A",
                            estatus: false,
                            unidad_medida: "piezas"
                        },
                        {
                            id_producto: "PROD-104",
                            producto: "Sensor de Proximidad Óptico",
                            descripcion: "Sensor láser de alta precisión de 24V",
                            estatus: true,
                            unidad_medida: "piezas"
                        },
                        {
                            id_producto: "PROD-105",
                            producto: "Filtro de Aire Industrial",
                            descripcion: "Filtro corrugado para sistema de ventilación",
                            estatus: false,
                            unidad_medida: "piezas"
                        }
                    ] as Producto[],
                    error: null
                } as unknown as T);
            }
            if (params.action === 'getAllFormasTrabajo') {
                return resolve({
                    success: true,
                    status: 200,
                    result: [
                        {
                            id_forma_trabajo: "FT-100",
                            nombre: "Continua"
                        },
                        {
                            id_forma_trabajo: "FT-200",
                            nombre: "Por lotes (Batch)"
                        },
                        {
                            id_forma_trabajo: "FT-300",
                            nombre: "Intermitente"
                        }
                    ] as FormaTrabajo[],
                    error: null
                } as unknown as T);
            }

            if (params.action === 'insertParo') {
                return resolve({
                    success: true,
                    status: 200,
                    result: {
                        clave: "paroclave"
                    },
                    error: null
                } as unknown as T);

            }
            return reject(new Error("Estás en localhost. Haz Build y sube a Apps Script."));
        }

        if (!google.script || !google.script.run) {
            const error = 'google.script.run no está disponible';
            reject(new Error(error));
            return;
        }

        const timeout = setTimeout(() => {
            reject(new Error('Timeout: El servidor tardó demasiado en responder'));
        }, 90000);

        google.script.run
            .withSuccessHandler((response: any) => {
                clearTimeout(timeout);

                if (response === null) {
                    reject(new Error('El servidor retornó NULL'));
                    return;
                }
                if (response === undefined) {
                    reject(new Error('El servidor retornó UNDEFINED'));
                    return;
                }

                if (typeof response === 'string') {
                    try {
                        const parsed = JSON.parse(response);
                        resolve(parsed as T); // Aquí asignamos la interface
                        return;
                    } catch (e) {
                        resolve(response as T);
                        return;
                    }
                }

                resolve(response as T); // Aquí asignamos la interface
            })
            .withFailureHandler((error: Error) => {
                clearTimeout(timeout);
                reject(error);
            })
        [serverFunction](params);
    });
};

export const ApiService = {
    // Le decimos explícitamente a runGoogle que devuelva un TestResponse
    async testAppscript(): Promise<TestResponse> {
        try {
            // Hacemos la petición esperando la estructura ApiResponse
            const response = await runGoogle<ApiResponse<TestResponse>>('apiHandler', {
                action: 'testAppscript'
            });

            // Evaluamos si el backend arrojó un error controlado (ej. 400 o 500)
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }

            // Si todo salió bien (200), retornamos directamente la data que nos interesa
            // Usamos el operador "!" porque si success es true, sabemos que result no es null
            return response.result!;

        } catch (error) {
            console.error('Error en testAppscript:', error);
            throw error;
        }
    },

    // Le decimos explícitamente a runGoogle que devuelva un LoginResponse
    async login(Code: string): Promise<Usuario> {
        try {
            const response = await runGoogle<ApiResponse<Usuario>>('apiHandler', {
                action: 'login',
                clave: Code
            });
            if (response.success && response.result) {
                return response.result;
            } else {
                // Si la API mandó un error controlado, lo lanzamos
                throw new Error(response.error || 'Error desconocido en el login');
            }

        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    },

    async getAllParos(): Promise<Paro[]> {
        try {
            const response = await runGoogle<ApiResponse<Paro[]>>('apiHandler', {
                action: 'getAllParos'
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            return response.result || [];
        } catch (error) {
            console.error('Error en getParos:', error);
            throw error;
        }
    },
    async getAllTurnos(): Promise<Turno[]> {
        try {
            const response = await runGoogle<ApiResponse<Turno[]>>('apiHandler', {
                action: 'getAllTurnos'
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            return response.result || [];
        } catch (error) {
            console.error('Error en getTurnos:', error);
            throw error;
        }
    },
    async getAllineasProduccion(): Promise<LineaProduccion[]> {
        try {
            const response = await runGoogle<ApiResponse<LineaProduccion[]>>('apiHandler', {
                action: 'getAllineasProduccion'
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            return response.result || [];
        } catch (error) {
            console.error('Error en getLineasProduccion:', error);
            throw error;
        }
    },
    async getAllMaquinas(): Promise<Maquina[]> {
        try {
            const response = await runGoogle<ApiResponse<Maquina[]>>('apiHandler', {
                action: 'getAllMaquinas'
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            return response.result || [];
        } catch (error) {
            console.error('Error en getMaquinas:', error);
            throw error;
        }
    },
    async getAllMaquinasLote(): Promise<Maquina[]> {
        try {
            const response = await runGoogle<ApiResponse<Maquina[]>>('apiHandler', {
                action: 'getAllMaquinas'
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            return response.result || [];
        } catch (error) {
            console.error('Error en getMaquinas:', error);
            throw error;
        }
    },
    async getAllLotes(): Promise<Lote[]> {
        try {
            const response = await runGoogle<ApiResponse<Lote[]>>('apiHandler', {
                action: 'getAllLotes'
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            return response.result || [];
        } catch (error) {
            console.error('Error en getLotes:', error);
            throw error;
        }
    },
    async getAllProductos(): Promise<Producto[]> {
        try {
            const response = await runGoogle<ApiResponse<Producto[]>>('apiHandler', {
                action: 'getAllProductos'
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            return response.result || [];
        } catch (error) {
            console.error('Error en getAllProductos:', error);
            throw error;
        }
    },
    async getAllUsers(): Promise<Usuario[]> {
        try {
            const response = await runGoogle<ApiResponse<Usuario[]>>('apiHandler', {
                action: 'getAllUsers'
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            return response.result || [];
        } catch (error) {
            console.error('Error en getAllUsers:', error);
            throw error;
        }
    },
    async getAllFormasTrabajo(): Promise<FormaTrabajo[]> {
        try {
            const response = await runGoogle<ApiResponse<FormaTrabajo[]>>('apiHandler', {
                action: 'getAllFormasTrabajo'
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            return response.result || [];
        } catch (error) {
            console.error('Error en getAllFormasTrabajo:', error);
            throw error;
        }
    },

    async getAllSemanas(): Promise<Semana[]> {
        try {
            const response = await runGoogle<ApiResponse<Semana[]>>('apiHandler', {
                action: 'getAllSemanas'
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            return response.result || [];
        } catch (error) {
            console.error('Error en getAllSemanas:', error);
            throw error;
        }
    },
    //=====================================================================
    // Insert
    //=====================================================================

    async insertParo(paro: Paro): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'insertParo',
                paro: paro
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en insertParo:', error);
            throw error;
        }
    },

    async insertTurno(turno: Turno): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'insertTurno',
                turno: turno
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en insertTurno:', error);
            throw error;
        }
    },

    async insertLote(lote: Lote): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'insertLote',
                lote: lote
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en insertLote:', error);
            throw error;
        }
    },

    async insertMaquina(maquina: Maquina): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'insertMaquina',
                maquina: maquina
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en insertMaquina:', error);
            throw error;
        }
    },

    async insertProducto(producto: Producto): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'insertProducto',
                producto: producto
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en insertProducto:', error);
            throw error;
        }
    },

    async insertLineaProduccion(lineaProduccion: LineaProduccion): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'insertLineaProduccion',
                lineaProduccion: lineaProduccion
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en insertLineaProduccion:', error);
            throw error;
        }
    },
    async insertUser(user: Usuario): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'insertUser',
                user: user
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en insertUser:', error);
            throw error;
        }
    },
    async insertSemana(semana: Semana): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'insertSemana',
                semana: semana
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en insertSemana:', error);
            throw error;
        }
    },

    //-----------------------------------------------------
    //UPDATES
    //-----------------------------------------------------
    async updateUser(user: Usuario): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'updateUser',
                id_usuario: user.id_user,
                user: user
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en updateUser:', error);
            throw error;
        }
    },
    async updateTurno(turno: Turno): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'updateTurno',
                id_turno: turno.id_turno,
                turno: turno
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en updateTurno:', error);
            throw error;
        }
    },
    async updateParo(paro: Paro): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'updateParo',
                id_paro: paro.id_paro,
                paro: paro
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en updateParo:', error);
            throw error;
        }
    },
    async updateLote(lote: Lote): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'updateLote',
                id_lote: lote.id_lote,
                lote: lote
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en updateLote:', error);
            throw error;
        }
    },
    async updateMaquina(maquina: Maquina): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'updateMaquina',
                id_maquina: maquina.id_maquina,
                maquina: maquina
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en updateMaquina:', error);
            throw error;
        }
    },
    async updateLineaProduccion(lineaProduccion: LineaProduccion): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'updateLineaProduccion',
                id_linea_trabajo: lineaProduccion.id_linea_trabajo,
                lineaProduccion: lineaProduccion
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en updateLineaProduccion:', error);
            throw error;
        }
    },
    async updateProducto(producto: Producto): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'updateProducto',
                id_producto: producto.id_producto,
                producto: producto
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en updateProducto:', error);
            throw error;
        }
    },
    async updateSemana(semana: Semana): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'updateSemana',
                id_semana: semana.id_semana,
                semana: semana
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en updateSemana:', error);
            throw error;
        }
    },

    //==============================================================
    // DELETE
    //==============================================================
    async deleteTurno(id_turno: string): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'deleteTurno',
                id_turno: id_turno
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en deleteTurno:', error);
            throw error;
        }
    },
    async deleteParo(id_paro: string): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'deleteParo',
                id_paro: id_paro
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en deleteParo:', error);
            throw error;
        }
    },
    async deleteLote(id_lote: string): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'deleteLote',
                id_lote: id_lote
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en deleteLote:', error);
            throw error;
        }
    },
    async deleteMaquina(id_maquina: string): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'deleteMaquina',
                id_maquina: id_maquina
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en deleteMaquina:', error);
            throw error;
        }
    },
    async deleteLineaProduccion(id_linea_trabajo: string): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'deleteLineaProduccion',
                id_linea_trabajo: id_linea_trabajo
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en deleteLineaProduccion:', error);
            throw error;
        }
    },
    async deleteUser(id_user: string): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'deleteUser',
                id_usuario: id_user
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en deleteUser:', error);
            throw error;
        }
    },
    async deleteProducto(id_producto: string): Promise<ApiResponse<{ clave: string }>> {
        try {
            const response = await runGoogle<ApiResponse<{ clave: string }>>('apiHandler', {
                action: 'deleteProducto',
                id_producto: id_producto
            });
            if (!response.success) {
                throw new Error(`Error del servidor (${response.status}): ${response.error}`);
            }
            console.log(response);
            return response;
        } catch (error) {
            console.error('Error en deleteProducto:', error);
            throw error;
        }
    },
    

}