export interface UserResponse {
    Result: {
        CreationTime: string; // ISO date string
        LastModificationTime: string; // ISO date string
        Username: string;
        FullName: string;
        Phone: string;
        Email: string;
        Id: string; // MongoDB ObjectId or similar
        loginAttempts: number;
    };
    Message: string;
    IsSuccess: boolean;
}