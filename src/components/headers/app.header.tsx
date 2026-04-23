"use client";
import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Badge from '@mui/material/Badge';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MailIcon from '@mui/icons-material/Mail';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreIcon from '@mui/icons-material/MoreVert';
import { Avatar, Container} from '@mui/material';
import Link from 'next/link';
import { useRouter} from 'next/navigation';
import { useSession, signOut } from "next-auth/react";
import {useEffect} from "react";
import Image from 'next/image';
const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    flexGrow: 1,
    maxWidth: '600px',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: '20ch',
        },
    },
}));

const AppHeader = () => {
    const { data: session } = useSession();
    useEffect(()=>{
        if(session?.error === "RefreshAccessTokenError"){
            signOut({callbackUrl:"/auth/signin", redirect: true});
        }
    }, [session]);

    const router = useRouter();
    const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
    const pages = [
        { title: 'Playlists', path: '/playlist' },
        { title: "Like", path: '/like' },
        { title: 'Upload', path: "/track/upload" },
        { title: 'Dashboard', path: "/dashboard/user" }
    ];
    const handleProtectedNavigation = (path: string) => {
        if (!session) {
            router.push("/auth/signin");
        } else {
            router.push(path);
        }
    };
    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [mobileMoreAnchorEl, setMobileMoreAnchorEl] =
        React.useState<null | HTMLElement>(null);

    const isMenuOpen = Boolean(anchorEl);
    const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMobileMenuClose = () => {
        setMobileMoreAnchorEl(null);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        handleMobileMenuClose();
    };

    const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMobileMoreAnchorEl(event.currentTarget);
    };

    const handleRedirectHome = () => {
        router.push("/");
    }

    const menuId = 'primary-search-account-menu';
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            id={menuId}
            keepMounted
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            open={isMenuOpen}
            onClose={handleMenuClose}
        >
            {session?.user.role === 'SUPER_ADMIN' ?
                <MenuItem>
                    <Link href="/dashboard/user" style={{
                        textDecoration: 'none',
                        color: 'unset',}}>
                        Admin
                    </Link>
                </MenuItem>
                :
                null
            }
            <MenuItem>
                <Link href={`/profile/${session?.user.id}`}
                    style={{
                        textDecoration: 'none',
                        color: 'unset',
                    }}>
                    Profile

                </Link>
            </MenuItem>

            <MenuItem onClick={() => {
                signOut();
                handleMenuClose();
            }}>
                Logout
            </MenuItem>
        </Menu>
    );

    const mobileMenuId = 'primary-search-account-menu-mobile';
    const renderMobileMenu = (
        <Menu
            anchorEl={mobileMoreAnchorEl}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            id={mobileMenuId}
            keepMounted
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            open={isMobileMenuOpen}
            onClose={handleMobileMenuClose}
        >
            <MenuItem>
                <IconButton size="large" aria-label="show 4 new mails" color="inherit">
                    <Badge badgeContent={4} color="error">
                        <MailIcon />
                    </Badge>
                </IconButton>
                <p>Messages</p>
            </MenuItem>
            <MenuItem>
                <IconButton
                    size="large"
                    aria-label="show 17 new notifications"
                    color="inherit"
                >
                    <Badge badgeContent={17} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
                <p>Notifications</p>
            </MenuItem>
            <MenuItem onClick={handleProfileMenuOpen}>
                <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="primary-search-account-menu"
                    aria-haspopup="true"
                    color="inherit"
                >
                    <AccountCircle />
                </IconButton>
                <p>Profile</p>
            </MenuItem>
        </Menu>
    );
    return (
        <div>
            <Box sx={{ flexGrow: 1 }}>

                <AppBar position="static" sx={{ backgroundColor: '#030303' }}>
                    <Container>
                        <Toolbar>
                            <Typography
                                variant="h6"
                                noWrap
                                component="div"

                                sx={{ display: { xs: 'none', sm: 'block' }, marginRight: "50px", cursor: "pointer" }}
                                onClick={() => {
                                    handleRedirectHome()
                                }}
                            >
                                Sound Cloud
                            </Typography>
                            <Search style={{
                                width: "500px"
                            }}>
                                <SearchIconWrapper>
                                    <SearchIcon />
                                </SearchIconWrapper>
                                <StyledInputBase
                                    placeholder="Search…"
                                    inputProps={{ 'aria-label': 'search' }}
                                />
                            </Search>
                            <Box sx={{ flexGrow: 1 }} />
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: "center", gap: "20px" }}>
                                {pages.map((page) => (
                                    <Typography
                                        key={page.title}
                                        onClick={() => handleProtectedNavigation(page.path)} // Dùng onClick thay vì Link
                                        sx={{
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            '&:hover': { color: '#f50' } // Thêm hiệu ứng cho giống link
                                        }}
                                    >
                                        {page.title}
                                    </Typography>
                                ))}
                                {session ?
                                    <Avatar
                                        onClick={handleProfileMenuOpen}
                                        sx={{
                                            cursor: "pointer",
                                            width: 40, // Đặt kích thước cố định cho Avatar
                                            height: 40,
                                            position: 'relative', // Cần thiết để Next Image dùng layout="fill"
                                            overflow: 'hidden' // Đảm bảo ảnh không tràn ra ngoài vòng tròn
                                        }}
                                    >
                                        {/* 2. Dùng Next Image bên trong Avatar */}
                                        {session.user?.avatar && (
                                            <Image
                                                src={session.user.avatar} // Đường dẫn ảnh
                                                alt={session.user?.name || "User Avatar"} // Thẻ alt bắt buộc cho SEO/Accessibility
                                                fill // Ảnh sẽ lấp đầy component Avatar cha
                                                sizes="40px" // Báo cho Next.js biết kích thước ảnh trên màn hình để tối ưu
                                                style={{
                                                    objectFit: 'cover', // Ảnh không bị méo, giữ tỷ lệ
                                                }}
                                                // unoptimized={true} // Bật cái này nếu bạn không muốn Next.js tự nén ảnh (Cloudinary đã làm tốt rồi)
                                            />
                                        )}

                                        {/* 3. Phần Fallback (MUI tự xử lý nếu không có ảnh src) */}
                                        {!session.user?.avatar && session.user?.name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    :
                                        <Link href="/auth/signin" style={{                        textDecoration: 'none',
                                            color: 'unset',}}>
                                            Login
                                        </Link>

                                    // <Button
                                    //     variant="contained"
                                    //     sx={{ bgcolor: '#f50', '&:hover': { bgcolor: '#e40' } }}
                                    //     onClick={() => signIn("github")}
                                    // >
                                    //     Login with GitHub
                                    // </Button>
                                }
                            </Box>
                            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                                <IconButton
                                    size="large"
                                    aria-label="show more"
                                    aria-controls={mobileMenuId}
                                    aria-haspopup="true"
                                    onClick={handleMobileMenuOpen}
                                    color="inherit"
                                >
                                    <MoreIcon />
                                </IconButton>

                            </Box>
                        </Toolbar>
                    </Container>
                </AppBar>
                {renderMobileMenu}
                {renderMenu}
            </Box>
        </div>
    )
}

export default AppHeader;