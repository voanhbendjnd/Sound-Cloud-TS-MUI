'use client'

import { Container } from "@mui/material";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { useAllCategories } from "@/hooks/use-category";
import { useCreateTrack, useUploadTempTrack } from '@/hooks/use-track';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import {sendRequest} from "@/utils/api";

function LinearProgressWithLabel(props: LinearProgressProps & { value: number }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" sx={{color:'white'}} color="text.secondary">{`${Math.round(
                    props.value,
                )}%`}</Typography>
            </Box>
        </Box>
    );
}

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

interface IProps {
    trackAudio: File | null;
    setValue: (v: number) => void;
    setTrackAudio: (v: File | null) => void;
}

const SecondTabs = (props: IProps) => {
    const { trackAudio, setValue, setTrackAudio } = props;
    const { data: dataAllCategories } = useAllCategories();
    const router = useRouter();

    const [title, setTitle] = React.useState(trackAudio ? trackAudio.name.replace(/\.[^/.]+$/, "") : '');
    const [description, setDescription] = React.useState('');
    const [category, setCategory] = React.useState('');
    const [imgFile, setImgFile] = React.useState<File | null>(null);
    const [imgPreview, setImgPreview] = React.useState('');
    const [progress, setProgress] = React.useState(0);
    const [uploadedFileName, setUploadedFileName] = React.useState('');

    const { mutate: createTrack, isPending: isCreatePending } = useCreateTrack();

    const { mutate: uploadTempTrack, isPending: isUploadPending } = useUploadTempTrack((progressEvent) => {
        if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
        }
    });

    React.useEffect(() => {
        if (trackAudio && !title) {
            setTitle(trackAudio.name.replace(/\.[^/.]+$/, ""));
        }
    }, [trackAudio]);

    // Automatically upload the temp track when component loads
    React.useEffect(() => {
        if (trackAudio && !uploadedFileName && progress === 0) {
            const formData = new FormData();
            formData.append('track', trackAudio);
            uploadTempTrack(formData, {
                onSuccess: (res: any) => {
                    const filename = res?.data ?? res;
                    if (typeof filename === 'string') {
                        setUploadedFileName(filename);
                    }
                },
                onError: () => {
                    toast.error('Có lỗi xảy ra khi upload audio');
                    setProgress(0);
                }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trackAudio]);

    const categoryOptions = dataAllCategories?.data?.map((item) => {
        return {
            value: item.id.toString(),
            label: item.name,
        };
    }) || [];

    const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImgFile(file);
            setImgPreview(URL.createObjectURL(file));
        }
    }

    const handleSave = () => {
        if (!trackAudio || !title || !category || !imgFile) {
            toast.error("Vui lòng điền đầy đủ thông tin (Title, Category, File Audio, Hình Ảnh)");
            return;
        }

        if (progress < 100 || !uploadedFileName) {
            toast.error("Vui lòng đợi file upload hoàn tất!");
            return;
        }

        const formData = new FormData();
        formData.append('trackUrl', uploadedFileName);
        formData.append('img', imgFile);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('categoryId', category);

        createTrack(formData, {
            onSuccess: async () => {
                toast.success('Upload new track success!');
                setTrackAudio(null);
                setValue(0);
                setProgress(0);
                setUploadedFileName('');
                setImgFile(null);
                setImgPreview('');
                setTitle('');
                setDescription('');
                setCategory('');
                try {
                    // Gọi API xóa cache trên server
                    await sendRequest({
                        url: `/api/revalidate`,
                        method: 'POST',
                        queryParams: {
                            tag: "track-by-profile",
                            secret: "16180339887" // Lưu ý: Nên dùng biến môi trường ở đây
                        }
                    });

                    // QUAN TRỌNG: Làm mới dữ liệu tại Client sau khi xóa cache server
                    router.refresh();

                    // Nếu muốn chuyển trang thì mở comment dòng này
                    // router.push('/dashboard/track');
                } catch (error) {
                    console.error("Revalidate failed", error);
                }
                // router.push('/dashboard/track');
            },
            onError: () => {
                toast.error('Upload failed, try again!');
            }
        });
    };

    return (
        <div>
            <div>
                <div style={{color:'white'}}>
                    Uploading track: <strong>{trackAudio ? trackAudio.name : "None"}</strong>
                </div>
                {progress > 0 && <LinearProgressWithLabel value={progress} />}
            </div>

            <Grid container spacing={2} mt={5}>
                <Grid item xs={6} md={4}
                      sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          flexDirection: "column",
                          gap: "10px"
                      }}
                >
                    <div style={{ height: 250, width: 250, background: "#ccc", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
                        {imgPreview ? (
                            <img src={imgPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <div>No Image</div>
                        )}
                    </div>
                    <div>
                        <Button
                            component="label" variant="contained" startIcon={<CloudUploadIcon />}>
                            Upload Image
                            <VisuallyHiddenInput type="file" accept="image/*" onChange={handleImgChange} />
                        </Button>
                    </div>

                </Grid>
                <Grid item xs={6} md={8}>
                    <TextField 
                        id="track-title" 
                        label="Title"
                        variant="standard"
                        fullWidth 
                        margin="dense" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        sx={{
                            // 1. Đổi màu Label lúc bình thường
                            "& .MuiInputLabel-root": {
                                color: "white",
                            },
                            // 2. Đổi màu Label khi đang focus (click vào)
                            "& .MuiInputLabel-root.Mui-focused": {
                                color: "white",
                            },
                            // 3. Đổi màu Nội dung nhập vào (Input text)
                            "& .MuiInputBase-input": {
                                color: "white",
                            },
                            // 4. Đổi màu đường gạch chân (Underline) lúc bình thường
                            "& .MuiInput-underline:before": {
                                borderBottomColor: "white",
                            },
                            // 5. Đổi màu đường gạch chân khi hover
                            "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                                borderBottomColor: "white",
                            },
                            // 6. Đổi màu đường gạch chân khi đang focus
                            "& .MuiInput-underline:after": {
                                borderBottomColor: "white",
                            },
                        }}
                    />
                    <TextField 
                        id="track-desc" 
                        label="Description" 
                        variant="standard" 
                        fullWidth 
                        margin="dense"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}sx={{
                        // 1. Đổi màu Label lúc bình thường
                        "& .MuiInputLabel-root": {
                            color: "white",
                        },
                        // 2. Đổi màu Label khi đang focus (click vào)
                        "& .MuiInputLabel-root.Mui-focused": {
                            color: "white",
                        },
                        // 3. Đổi màu Nội dung nhập vào (Input text)
                        "& .MuiInputBase-input": {
                            color: "white",
                        },
                        // 4. Đổi màu đường gạch chân (Underline) lúc bình thường
                        "& .MuiInput-underline:before": {
                            borderBottomColor: "white",
                        },
                        // 5. Đổi màu đường gạch chân khi hover
                        "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                            borderBottomColor: "white",
                        },
                        // 6. Đổi màu đường gạch chân khi đang focus
                        "& .MuiInput-underline:after": {
                            borderBottomColor: "white",
                        },
                    }}
                    />
                    <TextField
                        id="track-category"
                        select
                        label="Category"
                        fullWidth
                        variant="standard"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        sx={{
                            mt: 3,
                            // 1. Đổi màu Label lúc bình thường
                        "& .MuiInputLabel-root": {
                            color: "white",
                        },
                        // 2. Đổi màu Label khi đang focus (click vào)
                        "& .MuiInputLabel-root.Mui-focused": {
                            color: "white",
                        },
                        // 3. Đổi màu Nội dung nhập vào (Input text)
                        "& .MuiInputBase-input": {
                            color: "white",
                        },
                        // 4. Đổi màu đường gạch chân (Underline) lúc bình thường
                        "& .MuiInput-underline:before": {
                            borderBottomColor: "white",
                        },
                        // 5. Đổi màu đường gạch chân khi hover
                        "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                            borderBottomColor: "white",
                        },
                        // 6. Đổi màu đường gạch chân khi đang focus
                        "& .MuiInput-underline:after": {
                            borderBottomColor: "white",
                        },
                    }}
                    >
                        {categoryOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}
                                      style={{backgroundColor:'#fff'}}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button
                        variant="outlined"
                        onClick={handleSave}
                        style={{color:'#fff', backgroundColor:'#ce4812'}}

                        disabled={isCreatePending || progress < 100 || !uploadedFileName}
                        sx={{ mt: 5 }}
                    >
                        {isCreatePending ? 'Saving...' : 'Save'}
                    </Button>
                </Grid>
            </Grid>
        </div>
    )
}
export default SecondTabs;