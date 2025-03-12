import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import {
    AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText,
    Box, Checkbox, Button, Table, TableBody, TableCell, TableHead, TableRow, Collapse,
    CircularProgress, TextField, IconButton
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import CompareIcon from '@mui/icons-material/Compare';
import VisibilityIconSub from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import TuneIcon from '@mui/icons-material/Tune';
import GroupIcon from '@mui/icons-material/Group';
import DeleteIcon from '@mui/icons-material/Delete';
import ExploreIcon from '@mui/icons-material/Explore';
import TestIcon from '@mui/icons-material/NetworkCheck';
import axios from 'axios';
import { TreeView, TreeItem } from '@mui/lab';

// Sidebar styling
const drawerWidth = 240;
const Main = styled('main')(({ theme }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    marginLeft: drawerWidth,
}));

// Initial root drives (empty by default, populated via GUI)
const initialRootDrives = [];

function App() {
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [permissions, setPermissions] = useState({});
    const [operationsOpen, setOperationsOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [permissionsOpen, setPermissionsOpen] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [currentView, setCurrentView] = useState('permissions');
    const [rootDrives, setRootDrives] = useState(initialRootDrives);
    const [newRootDrive, setNewRootDrive] = useState('');
    const [newDomain, setNewDomain] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [testResults, setTestResults] = useState({});
    const [folderStructure, setFolderStructure] = useState({});
    const [credentials, setCredentials] = useState({});

    // Fetch folder structure for all root drives on mount
    useEffect(() => {
        const fetchFolders = async () => {
            const structure = {};
            for (const root of rootDrives) {
                const creds = credentials[root] || {};
                try {
                    const response = await axios.post('/test-root', {
                        path: root,
                        domain: creds.domain || '',
                        username: creds.username || '',
                        password: creds.password || '',
                    });
                    if (response.data.success) {
                        structure[root] = response.data.folders;
                    }
                } catch (error) {
                    console.error(`Failed to fetch folders for ${root}:`, error);
                }
            }
            setFolderStructure(structure);
        };
        if (rootDrives.length > 0) fetchFolders();
    }, [rootDrives, credentials]);

    // Handle folder selection
    const handleFolderSelect = (folder) => {
        setSelectedFolder(folder);
        setCurrentView('permissions');
        if (!permissions[folder]) {
            setPermissions((prev) => ({
                ...prev,
                [folder]: [
                    { user: 'Admin', read: true, write: true, execute: false },
                    { user: 'Group', read: true, write: false, execute: false },
                ],
            }));
        }
    };

    // Handle permission changes
    const handlePermissionChange = (user, permType, checked) => {
        setPermissions((prev) => ({
            ...prev,
            [selectedFolder]: prev[selectedFolder].map((perm) =>
                perm.user === user ? { ...perm, [permType]: checked } : perm
            ),
        }));
    };

    // Handle Apply button
    const handleApply = () => {
        setIsApplying(true);
        setTimeout(() => {
            setIsApplying(false);
            console.log('Permissions saved:', permissions[selectedFolder]);
        }, 1000);
    };

    // Toggle sub-menus
    const handleOperationsToggle = () => setOperationsOpen(!operationsOpen);
    const handleSettingsToggle = () => setSettingsOpen(!settingsOpen);
    const handlePermissionsToggle = () => setPermissionsOpen(!permissionsOpen);

    // Switch to Root Drive view
    const handleRootDriveView = () => {
        setCurrentView('rootDrive');
        setSelectedFolder(null);
    };

    // Go to home screen
    const handleHomeView = () => {
        setCurrentView('permissions');
        setSelectedFolder(null);
    };

    // Add new root drive with credentials
    const handleAddRootDrive = async () => {
    if (newRootDrive && !rootDrives.includes(newRootDrive)) {
        const root = newRootDrive;
        setRootDrives([...rootDrives, root]);
        setCredentials((prev) => ({
            ...prev,
            [root]: { domain: newDomain, username: newUsername, password: newPassword },
        }));
        try {
            const response = await axios.post('/test-root', {
                path: root,
                domain: newDomain,
                username: newUsername,
                password: newPassword,
            });
            console.log("Response from /test-root:", response.data); // Add this
            setTestResults((prev) => ({
                ...prev,
                [root]: response.data.message,
            }));
            if (response.data.success) {
                setFolderStructure((prev) => ({
                    ...prev,
                    [root]: response.data.folders,
                }));
            }
        } catch (error) {
            console.error(`Add failed for ${root}:`, error.response?.data || error);
            setTestResults((prev) => ({
                ...prev,
                [root]: `Failed: ${error.response?.data?.message || error.message}`,
            }));
        }
        setNewRootDrive('');
        setNewDomain('');
        setNewUsername('');
        setNewPassword('');
    }
};

    // Test connectivity and permissions
    const handleTestRootDrive = async (path) => {
        setTestResults((prev) => ({ ...prev, [path]: 'Testing...' }));
        const creds = credentials[path] || {};
        try {
            const response = await axios.post('/test-root', { // Changed from absolute URL
                path,
                domain: creds.domain || '',
                username: creds.username || '',
                password: creds.password || '',
            });
            setTestResults((prev) => ({
                ...prev,
                [path]: response.data.message,
            }));
            if (response.data.success) {
                setFolderStructure((prev) => ({
                    ...prev,
                    [path]: response.data.folders,
                }));
            }
        } catch (error) {
            console.error(`Test failed for ${path}:`, error.response?.data || error);
            setTestResults((prev) => ({
                ...prev,
                [path]: `Failed: ${error.response?.data?.message || error.message} - ${error.response?.data?.details || ''}`,
            }));
        }
    };

    // Remove root drive
    const handleRemoveRootDrive = (path) => {
        setRootDrives(rootDrives.filter((drive) => drive !== path));
        setFolderStructure((prev) => {
            const updated = { ...prev };
            delete updated[path];
            return updated;
        });
        setTestResults((prev) => {
            const updated = { ...prev };
            delete updated[path];
            return updated;
        });
        setPermissions((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((key) => {
                if (key.startsWith(path)) delete updated[key];
            });
            return updated;
        });
        setCredentials((prev) => {
            const updated = { ...prev };
            delete updated[path];
            return updated;
        });
    };

    // Render tree view based on root drives
    const renderTree = () => {
        if (rootDrives.length === 0) {
            return <Typography>No root drives specified</Typography>;
        }
        return rootDrives.map((root) => {
            const folders = folderStructure[root] || [];
            return (
                <TreeItem key={root} nodeId={root} label={root}>
                    {folders.length > 0 ? (
                        folders.map((folder) => (
                            <TreeItem
                                key={folder}
                                nodeId={folder}
                                label={folder.split('\\').pop()}
                                onClick={() => handleFolderSelect(folder)}
                            />
                        ))
                    ) : (
                        <Typography variant="body2" sx={{ pl: 2 }}>No folders found</Typography>
                    )}
                </TreeItem>
            );
        });
    };

    return (
        <Box sx={{ display: 'flex' }}>
            {/* Header */}
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Typography variant="h6" noWrap>
                        Drive Manager
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Drawer
                variant="permanent"
                sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth } }}
            >
                <Toolbar />
                <List>
                    <ListItem button onClick={handleHomeView}>
                        <ListItemIcon><ExploreIcon /></ListItemIcon>
                        <ListItemText primary="Explore" />
                    </ListItem>
                    <ListItem button onClick={handlePermissionsToggle}>
                        <ListItemIcon><LockIcon /></ListItemIcon>
                        <ListItemText primary="Permissions" />
                        {permissionsOpen ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
                    </ListItem>
                    <Collapse in={permissionsOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            <ListItem button sx={{ pl: 4 }}>
                                <ListItemIcon><VisibilityIconSub /></ListItemIcon>
                                <ListItemText primary="View" />
                            </ListItem>
                            <ListItem button sx={{ pl: 4 }}>
                                <ListItemIcon><EditIcon /></ListItemIcon>
                                <ListItemText primary="Modify" />
                            </ListItem>
                            <ListItem button sx={{ pl: 4 }}>
                                <ListItemIcon><BlockIcon /></ListItemIcon>
                                <ListItemText primary="Revoke" />
                            </ListItem>
                        </List>
                    </Collapse>
                    <ListItem button onClick={handleOperationsToggle}>
                        <ListItemIcon><ArrowRightIcon /></ListItemIcon>
                        <ListItemText primary="Operations" />
                        {operationsOpen ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
                    </ListItem>
                    <Collapse in={operationsOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            <ListItem button sx={{ pl: 4 }}>
                                <ListItemIcon><FileCopyIcon /></ListItemIcon>
                                <ListItemText primary="Copy" />
                            </ListItem>
                            <ListItem button sx={{ pl: 4 }}>
                                <ListItemIcon><MoveToInboxIcon /></ListItemIcon>
                                <ListItemText primary="Move" />
                            </ListItem>
                            <ListItem button sx={{ pl: 4 }}>
                                <ListItemIcon><CompareIcon /></ListItemIcon>
                                <ListItemText primary="Compare" />
                            </ListItem>
                        </List>
                    </Collapse>
                    <ListItem button>
                        <ListItemIcon><VisibilityIcon /></ListItemIcon>
                        <ListItemText primary="Monitoring" />
                    </ListItem>
                    <ListItem button onClick={handleSettingsToggle}>
                        <ListItemIcon><SettingsIcon /></ListItemIcon>
                        <ListItemText primary="Settings" />
                        {settingsOpen ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
                    </ListItem>
                    <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            <ListItem button sx={{ pl: 4 }} onClick={handleRootDriveView}>
                                <ListItemIcon><DriveEtaIcon /></ListItemIcon>
                                <ListItemText primary="Root Drive" />
                            </ListItem>
                            <ListItem button sx={{ pl: 4 }}>
                                <ListItemIcon><TuneIcon /></ListItemIcon>
                                <ListItemText primary="File Monitoring Settings" />
                            </ListItem>
                            <ListItem button sx={{ pl: 4 }}>
                                <ListItemIcon><GroupIcon /></ListItemIcon>
                                <ListItemText primary="Administrators" />
                            </ListItem>
                        </List>
                    </Collapse>
                </List>
            </Drawer>

            {/* Main Content */}
            <Main>
                <Toolbar />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* Tree View */}
                    <Box sx={{ width: '30%' }}>
                        <Typography variant="h6">Drive Explorer</Typography>
                        <TreeView
                            defaultCollapseIcon={<ArrowDropDownIcon />}
                            defaultExpandIcon={<ArrowRightIcon />}
                        >
                            {renderTree()}
                        </TreeView>
                    </Box>

                    {/* Dynamic Content */}
                    <Box sx={{ width: '70%' }}>
                        {currentView === 'permissions' && selectedFolder ? (
                            <>
                                <Typography variant="h6">Permissions for: {selectedFolder}</Typography>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>User/Group</TableCell>
                                            <TableCell>Read</TableCell>
                                            <TableCell>Write</TableCell>
                                            <TableCell>Execute</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {permissions[selectedFolder]?.map((perm) => (
                                            <TableRow key={perm.user}>
                                                <TableCell>{perm.user}</TableCell>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={perm.read}
                                                        onChange={(e) => handlePermissionChange(perm.user, 'read', e.target.checked)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={perm.write}
                                                        onChange={(e) => handlePermissionChange(perm.user, 'write', e.target.checked)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={perm.execute}
                                                        onChange={(e) => handlePermissionChange(perm.user, 'execute', e.target.checked)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        sx={{ mr: 1 }}
                                        onClick={handleApply}
                                        disabled={isApplying}
                                        startIcon={isApplying ? <CircularProgress size={20} /> : null}
                                    >
                                        {isApplying ? 'Applying...' : 'Apply'}
                                    </Button>
                                    <Button variant="outlined" color="secondary" disabled={isApplying}>
                                        Reset
                                    </Button>
                                </Box>
                            </>
                        ) : currentView === 'rootDrive' ? (
                            <>
                                <Typography variant="h6">Root DFS Paths</Typography>
                                <Box sx={{ mb: 2 }}>
                                    <TextField
                                        label="DFS Path (e.g., \\infosh.com\data)"
                                        value={newRootDrive}
                                        onChange={(e) => setNewRootDrive(e.target.value)}
                                        sx={{ mb: 1, width: '100%' }}
                                    />
                                    <TextField
                                        label="Domain"
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value)}
                                        sx={{ mb: 1, width: '100%' }}
                                    />
                                    <TextField
                                        label="Username"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        sx={{ mb: 1, width: '100%' }}
                                    />
                                    <TextField
                                        label="Password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        sx={{ mb: 1, width: '100%' }}
                                    />
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleAddRootDrive}
                                        disabled={!newRootDrive || !newUsername || !newPassword}
                                    >
                                        Add
                                    </Button>
                                </Box>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>DFS Path</TableCell>
                                            <TableCell>Test Result</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rootDrives.map((path) => (
                                            <TableRow key={path}>
                                                <TableCell>{path}</TableCell>
                                                <TableCell>
                                                    {testResults[path] || 'Not tested'}
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleTestRootDrive(path)}
                                                    >
                                                        <TestIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        color="secondary"
                                                        onClick={() => handleRemoveRootDrive(path)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </>
                        ) : (
                            <Typography>Select an option from the sidebar or a folder to manage permissions</Typography>
                        )}
                    </Box>
                </Box>
            </Main>
        </Box>
    );
}

export default App;