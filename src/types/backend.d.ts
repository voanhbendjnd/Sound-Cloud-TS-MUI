export { };
declare global{
    interface IRequest{
        url: string;
        method: string,
        body?: { [key: string]: any };
        queryParams?: any;
        useCredentials?: boolean;
        headers?: any;
        nextOption?: any;
    }
    interface IBackendRes<T>{
        error?: string | string[];
        message: string;
        statusCode: number | string;
        data?: T;
    }
    interface IModelPaginate<T>{
        meta: {
            page: number;
            pageSize: number;
            pages: number;
            total: number;
        },
        result: T[]
    }
    interface ITrack{
        "id": string;
        "title": string;
        "description": string;
        "category": string;
        "imgUrl": string;
        "trackUrl": string;
        "countLike": string;
        "countPlay": string;
        "uploader": {
            "id": string;
            "email": string;
            "name": string;
            "role": string;
        }
        "createdAt": string;
        "updatedAt": string;
    }
}