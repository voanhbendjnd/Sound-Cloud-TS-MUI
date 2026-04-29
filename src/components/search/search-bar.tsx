'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { TextField, Box, Paper, IconButton, InputAdornment, CircularProgress } from '@mui/material';
import { useSearchSuggestions } from '@/hooks/use-search';
import Image from 'next/image';

const SearchBar = () => {
    const router = useRouter();
    const [keyword, setKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword);
        }, 300);

        return () => clearTimeout(timer);
    }, [keyword]);

    // Fetch suggestions
    const { data: suggestions, isLoading } = useSearchSuggestions({
        query: debouncedKeyword,
        enabled: showSuggestions && keyword.length >= 2
    });
    const suggestionsList = suggestions ?? [];

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKeyword(e.target.value);
        setShowSuggestions(true);
    };

    const handleClear = () => {
        setKeyword('');
        setDebouncedKeyword('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && keyword.length >= 2) {
            router.push(`/search?q=${encodeURIComponent(keyword)}`);
            setShowSuggestions(false);
        }
    };
    // <Link href={`/track/${track.id}?audio=${track.trackUrl}&id=${track.id}`} style={{ textDecoration: 'none' }}>

    const handleSuggestionClick = (suggestion: ISearchResult) => {
        router.push(`/track/${suggestion.id}`);
        setShowSuggestions(false);
        setKeyword('');
    };

    // Check for exact match
    const exactMatch = suggestionsList.find(s =>
        s.title.toLowerCase() === keyword.toLowerCase()
    );

    return (
        <Box ref={searchRef} sx={{ position: 'relative', width: '100%', maxWidth: 550, height: '45' }}>
            <TextField
                inputRef={inputRef}
                fullWidth
                placeholder="Search for tracks..."
                value={keyword}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                inputProps={{
                    style: {
                        color: '#ccc', // Màu chữ khi bạn gõ vào (xám nhạt cho dịu mắt)
                        fontSize: '0.9rem'
                    }
                }}
                InputProps={{
                    // 1. Xóa startAdornment (để trống hoặc xóa hẳn)
                    startAdornment: null,

                    // 2. Chuyển icon search vào endAdornment
                    endAdornment: (
                        <InputAdornment position="end" sx={{ gap: 0.5 }}>
                            {/* Nút Clear (X) - chỉ hiện khi có chữ */}
                            {keyword && (
                                <IconButton onClick={handleClear} size="small" sx={{ color: '#999', '&:hover': { color: '#fff' } }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            )}

                            {/* Loading indicator */}
                            {isLoading && (
                                <CircularProgress size={20} sx={{ color: '#f50' }} />
                            )}

                            {/* Nút Kính lúp (Search) - Click vào đây sẽ gọi logic tìm kiếm */}
                            <IconButton
                                onClick={() => {
                                    if (keyword.length >= 2) {
                                        router.push(`/search?q=${encodeURIComponent(keyword)}`);
                                        setShowSuggestions(false);
                                    }
                                }}
                                size="small"
                                sx={{
                                    color: '#999',
                                    '&:hover': { color: '#f50' }, // Đổi sang màu cam SoundCloud khi hover
                                    transition: '0.2s',

                                }}
                            >
                                <SearchIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                    sx: {

                        // --- FIX LỖI TRẮNG NỀN KHI AUTOFILL ---
                        '& input:-webkit-autofill': {
                            WebkitBoxShadow: '0 0 0 100px #333 inset !important', // Đè màu nền tối vào
                            WebkitTextFillColor: '#fff !important', // Đè màu chữ trắng vào
                            transition: 'background-color 5000s ease-in-out 0s',
                        },
                        '& input:-webkit-autofill:hover': {
                            WebkitBoxShadow: '0 0 0 100px #333 inset !important',
                        },
                        '& input:-webkit-autofill:focus': {
                            WebkitBoxShadow: '0 0 0 100px #333 inset !important',
                        },
                        bgcolor: '#222', // Nền thanh search tối hơn một chút
                        borderRadius: '4px', // Bo góc nhẹ theo kiểu SoundCloud

                        // 1. Màu mặc định của border (fieldset)
                        '& fieldset': {
                            borderColor: 'transparent', // Ẩn border mặc định
                            transition: 'all 0.2s ease-in-out',
                        },

                        // 2. Hiệu ứng khi HOVER
                        '&:hover fieldset': {
                            borderColor: '#444 !important', // Hiện border xám nhẹ khi hover
                        },

                        // 3. Hiệu ứng khi FOCUS (Đang nhập liệu)
                        '&.Mui-focused fieldset': {
                            borderColor: '#666 !important', // Border sáng hơn khi click vào
                            borderWidth: '1px !important',
                        },

                        // Nếu muốn đổi màu placeholder (chữ "Search for tracks...")
                        '& input::placeholder': {
                            color: '#666',
                            opacity: 1,
                        },
                    },
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        height: 48,
                        color: '#fff',
                        '&.Mui-focused .MuiSvgIcon-root': {
                            color: '#f50', // Khi đang gõ, kính lúp sẽ sáng lên màu cam
                        }
                    }
                }}
            />

            {/* Exact match preview */}
            {exactMatch && keyword.length >= 2 && (
                <Paper
                    elevation={3}
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 1,
                        p: 2,
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        cursor: 'pointer',
                        bgcolor: '#333',
                        '&:hover': {
                            bgcolor: '#444',
                        },

                    }}
                    onClick={() => handleSuggestionClick(exactMatch)}
                >
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            position: 'relative',
                            borderRadius: 1,
                            overflow: 'hidden',
                        }}
                    >
                        <Image
                            src={exactMatch.imgUrl}
                            alt={exactMatch.title}
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </Box>
                    <Box>
                        <Box sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>
                            {exactMatch.title}
                        </Box>
                        <Box sx={{ color: '#999', fontSize: '0.85rem' }}>
                            {exactMatch.name}
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestionsList.length > 0 && keyword.length >= 2 && (
                <Paper
                    elevation={3}
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 1,
                        maxHeight: 400,
                        overflow: 'auto',
                        zIndex: 2000,
                        bgcolor: '#333',
                        '&::-webkit-scrollbar': {
                            display: 'none', // Ẩn thanh cuộn trên Chrome, Safari, Edge
                        },
                        msOverflowStyle: 'none', // Ẩn thanh cuộn trên IE và Edge cũ
                        scrollbarWidth: 'none',  // Ẩn thanh cuộn trên Firefo
                    }}
                >
                    {suggestionsList.map((suggestion) => (
                        <Box
                            key={suggestion.id}
                            sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: '#444',
                                },
                            }}
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            <Box
                                sx={{
                                    width: 50,
                                    height: 50,
                                    position: 'relative',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                }}
                            >
                                <Image
                                    src={suggestion.imgUrl}
                                    alt={suggestion.title}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                />
                            </Box>
                            <Box>
                                <Box sx={{ fontWeight: 500, fontSize: '0.9rem', color: '#fff' }}>
                                    {suggestion.title}
                                </Box>
                                <Box sx={{ color: '#999', fontSize: '0.8rem' }}>
                                    {suggestion.name}
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Paper>
            )}
        </Box>
    );
};

export default SearchBar;
