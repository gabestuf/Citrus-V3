// Library imports
import { useState, useEffect } from 'react';
import { Button, Select, InputLabel, FormControl, InputAdornment, Input, MenuItem, Typography, TextField, CircularProgress, Paper, TableContainer, TableHead, Table, TableRow, TableCell, TableBody, Tooltip, Checkbox, IconButton, CardActionArea } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import GroupsIcon from '@mui/icons-material/Groups';

// Component imports
import { TransactionRelationList } from "../../resources/Transactions";
import { OutlinedCard } from "../../resources/Surfaces";
import { SectionTitle } from "../../resources/Labels";

// API imports
import { SessionManager } from "../../../api/sessionManager";
import { RouteManager } from "../../../api/routeManager";
import { DBManager } from "../../../api/db/dbManager";
import { AvatarIcon, AvatarToggle } from '../../resources/Avatars';
import { sortByDisplayName } from '../../../api/sorting';
import { TransactionRelation, TransactionManager, TransactionUser } from "../../../api/db/objectManagers/transactionManager";
import { makeNumeric } from '../../../api/strings';
import { Debugger } from '../../../api/debugger';

// Get user mananger from LS (which we know exists becuase we made it to this page)
const currentUserManager = SessionManager.getCurrentUserManager();

/**
 * Wrapper component for new transaction
 * @param {Props} props Currently unused
 */
export default function NewTransaction(props) {

    const [newTransactionState, setNewTransactionState] = useState({ // Information contained within new transaction
        users: [],
        group: null,
        currency: "USD",
        total: 0,
        title: ""
    });
    const [newTransactionPage, setNewTransactionPage] = useState("users"); // Which page of new transaction are we on

    function setTransactionUsers(newUsers) {
        setNewTransactionState({
            users: newUsers,
            group: newTransactionState.group,
            currency: newTransactionState.currency,
            total: newTransactionState.total,
            title: newTransactionState.title
        });
    }

    /**
     * Set newTransactionState's group
     * @param {string} groupId group ID (or null)
     */
    function setTransactionGroup(groupId) {
        setNewTransactionState({
            users: newTransactionState.users,
            group: groupId,
            currency: newTransactionState.currency,
            total: newTransactionState.total,
            title: newTransactionState.title
        })
    }

    function renderPage() {
        switch (newTransactionPage) {
            case "users":
                return <UsersPage setUsers={setTransactionUsers} newTransactionState={newTransactionState} setNewTransactionState={setNewTransactionState} setGroup={setTransactionGroup}/>;
            default:
                return <div>Error: invalid transaction page!</div>
        }
    }

    return (
        <div className="d-flex flex-column align-items-center justify-content-start w-100">
            <h1>New Expense</h1>
            { renderPage() }
        </div>
    )
}

function UsersPage({setUsers, setGroup, newTransactionState, setNewTransactionState}) {
    
    const [userData, setUserData] = useState({
        recents: [],
        groups: [],
        friends: []
    });
    const [checkedFriends, setCheckedFriends] = useState([]);
    const [checkedGroup, setCheckedGroup] = useState(null);
    const [submitEnable, setSubmitEnable] = useState(false);

    useEffect(() => {
        async function fetchUserData() {
            let friendIds = await currentUserManager.getFriends();
            let groupIds = await currentUserManager.getGroups();
            let newFriends = [];
            for (const friendId of friendIds) {
                const friendUserManager = DBManager.getUserManager(friendId);
                let friendName = await friendUserManager.getDisplayName();
                let friendPhoto = await friendUserManager.getPfpUrl();
                newFriends.push({id: friendId, displayName: friendName, pfpUrl: friendPhoto, checked: false});
            }
            let newGroups = [];
            for (const groupId of groupIds) {
                const groupUserManager = DBManager.getGroupManager(groupId);
                let groupName = await groupUserManager.getName();
                let groupMemberCount = await groupUserManager.getMemberCount();
                let groupMembers = await groupUserManager.getUsers();
                newGroups.push({id: groupId, name: groupName, memberCount: groupMemberCount, members: groupMembers});
            }
            setUserData({
                recents: userData.recents,
                groups: newGroups,
                friends: newFriends,
            })
        }

        fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserManager])

    function renderRecents() {
        return <div></div>
    }

    function handleGroupCheckbox(e, id) {
        e.preventDefault();
        if (checkedGroup === id) {
            setCheckedGroup(null);
            setSubmitEnable(checkedFriends.length > 0);
        } else {
            setCheckedGroup(id);
            setSubmitEnable(true);
        }
    }

    function renderGroups() {
        return userData.groups.map(group => {
            return (
                <OutlinedCard key={"group-" + group.id} backgroundColor={(!checkedGroup || checkedGroup === group.id) ? "white" : "lightgray"}>
                    <CardActionArea onClick={e => handleGroupCheckbox(e, group.id)}>
                        <div className="d-flex flex-row justify-content-between">
                            <div className="d-flex flex-row align-items-center gap-10">
                                <div className="d-flex flex-row align-items-center gap-10">
                                    <GroupsIcon />
                                    <div>x{group.memberCount}</div>
                                </div>
                                <div>{group.name}</div>
                            </div>
                            <Checkbox disabled={(checkedGroup !== null && checkedGroup !== group.id)} checked={checkedGroup === group.id} icon={<RadioButtonUncheckedIcon />} checkedIcon={<CancelIcon />} />
                        </div>
                    </CardActionArea>
                </OutlinedCard>
            )
        })
    }

    function handleFriendCheckbox(e, id) {
        e.preventDefault();
        if (checkedGroup) {
            return;
        }
        let newCheckedFriends = checkedFriends;
        if (newCheckedFriends.indexOf(id) !== -1) {
            newCheckedFriends = newCheckedFriends.filter(f => f.id === id);
            setCheckedFriends(newCheckedFriends);
        } else {
            newCheckedFriends.push(id); 
            setCheckedFriends(newCheckedFriends);
        }
        setSubmitEnable(newCheckedFriends.length > 0 || checkedGroup);
    }
    
    function renderFriends() {
        return userData.friends.map(friend => {
            return (
                <OutlinedCard key={"friend-" + friend.id} backgroundColor={(!checkedGroup) ? "white" : "lightgray"}>
                    <CardActionArea onClick={e => handleFriendCheckbox(e, friend.id)} >
                        <div className="d-flex flex-row justify-content-between">
                            <div className="d-flex flex-row align-items-center gap-10">
                                <AvatarIcon displayName={friend.displayName} src={friend.pfpUrl}/>
                                <div>{friend.displayName}</div>
                            </div>
                            <Checkbox disabled={checkedGroup !== null} checked={checkedFriends.includes(friend.id) && !checkedGroup} icon={<AddCircleOutlineIcon />} checkedIcon={<AddCircleIcon />} />
                        </div>
                    </CardActionArea>
                </OutlinedCard>
            )
        })
    }

    async function submitAdd() {
        let newUsersList = [];
        if (checkedGroup) {
            setGroup(checkedGroup);
            // checkedGroup is just an ID, so we have to dig up the group's data
            for (const groupData of userData.groups) {
                if (groupData.id === checkedGroup) {
                    // Get user info
                    for (const groupMemberId of groupData.members) {
                        const groupMemberUserManager = DBManager.getUserManager(groupMemberId);
                        let displayName = await groupMemberUserManager.getDisplayName();
                        let pfpUrl = await groupMemberUserManager.getPfpUrl();
                        newUsersList.push({id: groupMemberId, displayName: displayName, pfpUrl: pfpUrl});
                    }
                }
            }
        } else {
            for (const friendId of checkedFriends) {
                // CheckedFriends is just a list of IDs, so we have to dig up the friend's full data
                for (const friendData of userData.friends) {
                    if (friendData.id === friendId) {            
                        newUsersList.push({id: friendData.id, displayName: friendData.displayName, pfpUrl: friendData.pfpUrl});
                    }
                }
            }
            newUsersList.push({id: SessionManager.getUserId(), displayName: SessionManager.getDisplayName(), pfpUrl: SessionManager.getPfpUrl()}); // Add self
        }
        console.log(newUsersList)
        setUsers(newUsersList);
    }

    return (
        <div className="d-flex flex-column w-50 align-items-center gap-10">
            <div className="vh-60 w-100">
                <SectionTitle title="Recent"/>
                { renderRecents() }
                <SectionTitle title="Groups"/>
                { renderGroups() }
                <SectionTitle title="Friends"/>
                { renderFriends() }
            </div>
            <Button variant="contained" color="primary" className="w-50" disabled={!submitEnable} onClick={() => submitAdd()}>Next</Button>
        </div>

    )
}