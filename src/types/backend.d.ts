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

    interface ILoginRes {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            avatar: string;
            type:string;
            username: string;
        }
    }
    interface ITrack{
        "id": string;
        "title": string;
        "description": string;
        "category": string;
        "imgUrl": string;
        "trackUrl": string;
        "countLike": number;
        "countPlay": number;
        "isLiked": boolean;
        "uploader": {
            "id": string;
            "email": string;
            "name": string;
            "role": string;
            "avatar":string;
        }
        "createdAt": string;
        "updatedAt": string;
    }
    interface IUser {
        id: number;
        name: string;
        email: string;
        role: {
            id: number;
            name: string;
        };
        type: string;
        avatar: string;
        status: boolean;
        username: string;
    }
    interface IRole {
        id: number;
        name: string;
        description: string;
        permissions: IPermission[];
    }
    interface IPermission {
        id: number;
        name: string;
        apiPath: string;
        method: string;
        module: string;
    }
    interface ICategory {
        id: number;
        name: string;
        description: string;
    }
    interface IComment {
        id: number;
        createdAt: string;
        updatedAt: string;
        createdBy: string;
        updatedBy: string;
        track_title: string;
        user_email: string;
        likes_count: number;
        content: string;
        moment: number;
        user:{
            id: number;
            role:string;
            avatar:string;
            name:string;
            email:string;
            type:string;
        }
        track:{
            id: number;
            imgUrl:string;
            title:string;
        }
    }
    interface ICreateUser{
        id:number;
        name:string;
        roleId:number;
        email:string;
        status:string;
        management_password:{
            password:string;
            confirm_password:string;
        }
    }
    interface ITrackContext{
        currentTrack: IShareTrack;
        setCurrentTrack: (track: IShareTrack) => void;
        audioRef: React.MutableRefObject<HTMLAudioElement | null>;
        savedTimes: React.MutableRefObject<Record<string, number>>;
        viewedTracks: Set<string>;
        markTrackAsViewed: (trackId: string) => void;
    }
    interface IShareTrack extends ITrack{
        isPlaying: boolean;
    }

    interface IUploader{
        avatar: string;
        name:string;
        id:string;
    }
}