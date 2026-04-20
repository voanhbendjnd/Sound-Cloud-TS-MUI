'use client'
import {Container} from "@mui/material";
import UploadPage from "@/app/(user)/track/upload/page";
import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import FirstTabs from "@/components/track/steps/first.tab";
import SecondTabs from "@/components/track/steps/second.tab";
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}
function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const UploadTabs = () => {
    const [value, setValue] = React.useState(0);
    const [trackAudio, setTrackAudio] = React.useState<File | null>(null);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%', border:"1px solid #ccc", mt:5, backgroundColor:'#121212' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab style={{color:'white'}} label="Tracks" {...a11yProps(0)} disabled={value !== 0} />
                    <Tab style={{color:'white'}} label="Basic information" {...a11yProps(1)} disabled={value !== 1} />
                </Tabs>
            </Box>
            <CustomTabPanel value={value} index={0}>
                <FirstTabs setValue={setValue} setTrackAudio={setTrackAudio} trackAudio={trackAudio} />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
                <SecondTabs setValue={setValue} trackAudio={trackAudio} setTrackAudio={setTrackAudio} />
            </CustomTabPanel>
        </Box>
    );
}
export default UploadTabs;