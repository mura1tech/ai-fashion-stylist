export interface UserProfile {
    id: string;
    name: string;
    email: string;
}
export interface GenerateVisualRequest {
    prompt: string;
    style?: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
