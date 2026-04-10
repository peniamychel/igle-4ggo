export interface ApiResponse<T> {
    success: boolean;
    message: string;
    datos: T;            // Aquí 'T' será tu interfaz Iglesia
    nombreModelo: string;
}